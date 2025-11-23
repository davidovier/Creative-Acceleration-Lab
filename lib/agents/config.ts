/**
 * Agent Configuration
 * Centralized settings for all agents: models, tokens, temperature, debugging
 */

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

/**
 * Claude model to use for all agents
 * Can be overridden with CLAUDE_MODEL environment variable
 */
export const AGENT_MODEL = process.env.CLAUDE_MODEL ?? 'claude-3-5-haiku-20241022';

/**
 * Temperature for agent responses
 * Higher = more creative, Lower = more consistent
 */
export const AGENT_TEMPERATURE = 1.0;

// ============================================================================
// TOKEN LIMITS PER AGENT
// ============================================================================

/**
 * Max tokens for Insight Agent
 * Outputs: emotional_summary, core_wound, core_desire, archetype, quotes
 */
export const MAX_TOKENS_INSIGHT = 1500;

/**
 * Max tokens for Story Agent
 * Outputs: hero, villain, current/desired chapters, story paragraph
 */
export const MAX_TOKENS_STORY = 1500;

/**
 * Max tokens for Prototype Agent
 * Outputs: goal, constraints, 5-day plan, AI features, risks
 */
export const MAX_TOKENS_PROTOTYPE = 2000;

/**
 * Max tokens for Symbol Agent
 * Outputs: symbols, tattoos, UI motifs, color palette
 */
export const MAX_TOKENS_SYMBOL = 1500;

// ============================================================================
// RAG CONFIGURATION
// ============================================================================

/**
 * Number of KB chunks to retrieve per agent
 */
export const RAG_TOP_K = 8;

/**
 * Similarity threshold for KB search
 */
export const RAG_SIMILARITY_THRESHOLD = 0.5;

// ============================================================================
// DEBUGGING & LOGGING
// ============================================================================

/**
 * Enable detailed agent debug logs
 * Set AGENT_DEBUG=true in .env to enable
 */
export const ENABLE_AGENT_DEBUG_LOGS = process.env.AGENT_DEBUG === 'true';

/**
 * Log level (info, warn, error)
 */
export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

/**
 * Whether to log token usage and costs
 */
export const ENABLE_COST_LOGGING = process.env.ENABLE_COST_LOGGING !== 'false'; // default true

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Minimum user input length (characters)
 */
export const MIN_USER_INPUT_LENGTH = 10;

/**
 * Maximum user input length (characters)
 */
export const MAX_USER_INPUT_LENGTH = 2000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all agent configuration as object (useful for debugging)
 */
export function getAgentConfig() {
  return {
    model: AGENT_MODEL,
    temperature: AGENT_TEMPERATURE,
    tokenLimits: {
      insight: MAX_TOKENS_INSIGHT,
      story: MAX_TOKENS_STORY,
      prototype: MAX_TOKENS_PROTOTYPE,
      symbol: MAX_TOKENS_SYMBOL,
    },
    rag: {
      topK: RAG_TOP_K,
      similarityThreshold: RAG_SIMILARITY_THRESHOLD,
    },
    debugging: {
      debugLogs: ENABLE_AGENT_DEBUG_LOGS,
      logLevel: LOG_LEVEL,
      costLogging: ENABLE_COST_LOGGING,
    },
    validation: {
      minInputLength: MIN_USER_INPUT_LENGTH,
      maxInputLength: MAX_USER_INPUT_LENGTH,
    },
  };
}

/**
 * Log debug message (only if debug enabled)
 */
export function debugLog(agent: string, message: string, data?: any) {
  if (ENABLE_AGENT_DEBUG_LOGS) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] [${agent}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
