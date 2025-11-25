/**
 * SSIC Physics Extraction
 * Deterministic computation of physics state from Insight Agent output
 * No LLM calls - pure symbolic reasoning
 */

import { SSICState } from './state';
import { InsightOutput } from '@/lib/agents/types';

/**
 * Build SSIC state from Insight Agent output
 * This is the core physics extraction engine
 */
export function extractPhysicsFromInsight(
  insight: InsightOutput,
  keywords: string[]
): SSICState {
  const wound = insight.core_wound;
  const desire = insight.core_desire;
  const archetype = insight.archetype_guess;
  const emotionalSummary = insight.emotional_summary;

  // Energetics: charge, pressure, flowPotential
  const charge = computeCharge(desire, keywords);
  const pressure = computePressure(wound, desire);
  const flowPotential = computeFlowPotential(desire, keywords);

  // Kinetics: velocity, inertia, drag
  const velocity = computeVelocity(keywords, emotionalSummary);
  const inertia = computeInertia(wound);
  const drag = computeDrag(wound, emotionalSummary);

  // Fluid Dynamics: viscosity, turbulence
  const viscosity = computeViscosity(wound, archetype);
  const turbulence = computeTurbulence(emotionalSummary, keywords);

  // Structural zones
  const resistanceZones = extractResistanceZones(wound);
  const leakPoints = extractLeakPoints(wound);
  const breakthroughPoints = extractBreakthroughPoints(desire);

  return {
    wound,
    desire,
    archetype,
    keywords,
    charge,
    pressure,
    flowPotential,
    velocity,
    inertia,
    drag,
    viscosity,
    turbulence,
    resistanceZones,
    leakPoints,
    breakthroughPoints,
  };
}

// ============================================================================
// ENERGETICS
// ============================================================================

/**
 * Charge: Creative energy potential (0-100)
 * Higher when desire is strong and keywords are numerous
 */
function computeCharge(desire: string, keywords: string[]): number {
  const desireIntensity = Math.min(100, desire.length / 2); // Longer desire = more charge
  const keywordBoost = Math.min(30, keywords.length * 4); // More keywords = more charge
  return Math.min(100, desireIntensity * 0.7 + keywordBoost);
}

/**
 * Pressure: Internal tension between wound and desire (0-100)
 * Higher when wound and desire create strong opposition
 */
function computePressure(wound: string, desire: string): number {
  const woundIntensity = wound.length / 2;
  const desireIntensity = desire.length / 2;
  const tension = Math.abs(woundIntensity - desireIntensity);
  return Math.min(100, (woundIntensity + desireIntensity) / 2 + tension * 0.3);
}

/**
 * Flow Potential: Capacity for creative flow (0-100)
 * Higher when desire is clear and wound is acknowledged
 */
function computeFlowPotential(desire: string, keywords: string[]): number {
  const desireClarity = Math.min(100, desire.length / 1.5);
  const vocabularyRichness = Math.min(30, keywords.length * 4);
  return Math.min(100, desireClarity * 0.75 + vocabularyRichness);
}

// ============================================================================
// KINETICS
// ============================================================================

/**
 * Velocity: Current creative momentum (0-100)
 * Higher with more keywords and active emotional language
 */
function computeVelocity(keywords: string[], emotionalSummary: string): number {
  const keywordVelocity = Math.min(60, keywords.length * 7.5);
  const emotionalMomentum = countActionWords(emotionalSummary) * 10;
  return Math.min(100, keywordVelocity + emotionalMomentum);
}

/**
 * Inertia: Resistance to change (0-100)
 * Higher when wound is deep and contains blocking language
 */
function computeInertia(wound: string): number {
  const blockingWords = ['stuck', 'trapped', 'unable', 'can\'t', 'fear', 'paralyzed', 'frozen'];
  const blockingCount = blockingWords.filter(w => wound.toLowerCase().includes(w)).length;
  const baseInertia = Math.min(60, wound.length / 3);
  return Math.min(100, baseInertia + blockingCount * 10);
}

/**
 * Drag: Environmental friction (0-100)
 * Higher when wound contains external resistance themes
 */
function computeDrag(wound: string, emotionalSummary: string): number {
  const externalWords = ['system', 'society', 'others', 'world', 'environment', 'market'];
  const externalCount = externalWords.filter(w =>
    wound.toLowerCase().includes(w) || emotionalSummary.toLowerCase().includes(w)
  ).length;
  const baseDrag = Math.min(50, wound.length / 4);
  return Math.min(100, baseDrag + externalCount * 8);
}

// ============================================================================
// FLUID DYNAMICS
// ============================================================================

/**
 * Viscosity: Thickness of creative medium (0-100)
 * Higher when archetype suggests methodical/structured approach
 * Lower when archetype suggests fluid/adaptive approach
 */
function computeViscosity(wound: string, archetype: string): number {
  const structuredArchetypes = ['builder', 'architect', 'engineer', 'sage', 'ruler'];
  const fluidArchetypes = ['rebel', 'magician', 'jester', 'creator', 'explorer'];

  const isStructured = structuredArchetypes.some(a =>
    archetype.toLowerCase().includes(a)
  );
  const isFluid = fluidArchetypes.some(a =>
    archetype.toLowerCase().includes(a)
  );

  let baseViscosity = 50;
  if (isStructured) baseViscosity += 20;
  if (isFluid) baseViscosity -= 20;

  const woundComplexity = Math.min(30, wound.length / 5);
  return Math.min(100, baseViscosity + woundComplexity * 0.5);
}

/**
 * Turbulence: Chaos and unpredictability (0-100)
 * Higher when emotional summary contains conflict/tension language
 */
function computeTurbulence(emotionalSummary: string, keywords: string[]): number {
  const turbulentWords = ['torn', 'conflict', 'chaos', 'confused', 'split', 'tension', 'struggle'];
  const turbulentCount = turbulentWords.filter(w =>
    emotionalSummary.toLowerCase().includes(w)
  ).length;
  const keywordDiversity = Math.min(25, keywords.length * 3);
  return Math.min(100, turbulentCount * 15 + keywordDiversity);
}

// ============================================================================
// STRUCTURAL ZONES
// ============================================================================

/**
 * Extract resistance zones from wound
 * Areas where creative energy is blocked
 */
function extractResistanceZones(wound: string): string[] {
  const zones: string[] = [];

  if (wound.toLowerCase().includes('fear')) zones.push('fear-based resistance');
  if (wound.toLowerCase().includes('perfection')) zones.push('perfectionism barrier');
  if (wound.toLowerCase().includes('not enough') || wound.toLowerCase().includes('inadequate')) {
    zones.push('scarcity mindset');
  }
  if (wound.toLowerCase().includes('stuck') || wound.toLowerCase().includes('trapped')) {
    zones.push('structural blockage');
  }
  if (wound.toLowerCase().includes('others') || wound.toLowerCase().includes('judgment')) {
    zones.push('external validation dependency');
  }

  // Default if no specific zones detected
  if (zones.length === 0) {
    zones.push('undefined resistance');
  }

  return zones;
}

/**
 * Extract leak points from wound
 * Where creative energy dissipates without productive output
 */
function extractLeakPoints(wound: string): string[] {
  const leaks: string[] = [];

  if (wound.toLowerCase().includes('distract')) leaks.push('attention scatter');
  if (wound.toLowerCase().includes('overthink')) leaks.push('analysis paralysis');
  if (wound.toLowerCase().includes('doubt')) leaks.push('self-doubt spiral');
  if (wound.toLowerCase().includes('compare') || wound.toLowerCase().includes('comparison')) {
    leaks.push('comparison drain');
  }

  return leaks;
}

/**
 * Extract breakthrough points from desire
 * Where creative flow can accelerate
 */
function extractBreakthroughPoints(desire: string): string[] {
  const breakthroughs: string[] = [];

  if (desire.toLowerCase().includes('create') || desire.toLowerCase().includes('build')) {
    breakthroughs.push('creative manifestation');
  }
  if (desire.toLowerCase().includes('express')) breakthroughs.push('authentic expression');
  if (desire.toLowerCase().includes('flow') || desire.toLowerCase().includes('ease')) {
    breakthroughs.push('effortless flow state');
  }
  if (desire.toLowerCase().includes('impact') || desire.toLowerCase().includes('meaning')) {
    breakthroughs.push('meaningful contribution');
  }
  if (desire.toLowerCase().includes('freedom') || desire.toLowerCase().includes('liberate')) {
    breakthroughs.push('creative liberation');
  }

  // Default if no specific breakthroughs detected
  if (breakthroughs.length === 0) {
    breakthroughs.push('forward momentum');
  }

  return breakthroughs;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Count action-oriented words in text
 */
function countActionWords(text: string): number {
  const actionWords = ['moving', 'pushing', 'pulling', 'driving', 'flowing', 'building', 'creating'];
  return actionWords.filter(w => text.toLowerCase().includes(w)).length;
}
