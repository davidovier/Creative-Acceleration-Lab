/**
 * Insight Agent
 * Emotional and psychological analysis based on creative archetypes
 */

import { searchKbForAgent, formatSearchResultsForPrompt } from '@/lib/rag/search';
import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_INSIGHT,
  debugLog,
} from './config';
import { buildInsightSystemPrompt } from './prompts';

/**
 * Insight Agent
 * Analyzes user's creative challenge through emotional and archetypal lens
 */
export async function runInsightAgent(userText: string): Promise<InsightOutput> {
  const startTime = Date.now();
  console.log('[Insight Agent] Starting analysis...');
  debugLog('InsightAgent', 'Input length', { chars: userText.length });

  try {
    // Step 1: Search KB using agent-aware search
    const searchResults = await searchKbForAgent({
      agent: 'insight',
      userText,
    });

    // Format KB context
    const kbContext = formatSearchResultsForPrompt(searchResults);

    debugLog('InsightAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder
    const systemPrompt = buildInsightSystemPrompt(kbContext);

    // Step 3: Call Claude with fallback
    const fallbackObject: InsightOutput = {
      emotional_summary: 'Unable to analyze emotional state due to parsing error.',
      core_wound: 'Analysis unavailable',
      core_desire: 'Analysis unavailable',
      archetype_guess: 'Unknown',
      supporting_quotes: [],
    };

    const result = await callClaudeWithFallback<InsightOutput>(
      systemPrompt,
      userText,
      fallbackObject,
      {
        model: AGENT_MODEL,
        maxTokens: MAX_TOKENS_INSIGHT,
        temperature: AGENT_TEMPERATURE,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Insight Agent] Analysis complete (${duration}ms)`);
    debugLog('InsightAgent', 'Output', {
      archetype: result.archetype_guess,
      quotesCount: result.supporting_quotes.length,
      duration,
    });

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Insight Agent] Error after ${duration}ms:`, error.message);
    throw new Error(`InsightAgent: ${error.message}`);
  }
}
