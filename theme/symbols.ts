/**
 * Creative OS Symbol System
 * Symbolic icons and abstract motifs for agents and states
 */

export const agentSymbols = {
  insight: {
    emoji: '🔮',
    name: 'Crystal Vision',
    description: 'Emotional archetypal analysis',
  },
  story: {
    emoji: '📖',
    name: 'Narrative Thread',
    description: 'Hero\'s journey structure',
  },
  prototype: {
    emoji: '⚡',
    name: 'Lightning Sprint',
    description: '5-day acceleration plan',
  },
  symbol: {
    emoji: '✨',
    name: 'Visual Alchemy',
    description: 'Symbolic design language',
  },
  preprocessing: {
    emoji: '🔬',
    name: 'Essence Extraction',
    description: 'Quote and keyword distillation',
  },
  consistency: {
    emoji: '🔗',
    name: 'Coherence Web',
    description: 'Cross-agent alignment',
  },
};

export const stateSymbols = {
  loading: '⏳',
  success: '✓',
  error: '⚠',
  ritual: '🕯️',
  export: '📥',
  flow: '〜',
};

/**
 * SVG abstract motifs for background animations
 */
export const abstractMotifs = {
  liquid: `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
      <g filter="url(#goo)">
        <circle cx="70" cy="100" r="30" fill="currentColor" opacity="0.6" />
        <circle cx="130" cy="100" r="30" fill="currentColor" opacity="0.6" />
        <circle cx="100" cy="70" r="25" fill="currentColor" opacity="0.6" />
        <circle cx="100" cy="130" r="25" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  `,

  circuit: `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,100 L60,100" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
      <circle cx="60" cy="100" r="8" fill="currentColor" opacity="0.5" />
      <path d="M60,100 L100,60" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
      <circle cx="100" cy="60" r="8" fill="currentColor" opacity="0.5" />
      <path d="M60,100 L100,140" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
      <circle cx="100" cy="140" r="8" fill="currentColor" opacity="0.5" />
      <path d="M100,60 L140,100" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
      <path d="M100,140 L140,100" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
      <circle cx="140" cy="100" r="8" fill="currentColor" opacity="0.5" />
      <path d="M140,100 L180,100" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" />
    </svg>
  `,

  spiral: `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,100 Q120,80 140,100 T160,140 Q140,160 100,160 T40,140 Q20,100 40,60 T100,20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            opacity="0.3" />
      <circle cx="100" cy="100" r="5" fill="currentColor" opacity="0.5" />
    </svg>
  `,

  web: `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" stroke-width="1" opacity="0.2" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" stroke-width="1" opacity="0.2" />
      <line x1="40" y1="40" x2="160" y2="160" stroke="currentColor" stroke-width="1" opacity="0.2" />
      <line x1="160" y1="40" x2="40" y2="160" stroke="currentColor" stroke-width="1" opacity="0.2" />
      <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="1" fill="none" opacity="0.2" />
      <circle cx="100" cy="100" r="70" stroke="currentColor" stroke-width="1" fill="none" opacity="0.2" />
    </svg>
  `,
};

/**
 * Get symbol for agent type
 */
export function getAgentSymbol(agent: 'insight' | 'story' | 'prototype' | 'symbol') {
  return agentSymbols[agent];
}

/**
 * Get abstract motif SVG
 */
export function getAbstractMotif(type: 'liquid' | 'circuit' | 'spiral' | 'web' = 'liquid') {
  return abstractMotifs[type];
}
