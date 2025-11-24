/**
 * Agent Types
 * TypeScript interfaces for all agent inputs and outputs
 */

// ============================================================================
// AGENT OUTPUTS
// ============================================================================

/**
 * Insight Agent Output
 * Emotional and psychological analysis based on creative archetypes
 */
export interface InsightOutput {
  emotional_summary: string;
  core_wound: string;
  core_desire: string;
  archetype_guess: string;
  supporting_quotes: string[];
}

/**
 * Story Architect Output
 * Narrative structure using hero's journey framework
 */
export interface StoryOutput {
  hero_description: string;
  villain_description: string;
  current_chapter: string;
  desired_chapter: string;
  story_paragraph: string;
}

/**
 * Prototype Engineer Output
 * 5-day sprint plan with concrete tasks
 */
export interface PrototypeOutput {
  goal: string;
  constraints: string[];
  day_by_day_plan: {
    day: number;
    focus: string;
    tasks: string[];
  }[];
  potential_ai_features: string[];
  risks: string[];
}

/**
 * Symbol Weaver Output
 * Visual symbols and design elements (NO tattoo references)
 */
export interface SymbolOutput {
  primary_symbol: string;
  secondary_symbols: string[];
  conceptual_motifs: string[]; // Replaced tattoo_concepts - symbolic objects, rituals, metaphors
  ui_motifs: string[];
  color_palette_suggestions: string[];
}

// ============================================================================
// SESSION REPORT
// ============================================================================

/**
 * Complete Session Report
 * Combined output from all four agents
 */
export interface SessionReport {
  userText: string;
  timestamp: string;
  insight: InsightOutput;
  story: StoryOutput;
  prototype: PrototypeOutput;
  symbol: SymbolOutput;
  totalDuration?: number; // milliseconds
  consistency?: {
    score: number;
    notes: string[];
  };
}

// ============================================================================
// AGENT FUNCTION SIGNATURES
// ============================================================================

/**
 * Insight Agent function type
 */
export type InsightAgentFn = (userText: string) => Promise<InsightOutput>;

/**
 * Story Architect function type
 */
export type StoryAgentFn = (
  userText: string,
  insight: InsightOutput
) => Promise<StoryOutput>;

/**
 * Prototype Engineer function type
 */
export type PrototypeAgentFn = (
  userText: string,
  insight: InsightOutput,
  story: StoryOutput
) => Promise<PrototypeOutput>;

/**
 * Symbol Weaver function type
 */
export type SymbolAgentFn = (
  userText: string,
  insight: InsightOutput,
  story: StoryOutput,
  prototype: PrototypeOutput
) => Promise<SymbolOutput>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * RAG search result from KB
 */
export interface RAGContext {
  source: string;
  content: string;
  similarity: number;
}

/**
 * Error response for agent failures
 */
export interface AgentError {
  agent: string;
  error: string;
  timestamp: string;
}
