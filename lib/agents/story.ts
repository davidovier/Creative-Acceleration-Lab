/**
 * Story Architect Agent
 * Narrative structure using hero's journey framework
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_STORY,
  RAG_TOP_K,
  RAG_SIMILARITY_THRESHOLD,
  debugLog,
} from './config';
import { buildStorySystemPrompt, formatInsightForPrompt } from './prompts';

/**
 * Story Architect Agent
 * Transforms user's challenge into a hero's journey narrative
 */
export async function runStoryAgent(
  userText: string,
  insight: InsightOutput
): Promise<StoryOutput> {
  const startTime = Date.now();
  console.log('[Story Agent] Crafting narrative...');
  debugLog('StoryAgent', 'Input', {
    userTextLength: userText.length,
    archetype: insight.archetype_guess,
  });

  try {
    // Step 1: Search KB for narrative structures
    const kbQuery = `hero's journey narrative structure mythological patterns story archetype transformation ${insight.archetype_guess}`;

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

    debugLog('StoryAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder
    const insightJson = formatInsightForPrompt(insight);
    const systemPrompt = buildStorySystemPrompt(kbContext, insightJson);

    // Step 3: Call Claude with config values
    const result = await callClaude<StoryOutput>(
      systemPrompt,
      userText,
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

    if (error.message.includes('JSON')) {
      throw new Error(`StoryAgent: Failed to parse JSON response - ${error.message}`);
    }
    throw new Error(`StoryAgent: ${error.message}`);
  }
}
