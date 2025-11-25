/**
 * SSIC Reasoning Utilities
 * Physics-based symbolic summaries for agent context enrichment
 * These produce short, precise descriptions that unify metaphor across agents
 */

import { SSICState } from './state';

/**
 * Describe resistance profile
 * Returns a concise physics-based summary of creative resistance
 */
export function describeResistanceProfile(state: SSICState): string {
  const { inertia, drag, viscosity, resistanceZones } = state;

  // Classify resistance intensity
  const totalResistance = (inertia + drag + viscosity) / 3;

  let intensity: string;
  if (totalResistance > 70) intensity = 'high';
  else if (totalResistance > 40) intensity = 'moderate';
  else intensity = 'low';

  // Primary resistance pattern
  const primaryZone = resistanceZones[0] || 'undefined resistance';

  // Kinetic descriptor
  let kineticState: string;
  if (inertia > 60 && drag > 60) kineticState = 'frozen and pressed';
  else if (inertia > 60) kineticState = 'stuck but free of external forces';
  else if (drag > 60) kineticState = 'mobile but heavily constrained';
  else kineticState = 'relatively unblocked';

  // Fluid descriptor
  let fluidState: string;
  if (viscosity > 70) fluidState = 'thick, methodical medium';
  else if (viscosity > 40) fluidState = 'moderately viscous flow';
  else fluidState = 'fluid, adaptive medium';

  return `${intensity} resistance | ${kineticState} | ${fluidState} | primary block: ${primaryZone}`;
}

/**
 * Describe momentum profile
 * Returns a concise physics-based summary of creative momentum
 */
export function describeMomentumProfile(state: SSICState): string {
  const { velocity, charge, flowPotential, turbulence, breakthroughPoints } = state;

  // Classify momentum intensity
  const avgMomentum = (velocity + charge + flowPotential) / 3;

  let intensity: string;
  if (avgMomentum > 70) intensity = 'high';
  else if (avgMomentum > 40) intensity = 'moderate';
  else intensity = 'low';

  // Energy state
  let energyState: string;
  if (charge > 70 && velocity > 60) energyState = 'charged and accelerating';
  else if (charge > 70) energyState = 'charged but not yet moving';
  else if (velocity > 60) energyState = 'moving on depleting reserves';
  else energyState = 'low energy, low motion';

  // Flow state
  let flowState: string;
  if (flowPotential > 70) flowState = 'high flow capacity';
  else if (flowPotential > 40) flowState = 'moderate flow capacity';
  else flowState = 'constrained flow capacity';

  // Turbulence descriptor
  let turbulenceState: string;
  if (turbulence > 60) turbulenceState = 'chaotic';
  else if (turbulence > 30) turbulenceState = 'dynamic';
  else turbulenceState = 'stable';

  // Primary breakthrough
  const primaryBreakthrough = breakthroughPoints[0] || 'forward momentum';

  return `${intensity} momentum | ${energyState} | ${flowState} | ${turbulenceState} flow | breakthrough vector: ${primaryBreakthrough}`;
}

/**
 * Derive symbol primitives
 * Returns symbolic language elements based on physics state
 */
export function deriveSymbolPrimitives(state: SSICState): string[] {
  const { charge, inertia, viscosity, turbulence, resistanceZones, breakthroughPoints } = state;
  const primitives: string[] = [];

  // Energy symbols
  if (charge > 70) primitives.push('charged field', 'electric potential', 'spark');
  else if (charge > 40) primitives.push('warm glow', 'ember', 'gathering energy');
  else primitives.push('faint pulse', 'dormant seed', 'waiting charge');

  // Resistance symbols
  if (inertia > 60) primitives.push('boulder', 'anchor', 'frozen structure');
  if (viscosity > 70) primitives.push('honey', 'thick medium', 'molasses');
  if (resistanceZones.some(z => z.includes('fear'))) primitives.push('shadow', 'wall', 'threshold');

  // Flow symbols
  if (turbulence > 60) primitives.push('storm', 'chaos', 'whirlwind');
  else if (turbulence > 30) primitives.push('rapids', 'current', 'wave');
  else primitives.push('still water', 'clear stream', 'gentle flow');

  // Breakthrough symbols
  if (breakthroughPoints.some(b => b.includes('liberation'))) primitives.push('key', 'open door', 'flight');
  if (breakthroughPoints.some(b => b.includes('manifestation'))) primitives.push('seed', 'birth', 'emergence');
  if (breakthroughPoints.some(b => b.includes('expression'))) primitives.push('voice', 'color', 'song');

  return primitives;
}

/**
 * Derive prototype primitives
 * Returns actionable prototype elements based on physics state
 */
export function derivePrototypePrimitives(state: SSICState): string[] {
  const { velocity, inertia, drag, flowPotential, leakPoints } = state;
  const primitives: string[] = [];

  // Velocity-based actions
  if (velocity > 60) {
    primitives.push('maintain momentum', 'ride the wave', 'keep moving');
  } else if (velocity > 30) {
    primitives.push('build speed gradually', 'find rhythm', 'accelerate carefully');
  } else {
    primitives.push('initiate motion', 'take first step', 'overcome static friction');
  }

  // Inertia-based actions
  if (inertia > 60) {
    primitives.push('break patterns', 'disrupt structure', 'introduce small changes');
  } else {
    primitives.push('leverage flexibility', 'explore variations', 'experiment freely');
  }

  // Drag-based actions
  if (drag > 60) {
    primitives.push('reduce external friction', 'simplify environment', 'create protective space');
  } else {
    primitives.push('engage with environment', 'invite feedback', 'expand reach');
  }

  // Flow potential actions
  if (flowPotential > 60) {
    primitives.push('enter flow state', 'sustain creative immersion', 'ride momentum');
  } else {
    primitives.push('build flow capacity', 'establish conditions', 'prepare the ground');
  }

  // Leak point actions
  if (leakPoints.includes('attention scatter')) primitives.push('focus attention', 'eliminate distractions');
  if (leakPoints.includes('analysis paralysis')) primitives.push('bias toward action', 'embrace imperfection');
  if (leakPoints.includes('self-doubt spiral')) primitives.push('trust process', 'affirm capacity');
  if (leakPoints.includes('comparison drain')) primitives.push('internal reference', 'unique path');

  return primitives;
}

/**
 * Derive narrative primitives
 * Returns story elements based on physics state
 */
export function deriveNarrativePrimitives(state: SSICState): string[] {
  const { charge, pressure, velocity, inertia, archetype, resistanceZones, breakthroughPoints } = state;
  const primitives: string[] = [];

  // Story phase based on momentum
  const momentum = (velocity + charge) / 2;
  if (momentum < 30) {
    primitives.push('ordinary world', 'call to adventure', 'initial resistance');
  } else if (momentum < 60) {
    primitives.push('crossing threshold', 'tests and trials', 'gathering allies');
  } else {
    primitives.push('approaching climax', 'confronting shadow', 'seizing reward');
  }

  // Tension state
  if (pressure > 70) {
    primitives.push('high stakes', 'mounting tension', 'breaking point near');
  } else if (pressure > 40) {
    primitives.push('building conflict', 'rising action', 'choices emerging');
  } else {
    primitives.push('equilibrium', 'calm before storm', 'gathering forces');
  }

  // Hero state based on velocity vs inertia
  if (velocity > inertia + 20) {
    primitives.push('hero in motion', 'conquering obstacles', 'gaining power');
  } else if (inertia > velocity + 20) {
    primitives.push('hero stuck', 'facing inner demons', 'in the cave');
  } else {
    primitives.push('hero balanced', 'learning lessons', 'integrating wisdom');
  }

  // Archetype-based narrative
  if (archetype.toLowerCase().includes('rebel')) primitives.push('breaking rules', 'revolution', 'defiance');
  if (archetype.toLowerCase().includes('creator')) primitives.push('making new', 'birthing vision', 'manifestation');
  if (archetype.toLowerCase().includes('sage')) primitives.push('seeking truth', 'gaining wisdom', 'inner journey');
  if (archetype.toLowerCase().includes('hero')) primitives.push('overcoming odds', 'proving worth', 'triumph');

  // Villain based on resistance
  const primaryResistance = resistanceZones[0] || '';
  if (primaryResistance.includes('fear')) primitives.push('villain: fear itself', 'shadow self');
  if (primaryResistance.includes('perfectionism')) primitives.push('villain: inner critic', 'impossible standards');
  if (primaryResistance.includes('scarcity')) primitives.push('villain: not-enough', 'resource scarcity');
  if (primaryResistance.includes('external validation')) primitives.push('villain: others\' expectations', 'judgment');

  // Resolution based on breakthrough
  const primaryBreakthrough = breakthroughPoints[0] || '';
  if (primaryBreakthrough.includes('liberation')) primitives.push('freedom earned', 'chains broken', 'flying');
  if (primaryBreakthrough.includes('manifestation')) primitives.push('vision realized', 'creation complete', 'birth');
  if (primaryBreakthrough.includes('expression')) primitives.push('voice found', 'truth spoken', 'authentic self');

  return primitives;
}
