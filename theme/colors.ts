/**
 * Creative OS Color System
 * Emotional palette tokens for the Creative Acceleration Lab
 */

export const emotionalColors = {
  // Core emotional states
  wound: {
    primary: '#DC2626',    // red-600
    light: '#FEE2E2',      // red-50
    dark: '#991B1B',       // red-800
  },
  desire: {
    primary: '#10B981',    // emerald-500
    light: '#D1FAE5',      // emerald-50
    dark: '#065F46',       // emerald-800
  },
  transformation: {
    primary: '#8B5CF6',    // violet-500
    light: '#EDE9FE',      // violet-50
    dark: '#5B21B6',       // violet-800
  },

  // Agent colors
  insight: {
    primary: '#A855F7',    // purple-500
    light: '#FAF5FF',      // purple-50
    gradient: 'from-purple-500 to-pink-500',
  },
  story: {
    primary: '#3B82F6',    // blue-500
    light: '#EFF6FF',      // blue-50
    gradient: 'from-blue-500 to-cyan-500',
  },
  prototype: {
    primary: '#F59E0B',    // amber-500
    light: '#FFFBEB',      // amber-50
    gradient: 'from-amber-500 to-orange-500',
  },
  symbol: {
    primary: '#EC4899',    // pink-500
    light: '#FDF2F8',      // pink-50
    gradient: 'from-pink-500 to-rose-500',
  },

  // UI states
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',  // gray-50
    dark: '#111827',       // gray-900
  },
  text: {
    primary: '#111827',    // gray-900
    secondary: '#6B7280',  // gray-500
    muted: '#9CA3AF',      // gray-400
  },

  // Creative energy levels
  energy: {
    high: '#EF4444',       // red-500 - intense
    medium: '#F59E0B',     // amber-500 - active
    low: '#3B82F6',        // blue-500 - calm
    flow: '#10B981',       // emerald-500 - aligned
  },

  // Consistency score colors
  consistency: {
    excellent: '#10B981',  // 90-100
    good: '#3B82F6',       // 75-89
    fair: '#F59E0B',       // 60-74
    poor: '#EF4444',       // <60
  },
};

/**
 * Get consistency color based on score
 */
export function getConsistencyColor(score: number): string {
  if (score >= 90) return emotionalColors.consistency.excellent;
  if (score >= 75) return emotionalColors.consistency.good;
  if (score >= 60) return emotionalColors.consistency.fair;
  return emotionalColors.consistency.poor;
}

/**
 * Get energy color based on keyword intensity
 */
export function getEnergyColor(keywordCount: number): string {
  if (keywordCount >= 8) return emotionalColors.energy.high;
  if (keywordCount >= 6) return emotionalColors.energy.medium;
  if (keywordCount >= 4) return emotionalColors.energy.low;
  return emotionalColors.energy.flow;
}

/**
 * Extract dominant color from color emotions
 */
export function getDominantColor(colorEmotions: Array<{ color: string; meaning: string }>): string {
  return colorEmotions[0]?.color || emotionalColors.transformation.primary;
}
