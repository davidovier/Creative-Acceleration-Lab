/**
 * Symbol Weaver Agent
 * Visual symbols and design elements
 */

import { searchKB } from '@/lib/rag/search';
import { callClaude } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput, SymbolOutput } from './types';

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
  console.log('[Symbol Agent] Weaving symbols...');

  // Step 1: Search KB for symbolic and visual design patterns
  const kbQuery = `symbolic mapping visual design UI aesthetics color palette tattoo symbolism ${insight.archetype_guess} ${story.hero_description}`;

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

  // Step 2: Build system prompt with all previous context
  const systemPrompt = `You are the Symbol Weaver, an expert in visual symbolism and design language.

Your role is to translate the user's journey into visual symbols, design motifs, and aesthetic elements.

Knowledge base context:
${kbContext}

Context from previous agents:
- Archetype: ${insight.archetype_guess}
- Core desire: ${insight.core_desire}
- Story: ${story.story_paragraph}
- Hero: ${story.hero_description}
- Prototype goal: ${prototype.goal}

Your task:
1. Identify a primary symbol that represents their journey
2. Suggest secondary symbols that support the narrative
3. Create tattoo concepts (symbolic, personal, meaningful)
4. Suggest UI/design motifs for their prototype
5. Recommend color palette based on emotional tone

You MUST respond with valid JSON matching this exact schema:

{
  "primary_symbol": "The main symbol and its meaning (2-3 sentences)",
  "secondary_symbols": ["Symbol 1 and meaning", "Symbol 2 and meaning", "Symbol 3 and meaning"],
  "tattoo_concepts": ["Tattoo idea 1", "Tattoo idea 2", "Tattoo idea 3"],
  "ui_motifs": ["UI pattern 1", "UI pattern 2", "UI pattern 3"],
  "color_palette_suggestions": ["Color 1 (#hex) - emotional meaning", "Color 2 (#hex) - emotional meaning", "Color 3 (#hex) - emotional meaning"]
}

Important:
- Use the KB context to inform symbolic frameworks
- Connect symbols to their emotional journey
- Make tattoo concepts personal and meaningful
- UI motifs should support the prototype goal
- Color palette should reflect emotional tone
- Respond ONLY with valid JSON, no other text`;

  // Step 3: Call Claude
  try {
    const result = await callClaude<SymbolOutput>(
      systemPrompt,
      userText,
      {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1500,
        temperature: 1.0,
      }
    );

    console.log('[Symbol Agent] Symbols complete');
    return result;

  } catch (error: any) {
    console.error('[Symbol Agent] Error:', error.message);
    throw new Error(`Symbol Agent failed: ${error.message}`);
  }
}
