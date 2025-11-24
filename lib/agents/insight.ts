/**
 * Insight Agent
 * Emotional and psychological analysis based on creative archetypes
 */

import { searchKB } from '@/lib/rag/search';
import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_INSIGHT,
  RAG_TOP_K,
  RAG_SIMILARITY_THRESHOLD,
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
    // Step 1: Search KB for relevant context
    const kbQuery = `creative archetypes emotional patterns psychological frameworks core wound core desire ${userText.slice(0, 100)}`;

    const searchResults = await searchKB(kbQuery, {
      k: RAG_TOP_K,
      similarityThreshold: RAG_SIMILARITY_THRESHOLD,
    });

    // Format KB context
    const kbContext = searchResults.length > 0
      ? searchResults
          .map((r, i) => {
            const source = r.sectionTitle
              ? `${r.sourceFile} - ${r.sectionTitle}`
              : r.sourceFile;
            return `[${i + 1}] Source: ${source}\n${r.content}`;
          })
          .join('\n\n---\n\n')
      : 'No relevant KB context found.';

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
