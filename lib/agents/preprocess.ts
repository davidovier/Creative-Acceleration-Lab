/**
 * Agent Preprocessing
 * Extract quotes, detect pronouns, and normalize input for better agent grounding
 */

/**
 * Extract meaningful quotes from user text
 * Returns direct substrings, preserving order, for use in Insight Agent
 *
 * @param userText - Raw user input
 * @returns Array of 1-5 meaningful quotes
 */
export function extractMeaningfulQuotes(userText: string): string[] {
  if (!userText || typeof userText !== 'string') {
    return [];
  }

  // Split by sentence-ending punctuation and newlines
  const lines = userText
    .split(/[.!?\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Filter meaningful lines
  const meaningful = lines.filter(line => {
    // Remove lines that are too short
    if (line.length < 4) return false;

    // Remove trivial fragments
    const trivialPatterns = [
      /^(I want|I need|I am|but|and|or|the|a|an)$/i,
      /^(yes|no|ok|okay)$/i,
    ];

    if (trivialPatterns.some(pattern => pattern.test(line))) {
      return false;
    }

    // Keep lines that have some substance
    return true;
  });

  // Limit to 3-5 quotes, prefer longer ones
  const sorted = meaningful.sort((a, b) => b.length - a.length);
  const limit = userText.length < 100 ? 2 : userText.length < 300 ? 3 : 5;

  return sorted.slice(0, limit);
}

/**
 * Detect preferred pronoun from user text
 * Defaults to "they" for inclusivity
 *
 * @param userText - Raw user input
 * @returns Preferred pronoun: "they", "he", or "she"
 */
export function getPreferredPronoun(userText: string): 'they' | 'he' | 'she' {
  if (!userText || typeof userText !== 'string') {
    return 'they';
  }

  const lowerText = userText.toLowerCase();

  // Check for explicit gender indicators
  const femaleIndicators = [
    'i am a woman',
    'i\'m a woman',
    'as a woman',
    'female founder',
    'she/her',
    'i am female',
    'i identify as a woman',
  ];

  const maleIndicators = [
    'i am a man',
    'i\'m a man',
    'as a man',
    'male founder',
    'he/him',
    'i am male',
    'i identify as a man',
  ];

  // Check female indicators
  if (femaleIndicators.some(indicator => lowerText.includes(indicator))) {
    return 'she';
  }

  // Check male indicators
  if (maleIndicators.some(indicator => lowerText.includes(indicator))) {
    return 'he';
  }

  // Default to gender-neutral
  return 'they';
}

/**
 * Preprocess user input for all agents
 * Combines quote extraction and pronoun detection
 *
 * @param userText - Raw user input
 * @returns Preprocessing results
 */
export interface PreprocessingResult {
  extractedQuotes: string[];
  pronoun: 'they' | 'he' | 'she';
  cleanedText: string;
}

export function preprocessUserInput(userText: string): PreprocessingResult {
  return {
    extractedQuotes: extractMeaningfulQuotes(userText),
    pronoun: getPreferredPronoun(userText),
    cleanedText: userText.trim(),
  };
}
