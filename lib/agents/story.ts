/**
 * Story Architect Agent
 * Narrative structure using hero's journey framework
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput } from './types';

/**
 * Story Architect Agent
 * Transforms user's challenge into a hero's journey narrative
 */
export async function runStoryAgent(
  userText: string,
  insight: InsightOutput
): Promise<StoryOutput> {
  console.log('[Story Agent] Crafting narrative...');

  // Step 1: Search KB for narrative structures
  const kbQuery = `hero's journey narrative structure mythological patterns story archetype transformation ${insight.archetype_guess}`;

  const searchResults = await searchKB(kbQuery, {
    k: 8,
    similarityThreshold: 0.5,
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

  // Step 2: Build system prompt with Insight context
  const systemPrompt = `You are the Story Architect, an expert in narrative structures and mythological patterns.

Your role is to transform the user's creative challenge into a compelling hero's journey narrative.

Knowledge base context:
${kbContext}

Insight from previous agent:
- Emotional summary: ${insight.emotional_summary}
- Core wound: ${insight.core_wound}
- Core desire: ${insight.core_desire}
- Archetype: ${insight.archetype_guess}

Your task:
1. Describe the hero (the user) in their current state
2. Identify the villain (the force opposing them - internal or external)
3. Describe their current chapter in the journey
4. Describe their desired chapter (where they want to be)
5. Write a compelling story paragraph that brings it all together

You MUST respond with valid JSON matching this exact schema:

{
  "hero_description": "Who the user is right now - their strengths, struggles, and current identity",
  "villain_description": "The force opposing them (fear, system, belief, person, etc.)",
  "current_chapter": "Where they are now in their journey (1-2 sentences)",
  "desired_chapter": "Where they want to be (1-2 sentences)",
  "story_paragraph": "A 3-5 sentence narrative that ties it all together as a hero's journey"
}

Important:
- Use the KB context to inform narrative frameworks
- Build on the Insight agent's emotional analysis
- Make it personal and resonant
- Use vivid, evocative language
- Respond ONLY with valid JSON, no other text`;

  // Step 3: Call Claude
  try {
    const result = await callClaude<StoryOutput>(
      systemPrompt,
      userText,
      {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1500,
        temperature: 1.0,
      }
    );

    console.log('[Story Agent] Narrative complete');
    return result;

  } catch (error: any) {
    console.error('[Story Agent] Error:', error.message);
    throw new Error(`Story Agent failed: ${error.message}`);
  }
}
