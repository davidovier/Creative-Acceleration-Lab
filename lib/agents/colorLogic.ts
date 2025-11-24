/**
 * Emotional Color Mapping
 * Associates colors with emotional themes from Insight Agent
 */

import { InsightOutput } from './types';

export interface ColorEmotion {
  color: string;
  meaning: string;
}

/**
 * Extract hex color from a color string
 * @param colorString - String that may contain hex color
 * @returns Hex color or null
 */
function extractHexColor(colorString: string): string | null {
  const hexMatch = colorString.match(/#[0-9A-Fa-f]{6}/);
  return hexMatch ? hexMatch[0] : null;
}

/**
 * Map colors to emotional meanings based on Insight Agent output
 * Associates palette colors with core_wound, core_desire, and emotional themes
 *
 * @param colors - Raw color strings from Symbol Agent (may include hex + description)
 * @param insight - Insight Agent output for emotional context
 * @returns Array of 3-5 color-emotion mappings
 */
export function mapColorsToEmotion(
  colors: string[],
  insight: InsightOutput
): ColorEmotion[] {
  if (!colors || colors.length === 0) {
    return [
      {
        color: '#808080',
        meaning: 'Neutral gray — emotional palette unavailable',
      },
    ];
  }

  const mapped: ColorEmotion[] = [];

  // Emotional themes to weave into color meanings
  const woundTheme = insight.core_wound.toLowerCase();
  const desireTheme = insight.core_desire.toLowerCase();
  const summaryWords = insight.emotional_summary
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 4)
    .slice(0, 3);

  for (let i = 0; i < colors.length && i < 5; i++) {
    const colorString = colors[i];
    const hexColor = extractHexColor(colorString) || '#000000';

    // Generate symbolic meaning based on position and themes
    let meaning: string;

    switch (i) {
      case 0:
        // First color: core wound
        meaning = generateColorMeaning(hexColor, woundTheme, 'wound');
        break;
      case 1:
        // Second color: core desire
        meaning = generateColorMeaning(hexColor, desireTheme, 'desire');
        break;
      case 2:
        // Third color: transformation
        meaning = generateColorMeaning(hexColor, 'transformation tension', 'transformation');
        break;
      case 3:
        // Fourth color: archetypal energy
        meaning = generateColorMeaning(hexColor, insight.archetype_guess.toLowerCase(), 'archetype');
        break;
      default:
        // Additional colors: emotional summary themes
        const theme = summaryWords[i - 4] || 'creative energy';
        meaning = generateColorMeaning(hexColor, theme, 'energy');
        break;
    }

    mapped.push({
      color: hexColor,
      meaning,
    });
  }

  return mapped;
}

/**
 * Generate symbolic color meaning based on theme and category
 * @param hexColor - Hex color code
 * @param theme - Emotional theme (lowercase)
 * @param category - Category of meaning (wound/desire/transformation/archetype/energy)
 * @returns Symbolic meaning string
 */
function generateColorMeaning(
  hexColor: string,
  theme: string,
  category: string
): string {
  // Extract first few meaningful words from theme
  const themeWords = theme
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 2);

  const themePhrase = themeWords.join(' ');

  // Generate symbolic meaning based on color brightness/hue
  const colorInt = parseInt(hexColor.slice(1), 16);
  const brightness = (colorInt >> 16) + ((colorInt >> 8) & 0xff) + (colorInt & 0xff);
  const isDark = brightness < 384; // Threshold for dark colors

  // Symbolic language templates
  const templates = {
    wound: isDark
      ? `${themePhrase} — shadow held close`
      : `${themePhrase} — exposed and raw`,
    desire: isDark
      ? `${themePhrase} — the pull beneath surface`
      : `${themePhrase} — what calls forward`,
    transformation: isDark
      ? `the threshold between states`
      : `emergence through tension`,
    archetype: isDark
      ? `${themePhrase} — the deeper pattern`
      : `${themePhrase} — energy in motion`,
    energy: isDark
      ? `creative force in compression`
      : `expressive potential unleashed`,
  };

  return templates[category as keyof typeof templates] || `${themePhrase}`;
}

/**
 * Format color emotions for display
 * @param colorEmotions - Array of color-emotion mappings
 * @returns Formatted string for UI
 */
export function formatColorEmotions(colorEmotions: ColorEmotion[]): string {
  return colorEmotions
    .map(ce => `${ce.color} — ${ce.meaning}`)
    .join('\n');
}
