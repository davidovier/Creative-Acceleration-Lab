/**
 * Insight Agent
 * Emotional and psychological analysis based on creative archetypes
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput } from './types';

/**
 * Insight Agent
 * Analyzes user's creative challenge through emotional and archetypal lens
 */
export async function runInsightAgent(userText: string): Promise<InsightOutput> {
  console.log('[Insight Agent] Starting analysis...');

  // Step 1: Search KB for relevant context
  const kbQuery = `creative archetypes emotional patterns psychological frameworks core wound core desire ${userText.slice(0, 100)}`;

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

  // Step 2: Build system prompt
  const systemPrompt = `You are the Insight Agent, an expert in emotional intelligence and creative psychology.

Your role is to analyze the user's creative challenge through the lens of archetypes, emotional patterns, and psychological frameworks.

Knowledge base context:
${kbContext}

Your task:
1. Identify the emotional summary of the user's situation
2. Detect the core wound (fear, pain, or limiting belief)
3. Identify the core desire (what they truly want)
4. Suggest a creative archetype that fits their journey
5. Extract supporting quotes from the KB context that resonate with their situation

You MUST respond with valid JSON matching this exact schema:

{
  "emotional_summary": "A 2-3 sentence emotional analysis of their situation",
  "core_wound": "The primary fear, pain, or limiting belief",
  "core_desire": "What they truly want to achieve or become",
  "archetype_guess": "The creative archetype (e.g., The Seeker, The Creator, The Rebel, etc.)",
  "supporting_quotes": ["Quote 1 from KB", "Quote 2 from KB", "Quote 3 from KB"]
}

Important:
- Use the KB context to inform your analysis
- Extract actual quotes from the provided KB context
- Be empathetic but honest
- Focus on emotional truth, not surface-level analysis
- Respond ONLY with valid JSON, no other text`;

  // Step 3: Call Claude
  try {
    const result = await callClaude<InsightOutput>(
      systemPrompt,
      userText,
      {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1500,
        temperature: 1.0,
      }
    );

    console.log('[Insight Agent] Analysis complete');
    return result;

  } catch (error: any) {
    console.error('[Insight Agent] Error:', error.message);
    throw new Error(`Insight Agent failed: ${error.message}`);
  }
}
