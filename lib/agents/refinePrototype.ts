/**
 * Prototype Refinement Agent
 * Post-Symbol micro-agent that integrates symbolic imagery into prototype tasks
 */

import { callClaudeWithFallback } from '@/lib/anthropicClient';
import { InsightOutput, StoryOutput, PrototypeOutput, SymbolOutput } from './types';
import { AGENT_MODEL, AGENT_TEMPERATURE, debugLog } from './config';

interface RefinePrototypeOptions {
  userText: string;
  insight: InsightOutput;
  story: StoryOutput;
  prototype: PrototypeOutput;
  symbol: SymbolOutput;
}

/**
 * Refine prototype with symbolic language and metaphors
 * This is a micro-agent that runs AFTER Symbol Agent to weave symbolic imagery into tasks
 *
 * @param options - All agent outputs
 * @returns Refined prototype with same JSON structure
 */
export async function refinePrototypeWithSymbols(
  options: RefinePrototypeOptions
): Promise<PrototypeOutput> {
  const { userText, insight, story, prototype, symbol } = options;
  const startTime = Date.now();

  debugLog('RefinePrototype', 'Starting refinement', {
    primarySymbol: symbol.primary_symbol.slice(0, 50),
  });

  try {
    // Build refinement prompt
    const systemPrompt = `You are refining a 5-day Creative Acceleration Sprint prototype.

You have access to:

**Original Prototype:**
${JSON.stringify(prototype, null, 2)}

**Symbolic Language to Integrate:**
- Primary Symbol: ${symbol.primary_symbol}
- Secondary Symbols: ${symbol.secondary_symbols.join(', ')}
- Archetype: ${insight.archetype_guess}
- Story Arc: ${story.current_chapter} → ${story.desired_chapter}

**Your Task:**
Refine the prototype by weaving symbolic language and metaphors into:
- Goal statement (make it more evocative while keeping it concrete)
- Task descriptions (integrate symbolic imagery where natural)
- Risks (frame them using the symbolic universe)

**Rules:**
- Keep the EXACT same JSON structure
- Do NOT add or remove days
- Do NOT add or remove major fields
- Do NOT invent new tasks outside the original scope
- Integrate symbolism subtly - tasks must remain actionable
- Keep task count the same (3-4 tasks per day)
- Preserve the anti-corporate, experimental tone
- Make adjustments feel natural, not forced

**Example of Good Integration:**
Original: "Sketch 3 interface concepts"
Refined: "Sketch 3 interface concepts that embody transformation through tension"

Original: "Test core feature with 5 users"
Refined: "Test core feature with 5 users - watch for moments of creative resistance"

Return the refined prototype as valid JSON matching the original schema.`;

    const userMessage = `Refine this prototype by integrating symbolic language from the Symbol Agent.

User's Original Challenge:
${userText.slice(0, 300)}

Respond with the refined prototype JSON only.`;

    // Call Claude with fallback
    const fallbackObject: PrototypeOutput = prototype; // Use original if refinement fails

    const refined = await callClaudeWithFallback<PrototypeOutput>(
      systemPrompt,
      userMessage,
      fallbackObject,
      {
        model: AGENT_MODEL,
        maxTokens: 2500,
        temperature: AGENT_TEMPERATURE,
      }
    );

    const duration = Date.now() - startTime;
    debugLog('RefinePrototype', 'Refinement complete', {
      duration,
      goalLength: refined.goal.length,
    });

    return refined;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Refine Prototype] Error after ${duration}ms:`, error.message);

    // Return original prototype if refinement fails
    console.warn('[Refine Prototype] Using original prototype due to error');
    return prototype;
  }
}
