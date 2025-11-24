/**
 * Shared Vocabulary Extraction
 * Extract key emotional/creative words from Insight Agent for cross-agent coherence
 */

import { InsightOutput } from './types';

/**
 * Common stopwords to filter out
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
]);

/**
 * Extract meaningful keywords from text
 * @param text - Text to extract keywords from
 * @returns Array of lowercase keywords
 */
function extractWordsFromText(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Keep hyphens for compound words
    .split(/\s+/)
    .filter(word => {
      // Keep words that are:
      // - At least 3 characters
      // - Not stopwords
      // - Not purely numeric
      return (
        word.length >= 3 &&
        !STOPWORDS.has(word) &&
        !/^\d+$/.test(word)
      );
    });
}

/**
 * Extract key emotional and creative keywords from Insight Agent output
 * Returns 5-8 words that define the emotional universe of the session
 *
 * @param insight - Insight Agent output
 * @returns Array of 5-8 meaningful keywords
 */
export function extractKeywords(insight: InsightOutput): string[] {
  const keywords = new Set<string>();

  // Extract from archetype (highest priority)
  const archetypeWords = extractWordsFromText(insight.archetype_guess);
  archetypeWords.forEach(word => keywords.add(word));

  // Extract from core wound
  const woundWords = extractWordsFromText(insight.core_wound);
  woundWords.slice(0, 3).forEach(word => keywords.add(word));

  // Extract from core desire
  const desireWords = extractWordsFromText(insight.core_desire);
  desireWords.slice(0, 3).forEach(word => keywords.add(word));

  // Extract from emotional summary
  const summaryWords = extractWordsFromText(insight.emotional_summary);
  summaryWords.slice(0, 2).forEach(word => keywords.add(word));

  // Convert to array and limit to 8 most meaningful
  const keywordArray = Array.from(keywords);

  // Prioritize longer, more specific words
  const sorted = keywordArray.sort((a, b) => {
    // Prefer longer words (more specific)
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    // Alphabetical as tiebreaker
    return a.localeCompare(b);
  });

  return sorted.slice(0, 8);
}

/**
 * Format keywords for prompt insertion
 * @param keywords - Array of keywords
 * @returns Formatted string for prompt
 */
export function formatKeywordsForPrompt(keywords: string[]): string {
  if (keywords.length === 0) {
    return 'No keywords extracted.';
  }

  return keywords.map(k => `"${k}"`).join(', ');
}
