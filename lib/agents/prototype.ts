/**
 * Prototype Engineer Agent
 * 5-day sprint plan with concrete tasks
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput } from './types';
import {
  AGENT_MODEL,
  AGENT_TEMPERATURE,
  MAX_TOKENS_PROTOTYPE,
  RAG_TOP_K,
  RAG_SIMILARITY_THRESHOLD,
  debugLog,
} from './config';
import { buildPrototypeSystemPrompt, formatInsightForPrompt, formatStoryForPrompt } from './prompts';

/**
 * Prototype Engineer Agent
 * Creates actionable 5-day prototype plan
 */
export async function runPrototypeAgent(
  userText: string,
  insight: InsightOutput,
  story: StoryOutput
): Promise<PrototypeOutput> {
  const startTime = Date.now();
  console.log('[Prototype Agent] Building sprint plan...');
  debugLog('PrototypeAgent', 'Input', {
    userTextLength: userText.length,
    desiredChapter: story.desired_chapter.slice(0, 50),
  });

  try {
    // Step 1: Search KB for prototyping frameworks
    const kbQuery = `5-day prototype ritual speed studio rapid prototyping sprint planning constraints creative process ${story.desired_chapter}`;

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

    debugLog('PrototypeAgent', 'KB context retrieved', {
      chunks: searchResults.length,
      contextLength: kbContext.length,
    });

    // Step 2: Build system prompt using prompt builder
    const insightJson = formatInsightForPrompt(insight);
    const storyJson = formatStoryForPrompt(story);
    const systemPrompt = buildPrototypeSystemPrompt(kbContext, insightJson, storyJson);

    // Step 3: Call Claude with config values
    const result = await callClaude<PrototypeOutput>(
      systemPrompt,
      userText,
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

    if (error.message.includes('JSON')) {
      throw new Error(`PrototypeAgent: Failed to parse JSON response - ${error.message}`);
    }
    throw new Error(`PrototypeAgent: ${error.message}`);
  }
}
