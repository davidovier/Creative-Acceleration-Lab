/**
 * Prototype Engineer Agent
 * 5-day sprint plan with concrete tasks
 */

import { searchKbForAgent, formatSearchResultsForPrompt } from '@/lib/rag/search';
import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_PROTOTYPE,
  debugLog,
} from './config';
import { buildPrototypeSystemPrompt, formatInsightForPrompt, formatStoryForPrompt } from './prompts';
import { EnrichedContext } from '../ssic/context';

/**
 * Prototype Engineer Agent (Prompt 7: keyword-aware + Prompt 9: SSIC-aware)
 * Creates actionable 5-day prototype plan
 */
export async function runPrototypeAgent(
  userText: string,
  insight: InsightOutput,
  story: StoryOutput,
  keywords: string[],
  ssicContext?: EnrichedContext
): Promise<PrototypeOutput> {
  const startTime = Date.now();
  console.log('[Prototype Agent] Building sprint plan...');
  debugLog('PrototypeAgent', 'Input', {
    userTextLength: userText.length,
    desiredChapter: story.desired_chapter.slice(0, 50),
    keywords: keywords.length,
  });

  try {
    // Step 1: Search KB using agent-aware search
    const searchResults = await searchKbForAgent({
      agent: 'prototype',
      userText,
      extraHints: [story.desired_chapter.slice(0, 100)],
    });

    // Format KB context
    const kbContext = formatSearchResultsForPrompt(searchResults);

    debugLog('PrototypeAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder with keywords & SSIC
    const insightJson = formatInsightForPrompt(insight);
    const storyJson = formatStoryForPrompt(story);
    const systemPrompt = buildPrototypeSystemPrompt(kbContext, insightJson, storyJson, keywords, ssicContext);

    // Step 3: Call Claude with fallback
    const fallbackObject: PrototypeOutput = {
      goal: 'Sprint plan unavailable due to parsing error.',
      constraints: ['Unable to generate constraints'],
      day_by_day_plan: [
        {
          day: 1,
          focus: 'Plan unavailable',
          tasks: ['Unable to generate tasks due to technical error'],
        },
      ],
      potential_ai_features: ['Unable to generate AI feature suggestions'],
      risks: ['Technical error occurred during plan generation'],
    };

    const result = await callClaudeWithFallback<PrototypeOutput>(
      systemPrompt,
      userText,
      fallbackObject,
      {
        model: AGENT_MODEL,
        maxTokens: MAX_TOKENS_PROTOTYPE,
        temperature: AGENT_TEMPERATURE,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Prototype Agent] Sprint plan complete (${duration}ms)`);
    debugLog('PrototypeAgent', 'Output', {
      planDays: result.day_by_day_plan.length,
      constraints: result.constraints.length,
      duration,
    });

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Prototype Agent] Error after ${duration}ms:`, error.message);
    throw new Error(`PrototypeAgent: ${error.message}`);
  }
}
