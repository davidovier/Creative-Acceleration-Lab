/**
 * Creative OS Motion System
 * Animation parameters and Framer Motion variants
 */

// Duration tokens (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  ritual: 1.5,
};

// Easing curves
export const easing = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  spring: [0.68, -0.55, 0.265, 1.55],
  ease: [0.4, 0.0, 0.2, 1],
  linear: [0, 0, 1, 1],
};

// Spring configurations
export const spring = {
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
};

// Framer Motion variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smooth as any }
  },
};

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smooth as any }
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.smooth as any }
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast }
  },
};

// Breathing animation (for ambient UI)
export const breathing = {
  scale: [1, 1.02, 1],
  opacity: [0.6, 1, 0.6],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Float animation (for keywords)
export const float = {
  y: [0, -5, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Pulse animation (for symbols)
export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Ritual mode - slow reveal
export const ritualReveal = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.ritual,
      ease: easing.smooth as any
    }
  },
};

// Agent section entrance
export const agentEntrance = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: custom * 0.15,
      duration: duration.slow,
      ease: easing.smooth as any,
    },
  }),
};

// Color swatch animation
export const colorSwatchReveal = {
  hidden: { opacity: 0, scale: 0, rotate: -45 },
  visible: (custom: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: custom * 0.1,
      duration: duration.normal,
      type: 'spring' as const,
      stiffness: 200,
    },
  }),
};
