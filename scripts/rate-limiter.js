/**
 * Rate Limiter & Cost Protection
 * Prevents API abuse and controls costs for OpenAI and Anthropic
 */

const { getDB } = require('../db_connection.js');

class RateLimiter {
    constructor() {
        // In-memory store for rate limiting (use Redis in production)
        this.requestStore = new Map();
        this.costStore = new Map();

        // Configuration
        this.limits = {
            // Per-IP limits
            perIP: {
                requestsPerMinute: 10,
                requestsPerHour: 50,
                requestsPerDay: 200,
                sessionsPerHour: 5,
                sessionsPerDay: 20,
            },

            // Global limits
            global: {
                requestsPerMinute: 100,
                requestsPerHour: 500,
                requestsPerDay: 2000,
                maxConcurrentRequests: 20,
            },

            // Token limits
            tokens: {
                maxUserInput: 2000,        // ~8000 characters
                maxContextPerAgent: 3000,   // KB chunks + user input
                maxOutputPerAgent: 1500,    // Claude response
            },

            // Cost limits (USD)
            budget: {
                perSession: 0.10,           // Max $0.10 per session
                perHour: 2.00,              // Max $2/hour total
                perDay: 10.00,              // Max $10/day total
                perMonth: 200.00,           // Max $200/month total
            },
        };

        // Cost per token (USD per 1M tokens)
        this.costs = {
            openai: {
                embedding: 0.02,            // text-embedding-3-small
            },
            anthropic: {
                haiku: {
                    input: 0.25,
                    output: 1.25,
                },
                sonnet: {
                    input: 3.00,
                    output: 15.00,
                },
            },
        };

        // Active model
        this.activeModel = 'haiku'; // or 'sonnet'
    }

    /**
     * Check if request is allowed based on rate limits
     * @param {string} ip - Client IP address
     * @param {string} type - Request type ('query' or 'session')
     * @returns {Object} { allowed: boolean, reason: string, retryAfter: number }
     */
    async checkRateLimit(ip, type = 'query') {
        const now = Date.now();
        const key = `${ip}:${type}`;

        // Get or create request history
        if (!this.requestStore.has(key)) {
            this.requestStore.set(key, []);
        }

        const requests = this.requestStore.get(key);

        // Remove old requests (older than 24 hours)
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const recentRequests = requests.filter(ts => ts > dayAgo);
        this.requestStore.set(key, recentRequests);

        // Check per-minute limit
        const minuteAgo = now - 60 * 1000;
        const requestsPerMinute = recentRequests.filter(ts => ts > minuteAgo).length;
        if (requestsPerMinute >= this.limits.perIP.requestsPerMinute) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded: too many requests per minute',
                retryAfter: 60,
            };
        }

        // Check per-hour limit
        const hourAgo = now - 60 * 60 * 1000;
        const requestsPerHour = recentRequests.filter(ts => ts > hourAgo).length;
        const hourLimit = type === 'session'
            ? this.limits.perIP.sessionsPerHour
            : this.limits.perIP.requestsPerHour;

        if (requestsPerHour >= hourLimit) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded: too many requests per hour',
                retryAfter: 3600,
            };
        }

        // Check per-day limit
        const requestsPerDay = recentRequests.length;
        const dayLimit = type === 'session'
            ? this.limits.perIP.sessionsPerDay
            : this.limits.perIP.requestsPerDay;

        if (requestsPerDay >= dayLimit) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded: too many requests per day',
                retryAfter: 86400,
            };
        }

        // Check daily budget
        const budgetCheck = await this.checkDailyBudget();
        if (!budgetCheck.allowed) {
            return budgetCheck;
        }

        // All checks passed
        return { allowed: true };
    }

    /**
     * Record a successful request
     * @param {string} ip - Client IP
     * @param {string} type - Request type
     */
    recordRequest(ip, type = 'query') {
        const key = `${ip}:${type}`;
        const requests = this.requestStore.get(key) || [];
        requests.push(Date.now());
        this.requestStore.set(key, requests);
    }

    /**
     * Check if daily budget has been exceeded
     * @returns {Object} { allowed: boolean, reason: string, spent: number }
     */
    async checkDailyBudget() {
        try {
            const db = getDB();

            // Get today's spending from database
            const result = await db.query(`
                SELECT COALESCE(SUM(cost), 0) as total_cost
                FROM api_costs
                WHERE DATE(created_at) = CURRENT_DATE
            `);

            const spent = parseFloat(result.rows[0]?.total_cost || 0);

            if (spent >= this.limits.budget.perDay) {
                return {
                    allowed: false,
                    reason: `Daily budget exceeded ($${spent.toFixed(2)} / $${this.limits.budget.perDay})`,
                    spent: spent,
                };
            }

            return { allowed: true, spent: spent };

        } catch (error) {
            console.warn('Budget check failed (allowing request):', error.message);
            return { allowed: true, spent: 0 };
        }
    }

    /**
     * Estimate cost for an embedding request
     * @param {number} tokens - Number of tokens
     * @returns {number} Cost in USD
     */
    estimateEmbeddingCost(tokens) {
        return (tokens / 1_000_000) * this.costs.openai.embedding;
    }

    /**
     * Estimate cost for a Claude request
     * @param {number} inputTokens - Input tokens
     * @param {number} outputTokens - Output tokens
     * @param {string} model - 'haiku' or 'sonnet'
     * @returns {number} Cost in USD
     */
    estimateClaudeCost(inputTokens, outputTokens, model = this.activeModel) {
        const rates = this.costs.anthropic[model];
        const inputCost = (inputTokens / 1_000_000) * rates.input;
        const outputCost = (outputTokens / 1_000_000) * rates.output;
        return inputCost + outputCost;
    }

    /**
     * Validate input tokens are within limits
     * @param {string} text - Input text
     * @param {number} maxTokens - Maximum allowed tokens
     * @returns {Object} { valid: boolean, tokens: number, reason: string }
     */
    validateInput(text, maxTokens = this.limits.tokens.maxUserInput) {
        // Rough estimation: 1 token ≈ 4 characters
        const estimatedTokens = Math.ceil(text.length / 4);

        if (estimatedTokens > maxTokens) {
            return {
                valid: false,
                tokens: estimatedTokens,
                reason: `Input too long: ${estimatedTokens} tokens (max ${maxTokens})`,
            };
        }

        return { valid: true, tokens: estimatedTokens };
    }

    /**
     * Log API cost to database
     * @param {Object} params - Cost details
     */
    async logCost(params) {
        const {
            provider,      // 'openai' or 'anthropic'
            endpoint,      // 'embeddings' or 'messages'
            model,         // model name
            inputTokens,   // input tokens used
            outputTokens,  // output tokens used (0 for embeddings)
            cost,          // calculated cost
            ip,            // client IP
            requestId,     // optional request ID
        } = params;

        try {
            const db = getDB();

            await db.query(`
                INSERT INTO api_costs (
                    provider, endpoint, model,
                    input_tokens, output_tokens, cost,
                    ip_address, request_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                provider,
                endpoint,
                model,
                inputTokens,
                outputTokens || 0,
                cost,
                ip,
                requestId || null,
            ]);

        } catch (error) {
            console.error('Failed to log cost:', error.message);
            // Don't throw - logging failure shouldn't break the request
        }
    }

    /**
     * Get current spending stats
     * @returns {Object} Spending statistics
     */
    async getSpendingStats() {
        try {
            const db = getDB();

            const stats = await db.query(`
                SELECT
                    SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN cost ELSE 0 END) as hour_cost,
                    SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN cost ELSE 0 END) as day_cost,
                    SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN cost ELSE 0 END) as month_cost,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as hour_requests,
                    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as day_requests
                FROM api_costs
            `);

            const row = stats.rows[0];

            return {
                hour: {
                    cost: parseFloat(row.hour_cost || 0),
                    requests: parseInt(row.hour_requests || 0),
                    limit: this.limits.budget.perHour,
                    remaining: this.limits.budget.perHour - parseFloat(row.hour_cost || 0),
                },
                day: {
                    cost: parseFloat(row.day_cost || 0),
                    requests: parseInt(row.day_requests || 0),
                    limit: this.limits.budget.perDay,
                    remaining: this.limits.budget.perDay - parseFloat(row.day_cost || 0),
                },
                month: {
                    cost: parseFloat(row.month_cost || 0),
                    limit: this.limits.budget.perMonth,
                    remaining: this.limits.budget.perMonth - parseFloat(row.month_cost || 0),
                },
            };

        } catch (error) {
            console.error('Failed to get spending stats:', error.message);
            return null;
        }
    }

    /**
     * Clean up old rate limit data (run periodically)
     */
    cleanup() {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        for (const [key, requests] of this.requestStore.entries()) {
            const recent = requests.filter(ts => ts > oneDayAgo);
            if (recent.length === 0) {
                this.requestStore.delete(key);
            } else {
                this.requestStore.set(key, recent);
            }
        }
    }
}

// Singleton instance
let rateLimiterInstance = null;

function getRateLimiter() {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiter();

        // Cleanup old data every hour
        setInterval(() => {
            rateLimiterInstance.cleanup();
        }, 60 * 60 * 1000);
    }
    return rateLimiterInstance;
}

module.exports = {
    RateLimiter,
    getRateLimiter,
};

// Test if run directly
if (require.main === module) {
    const limiter = getRateLimiter();

    console.log('🛡️  Rate Limiter Configuration:');
    console.log('\n📊 Limits:');
    console.log('   Per IP:');
    console.log(`     - ${limiter.limits.perIP.requestsPerMinute} requests/minute`);
    console.log(`     - ${limiter.limits.perIP.requestsPerHour} requests/hour`);
    console.log(`     - ${limiter.limits.perIP.requestsPerDay} requests/day`);
    console.log(`     - ${limiter.limits.perIP.sessionsPerHour} sessions/hour`);
    console.log(`     - ${limiter.limits.perIP.sessionsPerDay} sessions/day`);

    console.log('\n   Budget:');
    console.log(`     - $${limiter.limits.budget.perHour}/hour`);
    console.log(`     - $${limiter.limits.budget.perDay}/day`);
    console.log(`     - $${limiter.limits.budget.perMonth}/month`);

    console.log('\n💰 Cost Estimates:');
    console.log(`   Embedding (1000 tokens): $${limiter.estimateEmbeddingCost(1000).toFixed(6)}`);
    console.log(`   Claude Haiku (2000 in, 1000 out): $${limiter.estimateClaudeCost(2000, 1000, 'haiku').toFixed(4)}`);
    console.log(`   Claude Sonnet (2000 in, 1000 out): $${limiter.estimateClaudeCost(2000, 1000, 'sonnet').toFixed(4)}`);

    console.log('\n✅ Rate limiter ready');
}
