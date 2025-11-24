/**
 * Story Architect Agent
 * Narrative structure using hero's journey framework
 */

import { searchKbForAgent, formatSearchResultsForPrompt } from '@/lib/rag/search';
import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_STORY,
  debugLog,
} from './config';
import { buildStorySystemPrompt, formatInsightForPrompt } from './prompts';

/**
 * Story Architect Agent (Prompt 7: keyword & pronoun-aware)
 * Transforms user's challenge into a hero's journey narrative
 */
export async function runStoryAgent(
  userText: string,
  insight: InsightOutput,
  keywords: string[],
  pronoun: string
): Promise<StoryOutput> {
  const startTime = Date.now();
  console.log('[Story Agent] Crafting narrative...');
  debugLog('StoryAgent', 'Input', {
    userTextLength: userText.length,
    archetype: insight.archetype_guess,
    keywords: keywords.length,
    pronoun,
  });

  try {
    // Step 1: Search KB using agent-aware search
    const searchResults = await searchKbForAgent({
      agent: 'story',
      userText,
      extraHints: [insight.archetype_guess],
    });

    // Format KB context
    const kbContext = formatSearchResultsForPrompt(searchResults);

    debugLog('StoryAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder with keywords & pronoun
    const insightJson = formatInsightForPrompt(insight);
    const systemPrompt = buildStorySystemPrompt(kbContext, insightJson, keywords, pronoun);

    // Step 3: Call Claude with fallback
    const fallbackObject: StoryOutput = {
      hero_description: 'Hero analysis unavailable due to parsing error.',
      villain_description: 'Villain analysis unavailable.',
      current_chapter: 'Current state unavailable.',
      desired_chapter: 'Desired state unavailable.',
      story_paragraph: 'Narrative unavailable due to technical error.',
    };

    const result = await callClaudeWithFallback<StoryOutput>(
      systemPrompt,
      userText,
      fallbackObject,
      {
        model: AGENT_MODEL,
        maxTokens: MAX_TOKENS_STORY,
        temperature: AGENT_TEMPERATURE,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Story Agent] Narrative complete (${duration}ms)`);
    debugLog('StoryAgent', 'Output', {
      storyLength: result.story_paragraph.length,
      duration,
    });

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Story Agent] Error after ${duration}ms:`, error.message);
    throw new Error(`StoryAgent: ${error.message}`);
  }
}
