/**
 * Symbol Weaver Agent
 * Visual symbols and design elements
 */

import { searchKbForAgent, formatSearchResultsForPrompt } from '@/lib/rag/search';
import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput, SymbolOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_SYMBOL,
  debugLog,
} from './config';
import { buildSymbolSystemPrompt, formatInsightForPrompt, formatStoryForPrompt, formatPrototypeForPrompt } from './prompts';

/**
 * Symbol Weaver Agent
 * Generates visual symbols and design elements
 */
export async function runSymbolAgent(
  userText: string,
  insight: InsightOutput,
  story: StoryOutput,
  prototype: PrototypeOutput
): Promise<SymbolOutput> {
  const startTime = Date.now();
  console.log('[Symbol Agent] Weaving symbols...');
  debugLog('SymbolAgent', 'Input', {
    userTextLength: userText.length,
    archetype: insight.archetype_guess,
  });

  try {
    // Step 1: Search KB using agent-aware search
    const searchResults = await searchKbForAgent({
      agent: 'symbol',
      userText,
      extraHints: [insight.archetype_guess, story.hero_description.slice(0, 50)],
    });

    // Format KB context
    const kbContext = formatSearchResultsForPrompt(searchResults);

    debugLog('SymbolAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder
    const insightJson = formatInsightForPrompt(insight);
    const storyJson = formatStoryForPrompt(story);
    const prototypeJson = formatPrototypeForPrompt(prototype);
    const systemPrompt = buildSymbolSystemPrompt(kbContext, insightJson, storyJson, prototypeJson);

    // Step 3: Call Claude with fallback
    const fallbackObject: SymbolOutput = {
      primary_symbol: 'Primary symbol unavailable due to parsing error.',
      secondary_symbols: ['Unable to generate secondary symbols'],
      conceptual_motifs: ['Conceptual motifs unavailable'],
      ui_motifs: ['UI design suggestions unavailable'],
      color_palette_suggestions: ['#808080 - Neutral gray (fallback)'],
    };

    const result = await callClaudeWithFallback<SymbolOutput>(
      systemPrompt,
      userText,
      fallbackObject,
      {
        model: AGENT_MODEL,
        maxTokens: MAX_TOKENS_SYMBOL,
        temperature: AGENT_TEMPERATURE,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Symbol Agent] Symbols complete (${duration}ms)`);
    debugLog('SymbolAgent', 'Output', {
      primarySymbolLength: result.primary_symbol.length,
      colorsCount: result.color_palette_suggestions.length,
      duration,
    });

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Symbol Agent] Error after ${duration}ms:`, error.message);
    throw new Error(`SymbolAgent: ${error.message}`);
  }
}
