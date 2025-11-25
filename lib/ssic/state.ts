/**
 * Shared Symbolic Intelligence Core (SSIC) - State Model
 * Central cognitive architecture unifying all agents through physics-based reasoning
 */

/**
 * SSIC State - The unified symbolic intelligence state
 * Represents the system's internal model of creative energy and resistance
 */
export interface SSICState {
  // Core symbolic identity
  wound: string;              // Core wound from Insight
  desire: string;             // Core desire from Insight
  archetype: string;          // Creative archetype
  keywords: string[];         // Shared vocabulary

  // Energetics (potential and charge)
  charge: number;             // Creative energy charge (0-100)
  pressure: number;           // Internal creative pressure (0-100)
  flowPotential: number;      // Potential for creative flow (0-100)

  // Kinetics (force and motion)
  velocity: number;           // Current creative velocity (0-100)
  inertia: number;            // Resistance to change (0-100)
  drag: number;               // Environmental friction (0-100)

  // Fluid Dynamics (flow characteristics)
  viscosity: number;          // Thickness of creative medium (0-100)
  turbulence: number;         // Chaos/unpredictability in system (0-100)

  // Structural zones
  resistanceZones: string[];      // Areas of blocked energy
  leakPoints: string[];          // Where energy dissipates
  breakthroughPoints: string[];  // Where flow can accelerate
}

/**
 * Agent names for SSIC context enrichment
 */
export type AgentName = 'insight' | 'story' | 'prototype' | 'symbol' | 'refine';

/**
 * Physics profile summary for display/debugging
 */
export interface PhysicsProfile {
  charge: number;
  velocity: number;
  inertia: number;
  drag: number;
  viscosity: number;
  turbulence: number;
  flowPotential: number;
}

/**
 * Symbolic primitives derived from SSIC state
 */
export interface SymbolicPrimitives {
  resistance: string;      // Resistance profile description
  momentum: string;        // Momentum profile description
  symbol: string[];        // Symbol primitives
  narrative: string[];     // Narrative primitives
  prototype: string[];     // Prototype primitives
}

/**
 * Initialize empty SSIC state
 */
export function createEmptySSIC(): SSICState {
  return {
    wound: '',
    desire: '',
    archetype: '',
    keywords: [],
    charge: 50,
    pressure: 50,
    flowPotential: 50,
    velocity: 50,
    inertia: 50,
    drag: 50,
    viscosity: 50,
    turbulence: 50,
    resistanceZones: [],
    leakPoints: [],
    breakthroughPoints: [],
  };
}

/**
 * Extract physics profile from SSIC state
 */
export function extractPhysicsProfile(state: SSICState): PhysicsProfile {
  return {
    charge: state.charge,
    velocity: state.velocity,
    inertia: state.inertia,
    drag: state.drag,
    viscosity: state.viscosity,
    turbulence: state.turbulence,
    flowPotential: state.flowPotential,
  };
}
