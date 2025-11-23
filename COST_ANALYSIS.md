# Cost Analysis & Abuse Prevention

## 🚨 Potential Abuse Vectors

### 1. OpenAI Embeddings API

#### Current Exposure:
- **Model**: text-embedding-3-small
- **Cost**: $0.02 per 1M tokens (~$0.00002 per 1K tokens)
- **No limits currently**: Unlimited calls possible

#### Abuse Scenarios:

**Scenario A: Malicious Re-ingestion Loop**
- Attacker triggers ingestion repeatedly
- 33 files × ~5K tokens each = 165K tokens per ingestion
- Cost per ingestion: ~$0.0033
- **1000 re-ingestions = $3.30**
- **10,000 re-ingestions = $33**

**Scenario B: Query Spam**
- Each user query = 1 embedding call
- Average query: ~100 tokens
- Cost per query: ~$0.000002
- **1M queries = $2**
- **Less dangerous but still vulnerable**

#### Risk Level: 🟡 MODERATE
- Embeddings are cheap
- But unlimited ingestion could rack up costs
- Query spam is low risk

---

### 2. Anthropic Claude API

#### Current Exposure:
- **Model**: Claude 3.5 Sonnet (if accessible) or Haiku
- **Cost**:
  - Haiku: $0.25/1M input tokens, $1.25/1M output tokens
  - Sonnet: $3/1M input tokens, $15/1M output tokens
- **No limits currently**: Unlimited calls possible

#### Abuse Scenarios:

**Scenario A: Session Spam**
- Each session = 4 agent calls
- Each agent receives ~5 KB chunks (~1500 tokens) + user input (~500 tokens) = ~2000 input tokens
- Each agent outputs ~1000 tokens
- **Per session**: 8K input + 4K output = 12K tokens total

**Cost per session (Haiku)**:
- Input: 8K × $0.25/1M = $0.002
- Output: 4K × $1.25/1M = $0.005
- **Total: ~$0.007 per session**

**Cost per session (Sonnet)**:
- Input: 8K × $3/1M = $0.024
- Output: 4K × $15/1M = $0.060
- **Total: ~$0.084 per session**

**1000 sessions on Sonnet = $84**
**10,000 sessions on Sonnet = $840**

#### Risk Level: 🔴 HIGH
- Much more expensive than embeddings
- 4 API calls per user session
- Could quickly rack up hundreds of dollars
- **CRITICAL: Must implement rate limits**

---

### 3. Combined Attack Scenarios

**Scenario: Automated Bot Abuse**
- Bot hits `/api/session` endpoint repeatedly
- Each session costs $0.084 (Sonnet) or $0.007 (Haiku)
- **1000 sessions/hour × 24 hours = $2,016 (Sonnet) or $168 (Haiku)**

**Scenario: Distributed Attack**
- Multiple IPs hitting endpoint
- Harder to block with simple IP-based rate limiting
- Could bypass basic protections

**Scenario: Long-Context Exploitation**
- Attacker sends massive user input (10K+ tokens)
- Each agent receives bloated context
- Could 10x the cost per session

---

## 💰 Cost Breakdown Analysis

### Normal Usage (100 sessions/month)

| Component | Per Session | 100 Sessions | 1000 Sessions |
|-----------|-------------|--------------|---------------|
| Query Embedding | $0.000002 | $0.0002 | $0.002 |
| KB Embeddings | $0 (one-time) | $0 | $0 |
| Claude Haiku | $0.007 | $0.70 | $7 |
| Claude Sonnet | $0.084 | $8.40 | $84 |
| **Total (Haiku)** | **$0.007** | **$0.70** | **$7** |
| **Total (Sonnet)** | **$0.084** | **$8.40** | **$84** |

### Abuse Scenario (24 hours, no limits)

| Attack Type | Requests/Hour | 24 Hours | Cost (Haiku) | Cost (Sonnet) |
|-------------|---------------|----------|--------------|---------------|
| Slow Bot | 10 | 240 | $1.68 | $20.16 |
| Medium Bot | 100 | 2,400 | $16.80 | $201.60 |
| Fast Bot | 1000 | 24,000 | $168 | $2,016 |
| DDoS | 10,000 | 240,000 | $1,680 | $20,160 |

---

## 🛡️ Recommended Protection Layers

### Layer 1: API Key Protection (OpenAI & Anthropic)

**OpenAI Side:**
- Set monthly spending limit in OpenAI dashboard
- Set hard cap at $10/month
- Enable email alerts at $5

**Anthropic Side:**
- Set monthly spending limit in Anthropic dashboard
- Set hard cap at $50/month (Sonnet) or $10/month (Haiku)
- Enable email alerts at 50% threshold

**Priority**: 🔴 CRITICAL - Do this immediately

---

### Layer 2: Application Rate Limiting

#### Per-IP Rate Limits:
```javascript
// Per IP address
- 10 requests per hour (normal users)
- 100 requests per day (normal users)
- 5 requests per minute (prevent rapid spam)
```

#### Per-Session Rate Limits:
```javascript
// Per user session (if auth implemented)
- 5 sessions per hour per user
- 20 sessions per day per user
```

#### Global Rate Limits:
```javascript
// Across all users
- 1000 requests per hour (total)
- 10,000 requests per day (total)
```

**Priority**: 🔴 CRITICAL

---

### Layer 3: Input Validation & Sanitization

**Token Limits:**
```javascript
// User input limits
maxUserInput: 2000 tokens (~8000 chars)
maxContextPerAgent: 3000 tokens
maxOutputPerAgent: 1500 tokens
```

**Reject requests that:**
- Exceed token limits
- Contain only repetitive text
- Are empty or malformed

**Priority**: 🟡 HIGH

---

### Layer 4: Cost Tracking & Monitoring

**Real-time Cost Tracking:**
- Track tokens used per request
- Estimate cost per request
- Log to database or monitoring service
- Alert when daily threshold exceeded

**Daily Budget:**
```javascript
dailyBudget: {
    embeddings: $1,
    claude: $10,
    total: $11
}
```

**Auto-shutdown:**
- If daily budget exceeded → return 429 (Too Many Requests)
- Reset at midnight UTC
- Send alert to admin

**Priority**: 🟡 HIGH

---

### Layer 5: Vercel Edge Protection

**If deploying to Vercel:**
- Use Vercel Edge Config for rate limiting
- Enable Vercel Firewall
- Use Vercel Analytics to detect abuse patterns
- Set max execution time (prevent long-running requests)

**Priority**: 🟢 MEDIUM (after deployment)

---

### Layer 6: Authentication & Authorization

**Implement API keys for users:**
- Require API key for `/api/session` endpoint
- Track usage per API key
- Revoke abusive keys
- Implement waitlist/approval for new keys

**Priority**: 🟢 MEDIUM (v2 feature)

---

## 🎯 Recommended Implementation Order

### Phase 1: IMMEDIATE (Before any public exposure)
1. ✅ Set OpenAI spending limit ($10/month)
2. ✅ Set Anthropic spending limit ($50/month)
3. ✅ Implement per-IP rate limiting
4. ✅ Implement input token limits
5. ✅ Add request logging

### Phase 2: BEFORE DEPLOYMENT
1. ✅ Implement cost tracking
2. ✅ Add daily budget auto-shutdown
3. ✅ Set up monitoring/alerts
4. ✅ Test rate limiting thoroughly

### Phase 3: POST-DEPLOYMENT
1. Monitor usage patterns
2. Adjust rate limits based on real data
3. Implement API key system (if needed)
4. Add user authentication (if needed)

---

## 🔧 Implementation Checklist

### OpenAI API Protection
- [ ] Set spending limit in OpenAI dashboard
- [ ] Enable billing alerts
- [ ] Implement token counting before API calls
- [ ] Validate input length
- [ ] Cache embeddings (avoid re-computing)

### Anthropic API Protection
- [ ] Set spending limit in Anthropic dashboard
- [ ] Enable billing alerts
- [ ] Implement token counting before API calls
- [ ] Set max_tokens parameter
- [ ] Validate input length
- [ ] Implement exponential backoff for retries

### Rate Limiting
- [ ] Install rate limiting library (e.g., express-rate-limit)
- [ ] Implement per-IP limits
- [ ] Implement global limits
- [ ] Add rate limit headers to responses
- [ ] Log rate limit violations

### Cost Tracking
- [ ] Create cost tracking table in database
- [ ] Log every API call with cost estimate
- [ ] Create daily cost aggregation
- [ ] Set up daily budget checks
- [ ] Implement auto-shutdown when budget exceeded

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Create dashboard for API usage
- [ ] Set up email/SMS alerts for unusual activity
- [ ] Monitor token usage trends

---

## 📊 Recommended Limits (Conservative)

### OpenAI Embeddings
```javascript
limits: {
    maxInputTokens: 8000,        // Per request
    requestsPerMinute: 10,       // Per IP
    requestsPerHour: 100,        // Per IP
    requestsPerDay: 500,         // Per IP
    monthlySpendingCap: $10      // OpenAI dashboard
}
```

### Anthropic Claude
```javascript
limits: {
    maxInputTokens: 5000,        // Per agent call (total context)
    maxOutputTokens: 2000,       // Per agent call
    sessionsPerHour: 5,          // Per IP
    sessionsPerDay: 20,          // Per IP
    monthlySpendingCap: $50      // Anthropic dashboard (Sonnet)
}
```

### Global
```javascript
limits: {
    maxConcurrentRequests: 10,   // Across all users
    dailyBudget: $10,            // Total spend per day
    monthlyBudget: $200          // Total spend per month
}
```

---

## 🚨 Alert Thresholds

### Warning Alerts (Email)
- 50% of daily budget reached
- 80% of monthly budget reached
- Unusual spike in requests (>2x normal)
- Single IP making >100 requests/hour

### Critical Alerts (Email + SMS)
- 90% of daily budget reached
- 95% of monthly budget reached
- Potential DDoS pattern detected
- API errors >10% of requests

---

## 🔒 Emergency Shutdown Procedure

If abuse detected:

1. **Immediate**: Disable public endpoints
2. **Block**: Add abusive IPs to blocklist
3. **Review**: Check logs for attack pattern
4. **Notify**: Alert team via Slack/email
5. **Assess**: Calculate damage and cost
6. **Restore**: Re-enable with stricter limits

---

## 💡 Cost Optimization Tips

### Reduce Embedding Costs
- ✅ Cache query embeddings (same query = reuse)
- ✅ Only re-ingest KB when content changes
- ✅ Batch embed during ingestion (100 at a time)

### Reduce Claude Costs
- ✅ Use Haiku for simple tasks (5x cheaper)
- ✅ Only use Sonnet when necessary
- ✅ Limit context window (fewer KB chunks)
- ✅ Set lower max_tokens
- ✅ Implement response caching for common queries

### General
- ✅ Use CDN for static assets
- ✅ Implement response caching
- ✅ Compress API payloads
- ✅ Monitor and optimize slow endpoints

---

## 📈 Expected vs. Danger Thresholds

| Metric | Expected | Warning | Danger |
|--------|----------|---------|--------|
| Sessions/day | 10-50 | 200 | 1000+ |
| Cost/day | $0.50 | $5 | $20+ |
| Cost/month | $15 | $100 | $500+ |
| Requests/hour | 5-20 | 100 | 500+ |

---

## ✅ Next Steps

### Before proceeding to Prompt 2:
1. Set OpenAI spending limit
2. Set Anthropic spending limit
3. Implement basic rate limiting
4. Implement input validation
5. Add cost tracking foundation

### During Prompt 2:
- Build ingestion with cost awareness
- Add logging for all API calls
- Test rate limiting

### Before Deployment:
- Full security audit
- Load testing with rate limits
- Set up monitoring dashboard
- Document emergency procedures

---

**Priority**: 🔴 **IMPLEMENT PROTECTIONS BEFORE ANY PUBLIC ACCESS**

The Claude API is the biggest risk due to cost. We should implement at minimum:
- Spending caps at provider level
- Per-IP rate limiting
- Input token validation
- Daily budget auto-shutdown

This will protect against both accidental and malicious overuse.
