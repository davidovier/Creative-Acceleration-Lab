# API Integration Guide - Rate Limiter & Cost Tracking

This guide shows how to integrate the rate limiter and cost tracking into your API endpoints.

---

## 🎯 Quick Start

### 1. Import the Rate Limiter

```javascript
const { getRateLimiter } = require('./scripts/rate-limiter.js');
const limiter = getRateLimiter();
```

### 2. Basic Usage Pattern

```javascript
// In your API endpoint
async function handleRequest(req, res) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Step 1: Check rate limit
    const rateLimitCheck = await limiter.checkRateLimit(clientIP, 'query');
    if (!rateLimitCheck.allowed) {
        return res.status(429).json({
            error: rateLimitCheck.reason,
            retryAfter: rateLimitCheck.retryAfter,
        });
    }

    // Step 2: Validate input
    const userQuery = req.body.query;
    const validation = limiter.validateInput(userQuery);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
    }

    // Step 3: Record request
    limiter.recordRequest(clientIP, 'query');

    // Step 4: Make API calls with cost tracking
    // ... (see examples below)

    return res.json({ result: 'success' });
}
```

---

## 📋 Complete Examples

### Example 1: Embedding Endpoint

```javascript
// File: api/embed.js
const { getRateLimiter } = require('../scripts/rate-limiter.js');
const OpenAI = require('openai');

const limiter = getRateLimiter();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedText(req, res) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { text } = req.body;

    try {
        // 1. Rate limit check
        const rateLimitCheck = await limiter.checkRateLimit(clientIP, 'query');
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                error: rateLimitCheck.reason,
                retryAfter: rateLimitCheck.retryAfter,
            });
        }

        // 2. Input validation
        const validation = limiter.validateInput(text);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.reason });
        }

        // 3. Record request
        limiter.recordRequest(clientIP, 'query');

        // 4. Call OpenAI API
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        // 5. Track cost
        const tokens = response.usage.total_tokens;
        const cost = limiter.estimateEmbeddingCost(tokens);

        await limiter.logCost({
            provider: 'openai',
            endpoint: 'embeddings',
            model: 'text-embedding-3-small',
            inputTokens: tokens,
            outputTokens: 0,
            cost: cost,
            ip: clientIP,
            requestId: response.id || null,
        });

        // 6. Return result
        return res.json({
            embedding: response.data[0].embedding,
            tokensUsed: tokens,
            estimatedCost: cost,
        });

    } catch (error) {
        console.error('Embedding error:', error);
        return res.status(500).json({ error: 'Embedding failed' });
    }
}

module.exports = { embedText };
```

### Example 2: Claude Session Endpoint (4 Agents)

```javascript
// File: api/session.js
const { getRateLimiter } = require('../scripts/rate-limiter.js');
const Anthropic = require('@anthropic-ai/sdk');

const limiter = getRateLimiter();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function runSession(req, res) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { userQuery } = req.body;

    try {
        // 1. Rate limit check (session-specific limits)
        const rateLimitCheck = await limiter.checkRateLimit(clientIP, 'session');
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                error: rateLimitCheck.reason,
                retryAfter: rateLimitCheck.retryAfter,
            });
        }

        // 2. Input validation
        const validation = limiter.validateInput(userQuery);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.reason });
        }

        // 3. Record session start
        limiter.recordRequest(clientIP, 'session');

        // 4. Run 4 agents sequentially
        const agents = ['Insight Agent', 'Story Architect', 'Prototype Engineer', 'Symbol Weaver'];
        const results = [];

        for (const agentName of agents) {
            // Get relevant KB chunks (mock for now)
            const context = "...relevant KB content...";

            // Call Claude API
            const message = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [{
                    role: 'user',
                    content: `Context:\n${context}\n\nUser Query: ${userQuery}\n\nRespond as ${agentName}.`
                }],
            });

            // Extract token usage
            const inputTokens = message.usage.input_tokens;
            const outputTokens = message.usage.output_tokens;
            const cost = limiter.estimateClaudeCost(inputTokens, outputTokens, 'haiku');

            // Log cost for this agent
            await limiter.logCost({
                provider: 'anthropic',
                endpoint: 'messages',
                model: 'claude-3-haiku-20240307',
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                cost: cost,
                ip: clientIP,
                requestId: message.id,
            });

            results.push({
                agent: agentName,
                response: message.content[0].text,
                tokensUsed: inputTokens + outputTokens,
                cost: cost,
            });
        }

        // 5. Calculate total cost
        const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

        // 6. Return results
        return res.json({
            results: results,
            totalCost: totalCost,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Session error:', error);
        return res.status(500).json({ error: 'Session failed' });
    }
}

module.exports = { runSession };
```

### Example 3: Express Middleware

```javascript
// File: middleware/rateLimitMiddleware.js
const { getRateLimiter } = require('../scripts/rate-limiter.js');

function createRateLimitMiddleware(type = 'query') {
    const limiter = getRateLimiter();

    return async function rateLimitMiddleware(req, res, next) {
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        try {
            // Check rate limit
            const result = await limiter.checkRateLimit(clientIP, type);

            if (!result.allowed) {
                return res.status(429).json({
                    error: result.reason,
                    retryAfter: result.retryAfter,
                });
            }

            // Record successful check
            limiter.recordRequest(clientIP, type);

            // Attach limiter to request for later use
            req.rateLimiter = limiter;
            req.clientIP = clientIP;

            next();

        } catch (error) {
            console.error('Rate limit middleware error:', error);
            // Allow request on error (fail open)
            next();
        }
    };
}

// Usage in Express app:
// app.use('/api/session', createRateLimitMiddleware('session'));
// app.use('/api/query', createRateLimitMiddleware('query'));

module.exports = { createRateLimitMiddleware };
```

### Example 4: Input Validation Middleware

```javascript
// File: middleware/validateInput.js
const { getRateLimiter } = require('../scripts/rate-limiter.js');

function validateInputMiddleware(req, res, next) {
    const limiter = getRateLimiter();
    const { query, text, userQuery } = req.body;

    // Get the actual input text
    const inputText = query || text || userQuery;

    if (!inputText) {
        return res.status(400).json({ error: 'Missing input text' });
    }

    // Validate token count
    const validation = limiter.validateInput(inputText);

    if (!validation.valid) {
        return res.status(400).json({
            error: validation.reason,
            estimatedTokens: validation.tokens,
            maxTokens: limiter.limits.tokens.maxUserInput,
        });
    }

    // Attach validation info to request
    req.validatedInput = {
        text: inputText,
        estimatedTokens: validation.tokens,
    };

    next();
}

module.exports = { validateInputMiddleware };
```

---

## 🔧 Next.js API Route Example

```javascript
// File: pages/api/session.js
import { getRateLimiter } from '../../scripts/rate-limiter.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const limiter = getRateLimiter();
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // Rate limit check
        const rateLimitCheck = await limiter.checkRateLimit(clientIP, 'session');
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                error: rateLimitCheck.reason,
                retryAfter: rateLimitCheck.retryAfter,
            });
        }

        // Input validation
        const { userQuery } = req.body;
        const validation = limiter.validateInput(userQuery);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.reason });
        }

        // Record request
        limiter.recordRequest(clientIP, 'session');

        // Process request (call your agents)
        // ...

        // Log costs
        // await limiter.logCost({ ... });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
```

---

## 📊 Cost Logging Best Practices

### 1. Always Log After API Calls

```javascript
// ✅ Good: Log actual usage
const response = await openai.embeddings.create({ ... });
await limiter.logCost({
    provider: 'openai',
    inputTokens: response.usage.total_tokens,
    cost: limiter.estimateEmbeddingCost(response.usage.total_tokens),
    // ...
});

// ❌ Bad: Estimate without actual call
await limiter.logCost({
    inputTokens: 1000, // Guess
    // ...
});
```

### 2. Include Request IDs

```javascript
// ✅ Good: Include provider's request ID
await limiter.logCost({
    requestId: response.id,  // From OpenAI/Anthropic response
    // ...
});

// ❌ Bad: No request ID
await limiter.logCost({
    requestId: null,
    // ...
});
```

### 3. Handle Errors Gracefully

```javascript
try {
    await limiter.logCost({ ... });
} catch (error) {
    console.error('Cost logging failed:', error);
    // Don't throw - logging failure shouldn't break the request
}
```

---

## 🚨 Error Handling Examples

### Rate Limit Exceeded (429)

```javascript
{
    "error": "Rate limit exceeded: too many requests per minute",
    "retryAfter": 60
}
```

**Response Headers** (recommended):
```javascript
res.setHeader('Retry-After', rateLimitCheck.retryAfter);
res.setHeader('X-RateLimit-Limit', limiter.limits.perIP.requestsPerMinute);
res.setHeader('X-RateLimit-Remaining', remaining);
```

### Budget Exceeded (429)

```javascript
{
    "error": "Daily budget exceeded ($10.50 / $10.00)",
    "retryAfter": 43200  // seconds until midnight
}
```

### Input Too Long (400)

```javascript
{
    "error": "Input too long: 2500 tokens (max 2000)",
    "estimatedTokens": 2500,
    "maxTokens": 2000
}
```

---

## 📈 Monitoring Your API

### Get Spending Stats

```javascript
const stats = await limiter.getSpendingStats();

console.log('Today:', stats.day.cost, 'of', stats.day.limit);
console.log('This hour:', stats.hour.cost, 'of', stats.hour.limit);
console.log('This month:', stats.month.cost, 'of', stats.month.limit);
```

### Check Specific IP

```javascript
const { getDB } = require('./db_connection.js');
const db = getDB();

const ipStats = await db.query(`
    SELECT
        COUNT(*) as requests,
        SUM(cost) as total_cost,
        MAX(created_at) as last_request
    FROM api_costs
    WHERE ip_address = $1
    AND created_at >= NOW() - INTERVAL '24 hours'
`, ['192.168.1.100']);
```

### Block Abusive IP

```javascript
const { getDB } = require('./db_connection.js');
const db = getDB();

// Block for 24 hours
await db.query('SELECT block_ip($1, $2, $3)', [
    '192.168.1.100',
    'Exceeded daily request limit',
    24  // hours
]);

// Block permanently
await db.query('SELECT block_ip($1, $2, $3)', [
    '192.168.1.100',
    'Malicious activity detected',
    null  // permanent
]);
```

---

## 🎯 Recommended Integration Steps

1. **Add middleware to all API routes**
   ```javascript
   app.use('/api/*', createRateLimitMiddleware('query'));
   app.use('/api/session', createRateLimitMiddleware('session'));
   ```

2. **Validate all user inputs**
   ```javascript
   app.use('/api/*', validateInputMiddleware);
   ```

3. **Log all API costs**
   ```javascript
   // After every OpenAI/Anthropic call
   await limiter.logCost({ ... });
   ```

4. **Monitor spending daily**
   ```javascript
   // Cron job or scheduled task
   const stats = await limiter.getSpendingStats();
   if (stats.day.cost > stats.day.limit * 0.8) {
       sendAlert('Warning: 80% of daily budget used');
   }
   ```

5. **Test rate limiting**
   ```bash
   node scripts/test-rate-limiter.js
   ```

---

## ✅ Integration Checklist

Before deploying:

- [ ] Rate limit middleware added to all endpoints
- [ ] Input validation on all user-provided text
- [ ] Cost logging after every API call
- [ ] Error handling for 429 and 400 responses
- [ ] Rate limit headers in responses
- [ ] Monitoring dashboard or cron job
- [ ] Provider spending limits set (OpenAI + Anthropic)
- [ ] Test with actual API calls
- [ ] Emergency shutdown procedure documented

---

## 📞 Support

If you encounter issues:

1. Check rate limiter logs: `console.log` statements in `rate-limiter.js`
2. Verify database connection: `node scripts/test-rate-limiter.js`
3. Check spending: `SELECT * FROM today_spending;`
4. Review blocked IPs: `SELECT * FROM rate_limit_blocks;`

---

**Ready to integrate!** Start with one endpoint and test thoroughly before rolling out to all routes.
