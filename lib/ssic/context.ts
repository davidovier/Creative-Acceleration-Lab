/**
 * SSIC Context Enrichment
 * Injects physics-based symbolic context into agent inputs
 * This creates unified metaphor coherence across all agents
 */

import { SSICState, AgentName } from './state';
import {
  describeResistanceProfile,
  describeMomentumProfile,
  deriveSymbolPrimitives,
  derivePrototypePrimitives,
  deriveNarrativePrimitives,
} from './reason';

/**
 * Enriched context passed to agents
 * Contains physics profiles and symbolic primitives
 */
export interface EnrichedContext {
  resistance: string;        // Resistance profile summary
  momentum: string;          // Momentum profile summary
  symbolPrimitives: string[];     // Symbol language elements
  prototypePrimitives: string[];  // Prototype action elements
  narrativePrimitives: string[];  // Story elements
  physicsRaw?: {             // Raw physics (debug only)
    charge: number;
    velocity: number;
    inertia: number;
    drag: number;
    viscosity: number;
    turbulence: number;
    flowPotential: number;
    pressure: number;
  };
}

/**
 * Enrich agent input with SSIC context
 * Returns the original input plus SSIC-derived symbolic context
 *
 * @param agent - Which agent is being enriched
 * @param state - Current SSIC state
 * @param input - Agent's base input
 * @param includeRaw - Whether to include raw physics values (debug mode)
 */
export function enrichAgentContext<T extends Record<string, any>>(
  agent: AgentName,
  state: SSICState,
  input: T,
  includeRaw: boolean = false
): T & { ssic: EnrichedContext } {
  // Build base enriched context
  const enriched: EnrichedContext = {
    resistance: describeResistanceProfile(state),
    momentum: describeMomentumProfile(state),
    symbolPrimitives: deriveSymbolPrimitives(state),
    prototypePrimitives: derivePrototypePrimitives(state),
    narrativePrimitives: deriveNarrativePrimitives(state),
  };

  // Add raw physics if debug mode
  if (includeRaw) {
    enriched.physicsRaw = {
      charge: state.charge,
      velocity: state.velocity,
      inertia: state.inertia,
      drag: state.drag,
      viscosity: state.viscosity,
      turbulence: state.turbulence,
      flowPotential: state.flowPotential,
      pressure: state.pressure,
    };
  }

  // Return input with ssic context
  return {
    ...input,
    ssic: enriched,
  };
}

/**
 * Format SSIC context for agent prompts
 * Converts enriched context into readable prompt sections
 *
 * @param agent - Which agent is receiving the context
 * @param enriched - The enriched context to format
 */
export function formatSSICForPrompt(agent: AgentName, enriched: EnrichedContext): string {
  const sections: string[] = [];

  // Header
  sections.push('=== INTERNAL PHYSICS CONTEXT (SSIC) ===');
  sections.push('Use these symbolic primitives to maintain unified metaphor:\n');

  // Resistance profile
  sections.push('RESISTANCE PROFILE:');
  sections.push(`${enriched.resistance}\n`);

  // Momentum profile
  sections.push('MOMENTUM PROFILE:');
  sections.push(`${enriched.momentum}\n`);

  // Agent-specific primitives
  switch (agent) {
    case 'story':
      sections.push('NARRATIVE PRIMITIVES (use these story elements):');
      enriched.narrativePrimitives.forEach(p => sections.push(`  • ${p}`));
      break;

    case 'prototype':
      sections.push('PROTOTYPE PRIMITIVES (use these action principles):');
      enriched.prototypePrimitives.forEach(p => sections.push(`  • ${p}`));
      break;

    case 'symbol':
      sections.push('SYMBOL PRIMITIVES (use these visual/metaphorical elements):');
      enriched.symbolPrimitives.forEach(p => sections.push(`  • ${p}`));
      break;

    case 'refine':
      // Refinement gets all primitives for cross-agent coherence
      sections.push('NARRATIVE PRIMITIVES:');
      enriched.narrativePrimitives.slice(0, 5).forEach(p => sections.push(`  • ${p}`));
      sections.push('\nPROTOTYPE PRIMITIVES:');
      enriched.prototypePrimitives.slice(0, 5).forEach(p => sections.push(`  • ${p}`));
      sections.push('\nSYMBOL PRIMITIVES:');
      enriched.symbolPrimitives.slice(0, 5).forEach(p => sections.push(`  • ${p}`));
      break;

    default:
      // Insight agent doesn't receive SSIC (it creates it)
      break;
  }

  sections.push('\n=== END PHYSICS CONTEXT ===\n');

  return sections.join('\n');
}

/**
 * Get agent-specific SSIC instructions
 * Returns instructions for how each agent should use SSIC context
 */
export function getAgentSSICInstructions(agent: AgentName): string {
  switch (agent) {
    case 'story':
      return `
Use the RESISTANCE and MOMENTUM profiles to shape narrative tension.
Draw from NARRATIVE PRIMITIVES to maintain story coherence with the user's physics.
Let the physics guide your story's energy: high inertia = stuck hero, high velocity = accelerating plot.
`;

    case 'prototype':
      return `
Use the RESISTANCE profile to identify what actions will face friction.
Use the MOMENTUM profile to identify what actions will flow naturally.
Draw from PROTOTYPE PRIMITIVES to suggest physics-aligned experiments.
Design prototypes that work WITH the user's creative physics, not against it.
`;

    case 'symbol':
      return `
Use the RESISTANCE and MOMENTUM profiles to select visual metaphors.
Draw heavily from SYMBOL PRIMITIVES - these are physics-derived visual elements.
Your symbols should visually represent the user's creative physics state.
High inertia = heavy/stuck symbols. High charge = electric/energetic symbols.
`;

    case 'refine':
      return `
Use SSIC context to check cross-agent coherence.
Ensure Story, Prototype, and Symbol all align with the same physics metaphor.
If Story uses "frozen" language but Symbol uses "flowing" imagery, flag the inconsistency.
Use ALL primitives to verify unified symbolic language across outputs.
`;

    default:
      return '';
  }
}

/**
 * Extract SSIC summary for session report
 * Returns a simplified version for storage (hidden unless debug mode)
 */
export interface SSICSummary {
  resistance: string;
  momentum: string;
  charge: number;
  velocity: number;
  inertia: number;
  flowPotential: number;
  resistanceZones: string[];
  breakthroughPoints: string[];
}

export function extractSSICSummary(state: SSICState): SSICSummary {
  return {
    resistance: describeResistanceProfile(state),
    momentum: describeMomentumProfile(state),
    charge: state.charge,
    velocity: state.velocity,
    inertia: state.inertia,
    flowPotential: state.flowPotential,
    resistanceZones: state.resistanceZones,
    breakthroughPoints: state.breakthroughPoints,
  };
}
