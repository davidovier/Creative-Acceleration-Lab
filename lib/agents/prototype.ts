/**
 * Prototype Engineer Agent
 * 5-day sprint plan with concrete tasks
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput } from './types';

/**
 * Prototype Engineer Agent
 * Creates actionable 5-day prototype plan
 */
export async function runPrototypeAgent(
  userText: string,
  insight: InsightOutput,
  story: StoryOutput
): Promise<PrototypeOutput> {
  console.log('[Prototype Agent] Building sprint plan...');

  // Step 1: Search KB for prototyping frameworks
  const kbQuery = `5-day prototype ritual speed studio rapid prototyping sprint planning constraints creative process ${story.desired_chapter}`;

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

  // Step 2: Build system prompt with previous context
  const systemPrompt = `You are the Prototype Engineer, an expert in rapid prototyping and creative sprints.

Your role is to create a concrete 5-day prototype plan that moves the user from their current chapter to their desired chapter.

Knowledge base context:
${kbContext}

Context from previous agents:
- Core desire: ${insight.core_desire}
- Current chapter: ${story.current_chapter}
- Desired chapter: ${story.desired_chapter}
- Hero description: ${story.hero_description}

Your task:
1. Define a clear, achievable goal for the 5-day sprint
2. Identify constraints that will focus the work
3. Create a day-by-day plan with specific tasks
4. Suggest potential AI features that could accelerate the prototype
5. Identify risks and how to mitigate them

You MUST respond with valid JSON matching this exact schema:

{
  "goal": "Clear, specific goal for the 5-day sprint (1 sentence)",
  "constraints": ["Constraint 1", "Constraint 2", "Constraint 3"],
  "day_by_day_plan": [
    {
      "day": 1,
      "focus": "What this day is about",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    {
      "day": 2,
      "focus": "What this day is about",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    {
      "day": 3,
      "focus": "What this day is about",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    {
      "day": 4,
      "focus": "What this day is about",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    },
    {
      "day": 5,
      "focus": "What this day is about",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    }
  ],
  "potential_ai_features": ["AI feature 1", "AI feature 2", "AI feature 3"],
  "risks": ["Risk 1 and mitigation", "Risk 2 and mitigation", "Risk 3 and mitigation"]
}

Important:
- Use the KB context to inform prototyping methodologies
- Make tasks concrete and actionable
- Follow the 5-Day Prototype Ritual if available in KB
- Constraints should force focus, not limit creativity
- AI features should be practical and achievable
- Respond ONLY with valid JSON, no other text`;

  // Step 3: Call Claude
  try {
    const result = await callClaude<PrototypeOutput>(
      systemPrompt,
      userText,
      {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 2000,
        temperature: 1.0,
      }
    );

    console.log('[Prototype Agent] Sprint plan complete');
    return result;

  } catch (error: any) {
    console.error('[Prototype Agent] Error:', error.message);
    throw new Error(`Prototype Agent failed: ${error.message}`);
  }
}
