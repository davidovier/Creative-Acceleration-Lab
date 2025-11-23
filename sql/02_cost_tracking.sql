-- Cost Tracking and Rate Limiting Tables
-- Tracks API usage and costs to prevent abuse

-- ============================================================================
-- STEP 1: Create api_costs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_costs (
    id BIGSERIAL PRIMARY KEY,

    -- API details
    provider TEXT NOT NULL,           -- 'openai' or 'anthropic'
    endpoint TEXT NOT NULL,           -- 'embeddings' or 'messages'
    model TEXT NOT NULL,              -- model name

    -- Token usage
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,

    -- Cost (USD)
    cost DECIMAL(10, 6) NOT NULL,    -- Actual cost in dollars

    -- Request tracking
    ip_address INET,                  -- Client IP
    request_id TEXT,                  -- Optional request identifier
    user_id TEXT,                     -- Optional user ID (for future auth)

    -- Metadata
    metadata JSONB DEFAULT '{}',      -- Additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_cost CHECK (cost >= 0),
    CONSTRAINT valid_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0),
    CONSTRAINT valid_provider CHECK (provider IN ('openai', 'anthropic'))
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index for time-based queries (daily/hourly budgets)
CREATE INDEX IF NOT EXISTS api_costs_created_at_idx
ON api_costs(created_at DESC);

-- Index for provider-specific queries
CREATE INDEX IF NOT EXISTS api_costs_provider_idx
ON api_costs(provider, created_at DESC);

-- Index for IP-based rate limiting
CREATE INDEX IF NOT EXISTS api_costs_ip_address_idx
ON api_costs(ip_address, created_at DESC);

-- Index for cost aggregation (using created_at directly, not DATE() function)
CREATE INDEX IF NOT EXISTS api_costs_cost_date_idx
ON api_costs(created_at, cost);

-- ============================================================================
-- STEP 3: Create rate_limit_blocks table (for blocking abusive IPs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_blocks (
    id BIGSERIAL PRIMARY KEY,

    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,    -- NULL = permanent
    block_count INTEGER DEFAULT 1,             -- Number of times blocked

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for checking if IP is blocked
-- Simple index without WHERE clause (partial indexes with NOW() not allowed)
CREATE INDEX IF NOT EXISTS rate_limit_blocks_ip_idx
ON rate_limit_blocks(ip_address, blocked_until);

-- ============================================================================
-- STEP 4: Create views for monitoring
-- ============================================================================

-- View: Hourly cost summary
CREATE OR REPLACE VIEW hourly_costs AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    provider,
    COUNT(*) as request_count,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost
FROM api_costs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), provider
ORDER BY hour DESC;

-- View: Daily cost summary
CREATE OR REPLACE VIEW daily_costs AS
SELECT
    DATE(created_at) as date,
    provider,
    COUNT(*) as request_count,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost,
    MAX(cost) as max_cost
FROM api_costs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), provider
ORDER BY date DESC;

-- View: Current day spending
CREATE OR REPLACE VIEW today_spending AS
SELECT
    provider,
    COUNT(*) as requests,
    SUM(cost) as spent,
    ROUND(CAST((SUM(cost) / 10.00) * 100 AS NUMERIC), 2) as budget_percent  -- Assuming $10 daily budget
FROM api_costs
WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
GROUP BY provider;

-- View: Top IPs by cost (last 24 hours)
CREATE OR REPLACE VIEW top_ips_by_cost AS
SELECT
    ip_address,
    COUNT(*) as request_count,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost,
    MAX(created_at) as last_request
FROM api_costs
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY total_cost DESC
LIMIT 100;

-- ============================================================================
-- STEP 5: Create helper functions
-- ============================================================================

-- Function to check if an IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    is_blocked BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM rate_limit_blocks
        WHERE ip_address = check_ip
        AND (blocked_until IS NULL OR blocked_until > NOW())
    ) INTO is_blocked;

    RETURN is_blocked;
END;
$$;

-- Function to block an IP
CREATE OR REPLACE FUNCTION block_ip(
    block_ip INET,
    block_reason TEXT,
    duration_hours INTEGER DEFAULT NULL  -- NULL = permanent
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO rate_limit_blocks (
        ip_address,
        reason,
        blocked_until,
        block_count
    ) VALUES (
        block_ip,
        block_reason,
        CASE
            WHEN duration_hours IS NULL THEN NULL
            ELSE NOW() + (duration_hours || ' hours')::INTERVAL
        END,
        1
    )
    ON CONFLICT (ip_address) DO UPDATE SET
        reason = EXCLUDED.reason,
        blocked_until = EXCLUDED.blocked_until,
        block_count = rate_limit_blocks.block_count + 1,
        updated_at = NOW();
END;
$$;

-- Function to unblock an IP
CREATE OR REPLACE FUNCTION unblock_ip(unblock_ip INET)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM rate_limit_blocks
    WHERE ip_address = unblock_ip;
END;
$$;

-- Function to get spending for a time period
CREATE OR REPLACE FUNCTION get_spending(
    hours_ago INTEGER DEFAULT 24
)
RETURNS TABLE (
    provider TEXT,
    requests BIGINT,
    total_cost NUMERIC,
    avg_cost NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        api_costs.provider,
        COUNT(*)::BIGINT as requests,
        SUM(api_costs.cost)::NUMERIC as total_cost,
        AVG(api_costs.cost)::NUMERIC as avg_cost
    FROM api_costs
    WHERE api_costs.created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
    GROUP BY api_costs.provider;
END;
$$;

-- ============================================================================
-- STEP 6: Create triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_rate_limit_blocks_updated_at
    BEFORE UPDATE ON rate_limit_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Create cleanup job (optional, for maintenance)
-- ============================================================================

-- Function to clean up old cost data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_costs()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM api_costs
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Clean up expired IP blocks
    DELETE FROM rate_limit_blocks
    WHERE blocked_until IS NOT NULL
    AND blocked_until < NOW();
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after setup to verify)
-- ============================================================================

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('api_costs', 'rate_limit_blocks');

-- Check if views exist
-- SELECT viewname FROM pg_views
-- WHERE viewname IN ('hourly_costs', 'daily_costs', 'today_spending', 'top_ips_by_cost');

-- Check current spending
-- SELECT * FROM today_spending;

-- Test IP blocking
-- SELECT block_ip('192.168.1.1'::INET, 'Testing', 24);
-- SELECT is_ip_blocked('192.168.1.1'::INET);
-- SELECT unblock_ip('192.168.1.1'::INET);

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Cost Tracking:
-- - Logs every API call with provider, tokens, and cost
-- - Aggregates costs by hour, day, month
-- - Tracks per-IP usage
--
-- Rate Limiting:
-- - IP-based blocking (temporary or permanent)
-- - Automatic expiration of temporary blocks
-- - Track repeat offenders
--
-- Monitoring:
-- - Hourly/daily cost views
-- - Today's spending with budget percentage
-- - Top IPs by cost
-- - Easy to query and alert
--
-- Maintenance:
-- - Run cleanup_old_costs() periodically (e.g., monthly cron job)
-- - Keep last 90 days of cost data
-- - Auto-remove expired IP blocks
--
-- ============================================================================
