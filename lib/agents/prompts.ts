/**
 * Agent Prompts
 * Modular prompt builder functions for all agents
 */

import { InsightOutput, StoryOutput, PrototypeOutput } from './types';

// ============================================================================
// INSIGHT AGENT PROMPT
// ============================================================================

/**
 * Build system prompt for Insight Agent (Prompt 7: compressed & quote-aware)
 * @param kbContext - Relevant KB chunks from RAG search
 * @param extractedQuotes - Meaningful quotes extracted from user text
 * @returns Complete system prompt string
 */
export function buildInsightSystemPrompt(kbContext: string, extractedQuotes: string[]): string {
  const quotesFormatted = extractedQuotes.length > 0
    ? extractedQuotes.map((q, i) => `  ${i + 1}. "${q}"`).join('\n')
    : '  (No quotes extracted from short input)';

  return `Map emotional tensions through archetypal truth. No therapy-speak.

KB Context:
${kbContext}

User's Extracted Quotes:
${quotesFormatted}

Output:
• **emotional_summary** — 2-3 sentences. Name tension, split, hunger. Raw.
• **core_wound** — The fracture. Poetic but precise.
• **core_desire** — What they're reaching for. Dangerous answer.
• **Archetype** — Rebel/Seeker/Builder/Destroyer/Mystic/etc.
• **supporting_quotes** — ONLY select from the Extracted Quotes list above. 1-3 quotes that resonate with archetypal themes.

Tone: Raw, symbolic, concise, spiritually aware, anti-corporate

Grounding:
• Use KB for archetypal frameworks
• supporting_quotes MUST be from Extracted Quotes list, NOT invented
• If short input, use 1-2 quotes
• Acknowledge when KB lacks specifics

JSON schema:
{
  "emotional_summary": "...",
  "core_wound": "...",
  "core_desire": "...",
  "archetype_guess": "...",
  "supporting_quotes": ["quote from list", ...]
}

Respond ONLY with JSON.`;
}

// ============================================================================
// STORY AGENT PROMPT
// ============================================================================

/**
 * Build system prompt for Story Agent (Prompt 7: compressed, keyword & pronoun-aware)
 * @param kbContext - Relevant KB chunks from RAG search
 * @param insightJson - JSON string of Insight agent output
 * @param keywords - Shared vocabulary from Insight
 * @param pronoun - Preferred pronoun (they/he/she)
 * @returns Complete system prompt string
 */
export function buildStorySystemPrompt(
  kbContext: string,
  insightJson: string,
  keywords: string[],
  pronoun: string
): string {
  const keywordsFormatted = keywords.length > 0 ? keywords.join(', ') : '(none)';

  return `Craft micro-myths. Sharp, minimalist, archetypal. No melodrama or fantasy epics.

KB: ${kbContext}

Insight: ${insightJson}

Shared Keywords (integrate naturally): ${keywordsFormatted}

Pronoun: Use "${pronoun}" when referring to the hero.

Output:
• **hero_description** — Identity, tension, creative force. Concise. Real.
• **villain_description** — What opposes ${pronoun}. Shadow/system/fear. Symbolic but grounded.
• **current_chapter** — Where ${pronoun} stand. 1-2 sentences. Mythic/minimalist.
• **desired_chapter** — Symbolic shift ${pronoun}'re reaching for. 1-2 sentences.
• **story_paragraph** — Micro-myth. 3-5 sentences. Internal tension. Archetypal movement.

Tone: Sharp, emotionally vivid, grounded, mythically charged, minimalist, anti-corporate

Grounding:
• Align with Insight archetype, core_wound, core_desire
• Use Human Story Engine framework from KB
• 3-5 sentences max
• Keep simple if KB is sparse

JSON:
{"hero_description": "...", "villain_description": "...", "current_chapter": "...", "desired_chapter": "...", "story_paragraph": "..."}

JSON only.`;
}

// ============================================================================
// PROTOTYPE AGENT PROMPT
// ============================================================================

/**
 * Build system prompt for Prototype Agent (Prompt 7: compressed, keyword-aware)
 * @param kbContext - Relevant KB chunks from RAG search
 * @param insightJson - JSON string of Insight agent output
 * @param storyJson - JSON string of Story agent output
 * @param keywords - Shared vocabulary from Insight
 * @returns Complete system prompt string
 */
export function buildPrototypeSystemPrompt(
  kbContext: string,
  insightJson: string,
  storyJson: string,
  keywords: string[]
): string {
  const keywordsFormatted = keywords.length > 0 ? keywords.join(', ') : '(none)';
  return `5-day Creative Acceleration Sprint. Fast, experimental, emotionally grounded. Zero corporate language.

KB: ${kbContext}

Previous: ${insightJson} ${storyJson}

Shared Keywords (weave into tasks): ${keywordsFormatted}

Output:
• **goal** — One sentence. Sharp. Achievable. Emotionally resonant.
• **constraints** — 3 creative constraints. Poetic. Anti-scope-creep.
• **day_by_day_plan** — 5 days. Each day: focus (poetic/clear) + 3-4 tasks (wild, imaginative, hands-on)
  Day 1: Emotional grounding + symbolic exploration
  Day 2: Rapid concept shaping
  Day 3: Build micro-MVP (code/sound/visual/whatever)
  Day 4: Refine, test, iterate fast
  Day 5: Manifestation + expressive launch
• **potential_ai_features** — 3 experimental AI integrations (generative tools, symbolic AI, expressive interfaces)
• **risks** — 3 risks + how to dance with them (embrace/transform/bypass)

Tone: Anti-corporate, creative-engineering, fast, experimental, weird in good way

Grounding:
• Align tasks with Insight/Story emotional themes
• Reference 5-Day Prototype Ritual/Speed Studio from KB
• NO corporate language (LinkedIn, networking, stakeholder, CV, branding)
• Small-scale creative experiments, not business planning
• Connect to Story narrative arc

JSON:
{"goal": "...", "constraints": [...], "day_by_day_plan": [{day: 1, focus: "...", tasks: [...]}, ...], "potential_ai_features": [...], "risks": [...]}

JSON only.`;
}

// ============================================================================
// SYMBOL AGENT PROMPT
// ============================================================================

/**
 * Build system prompt for Symbol Agent (Prompt 7: compressed, keyword & pronoun-aware)
 * @param kbContext - Relevant KB chunks from RAG search
 * @param insightJson - JSON string of Insight agent output
 * @param storyJson - JSON string of Story agent output
 * @param prototypeJson - JSON string of Prototype agent output
 * @param keywords - Shared vocabulary from Insight
 * @param pronoun - Preferred pronoun (they/he/she)
 * @returns Complete system prompt string
 */
export function buildSymbolSystemPrompt(
  kbContext: string,
  insightJson: string,
  storyJson: string,
  prototypeJson: string,
  keywords: string[],
  pronoun: string
): string {
  const keywordsFormatted = keywords.length > 0 ? keywords.join(', ') : '(none)';

  return `Translate tension into form. Minimalist elegance. Abstract/charged. Grounded in emotional truth.

KB: ${kbContext}

Previous: ${insightJson} ${storyJson} ${prototypeJson}

Shared Keywords: ${keywordsFormatted}

Pronoun: Use "${pronoun}" when describing the journey.

Output:
• **primary_symbol** — Core visual representation of ${pronoun}r journey. 2-3 sentences. Poetic. Precise. Emotionally charged.
• **secondary_symbols** — 3 supporting motifs. Abstract. Minimal. Spiritually resonant.
• **conceptual_motifs** — 3 design ideas (objects, rituals, visual metaphors, abstract patterns). NOT tattoos.
• **ui_motifs** — 3 interface/experience concepts for prototype. Expressive. Emotionally intelligent. Anti-corporate.
• **color_palette_suggestions** — 3-4 hex colors (format: "#HEX - meaning"). Embody wound/desire/archetype/transformation.

Tone: Minimalist, elegant, emotionally charged, abstract, symbolic, spiritually aware, no tattoo refs, concise

Grounding:
• Match Insight/Story archetypes and tensions
• Symbols belong to same universe as narrative/prototype
• Reference KB symbol dictionary, color psychology
• Primary symbol connects to core_wound or core_desire
• Secondary symbols reflect hero/villain/transformation facets
• Color palette aligns with established emotional tones

JSON:
{"primary_symbol": "...", "secondary_symbols": [...], "conceptual_motifs": [...], "ui_motifs": [...], "color_palette_suggestions": ["#HEX - meaning", ...]}

JSON only.`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format previous agent output as JSON string for prompts
 */
export function formatInsightForPrompt(insight: InsightOutput): string {
  return JSON.stringify({
    emotional_summary: insight.emotional_summary,
    core_wound: insight.core_wound,
    core_desire: insight.core_desire,
    archetype: insight.archetype_guess,
  }, null, 2);
}

/**
 * Format Story output for prompts
 */
export function formatStoryForPrompt(story: StoryOutput): string {
  return JSON.stringify({
    hero: story.hero_description,
    villain: story.villain_description,
    current_chapter: story.current_chapter,
    desired_chapter: story.desired_chapter,
    story: story.story_paragraph,
  }, null, 2);
}

/**
 * Format Prototype output for prompts
 */
export function formatPrototypeForPrompt(prototype: PrototypeOutput): string {
  return JSON.stringify({
    goal: prototype.goal,
    constraints: prototype.constraints,
    day_by_day_plan: prototype.day_by_day_plan,
  }, null, 2);
}
