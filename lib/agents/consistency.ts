/**
 * Cross-Agent Consistency Checker (Prompt 9: Enhanced with SSIC physics alignment)
 * Validates thematic alignment across all four agents
 */

import { InsightOutput, StoryOutput, PrototypeOutput, SymbolOutput } from './types';
import { SSICState } from '../ssic/state';

export interface ConsistencyCheck {
  score: number; // 0-100
  notes: string[];
}

/**
 * Compute session consistency across all agents (Prompt 9: SSIC-enhanced)
 * Checks for thematic alignment, archetype consistency, narrative coherence, and physics metaphor unity
 *
 * @param insight - Insight agent output
 * @param story - Story agent output
 * @param prototype - Prototype agent output
 * @param symbol - Symbol agent output
 * @param ssic - Optional SSIC state for physics-based checks (Prompt 9)
 * @returns Consistency score and detailed notes
 */
export function computeSessionConsistency(
  insight: InsightOutput,
  story: StoryOutput,
  prototype: PrototypeOutput,
  symbol: SymbolOutput,
  ssic?: SSICState
): ConsistencyCheck {
  const notes: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // ============================================================================
  // CHECK 1: Archetype appears in story text (15 points)
  // ============================================================================
  maxScore += 15;
  const archetypeLower = insight.archetype_guess.toLowerCase();
  const storyTextLower = `${story.hero_description} ${story.story_paragraph}`.toLowerCase();

  if (storyTextLower.includes(archetypeLower)) {
    totalScore += 15;
    notes.push(`✓ Archetype "${insight.archetype_guess}" appears in story narrative`);
  } else {
    // Partial credit if story captures the essence even without exact word
    const archetypeKeywords = archetypeLower.split(' ');
    const hasRelatedTerms = archetypeKeywords.some(word => storyTextLower.includes(word));
    if (hasRelatedTerms) {
      totalScore += 8;
      notes.push(`~ Archetype "${insight.archetype_guess}" partially reflected in story`);
    } else {
      notes.push(`✗ Archetype "${insight.archetype_guess}" not clearly present in story`);
    }
  }

  // ============================================================================
  // CHECK 2: Prototype goal references core themes (20 points)
  // ============================================================================
  maxScore += 20;
  const coreThemes = [
    insight.core_desire.toLowerCase(),
    insight.core_wound.toLowerCase(),
    story.desired_chapter.toLowerCase(),
  ];

  const prototypeGoalLower = prototype.goal.toLowerCase();
  const prototypeTasksText = prototype.day_by_day_plan
    .flatMap(day => day.tasks)
    .join(' ')
    .toLowerCase();

  let themeMatches = 0;
  coreThemes.forEach((theme, index) => {
    const themeWords = theme.split(' ').filter(w => w.length > 4); // Filter short words
    const hasThemeInGoal = themeWords.some(word => prototypeGoalLower.includes(word));
    const hasThemeInTasks = themeWords.some(word => prototypeTasksText.includes(word));

    if (hasThemeInGoal || hasThemeInTasks) {
      themeMatches++;
    }
  });

  if (themeMatches === 3) {
    totalScore += 20;
    notes.push('✓ Prototype plan strongly references core emotional themes');
  } else if (themeMatches === 2) {
    totalScore += 13;
    notes.push('~ Prototype plan partially connects to core themes');
  } else if (themeMatches === 1) {
    totalScore += 7;
    notes.push('~ Prototype plan weakly connects to core themes');
  } else {
    notes.push('✗ Prototype plan does not clearly reference core emotional themes');
  }

  // ============================================================================
  // CHECK 3: Symbol primary connects to core wound/desire (20 points)
  // ============================================================================
  maxScore += 20;
  const symbolPrimaryLower = symbol.primary_symbol.toLowerCase();
  const woundWords = insight.core_wound.toLowerCase().split(' ').filter(w => w.length > 4);
  const desireWords = insight.core_desire.toLowerCase().split(' ').filter(w => w.length > 4);

  const woundMatch = woundWords.some(word => symbolPrimaryLower.includes(word));
  const desireMatch = desireWords.some(word => symbolPrimaryLower.includes(word));

  if (woundMatch || desireMatch) {
    totalScore += 20;
    notes.push('✓ Primary symbol directly connects to core wound or desire');
  } else {
    // Check for archetype match as fallback
    if (symbolPrimaryLower.includes(archetypeLower)) {
      totalScore += 12;
      notes.push('~ Primary symbol references archetype but not core wound/desire');
    } else {
      notes.push('✗ Primary symbol does not clearly connect to core emotional themes');
    }
  }

  // ============================================================================
  // CHECK 4: Story villain relates to core wound (15 points)
  // ============================================================================
  maxScore += 15;
  const villainLower = story.villain_description.toLowerCase();
  const woundInVillain = woundWords.some(word => villainLower.includes(word));

  if (woundInVillain) {
    totalScore += 15;
    notes.push('✓ Story villain directly relates to core wound');
  } else {
    // Check if villain captures oppositional force conceptually
    const oppositionWords = ['fear', 'block', 'resist', 'doubt', 'shadow', 'system'];
    const hasOpposition = oppositionWords.some(word => villainLower.includes(word));
    if (hasOpposition) {
      totalScore += 8;
      notes.push('~ Story villain captures oppositional force thematically');
    } else {
      notes.push('✗ Story villain may not clearly oppose the core wound');
    }
  }

  // ============================================================================
  // CHECK 5: Prototype tasks avoid corporate language (15 points)
  // ============================================================================
  maxScore += 15;
  const corporateBuzzwords = [
    'linkedin',
    'networking',
    'stakeholder',
    'cv',
    'resume',
    'professional branding',
    'market research',
    'competitor analysis',
    'pitch deck',
  ];

  const allTasksText = prototype.day_by_day_plan
    .flatMap(day => day.tasks)
    .join(' ')
    .toLowerCase();

  const hasCorporateLanguage = corporateBuzzwords.some(word => allTasksText.includes(word));

  if (!hasCorporateLanguage) {
    totalScore += 15;
    notes.push('✓ Prototype tasks are creative and non-corporate');
  } else {
    notes.push('✗ Prototype tasks contain corporate/conventional language');
  }

  // ============================================================================
  // CHECK 6: Symbol colors align with emotional tone (15 points)
  // ============================================================================
  maxScore += 15;
  const colorPaletteText = symbol.color_palette_suggestions.join(' ').toLowerCase();

  // Look for emotional descriptors in color palette
  const emotionalColorWords = [
    'wound',
    'desire',
    'tension',
    'fear',
    'freedom',
    'transformation',
    'pain',
    'joy',
    'anxiety',
    'peace',
  ];

  const hasEmotionalColors = emotionalColorWords.some(word => colorPaletteText.includes(word));

  if (hasEmotionalColors) {
    totalScore += 15;
    notes.push('✓ Color palette includes emotional/symbolic meanings');
  } else {
    totalScore += 8;
    notes.push('~ Color palette present but may lack explicit emotional connection');
  }

  // ============================================================================
  // SSIC PHYSICS CHECKS (Prompt 9) - Only if SSIC is provided
  // ============================================================================
  if (ssic) {
    // CHECK 7: Physics metaphor alignment (10 points)
    maxScore += 10;
    const storyTextFull = `${story.hero_description} ${story.villain_description} ${story.story_paragraph}`.toLowerCase();
    const prototypeTextFull = `${prototype.goal} ${allTasksText}`.toLowerCase();
    const symbolTextFull = `${symbol.primary_symbol} ${symbol.secondary_symbols.join(' ')}`.toLowerCase();

    // Check for physics-related terms across outputs
    const physicsTerms = [
      // Energy/charge terms
      ...(ssic.charge > 70 ? ['energy', 'charge', 'spark', 'electric', 'power'] : []),
      // Inertia terms
      ...(ssic.inertia > 60 ? ['stuck', 'frozen', 'heavy', 'weight', 'block'] : []),
      // Velocity terms
      ...(ssic.velocity > 60 ? ['moving', 'flow', 'momentum', 'speed', 'accelerat'] : []),
      // Turbulence terms
      ...(ssic.turbulence > 60 ? ['chaos', 'turbulent', 'storm', 'wild'] : []),
      // Viscosity terms
      ...(ssic.viscosity > 70 ? ['thick', 'slow', 'methodical', 'dense'] : []),
    ];

    if (physicsTerms.length > 0) {
      const storyMatches = physicsTerms.filter(term => storyTextFull.includes(term)).length;
      const prototypeMatches = physicsTerms.filter(term => prototypeTextFull.includes(term)).length;
      const symbolMatches = physicsTerms.filter(term => symbolTextFull.includes(term)).length;

      const totalMatches = storyMatches + prototypeMatches + symbolMatches;

      if (totalMatches >= 3) {
        totalScore += 10;
        notes.push('✓ [SSIC] Physics metaphors unified across agents');
      } else if (totalMatches >= 1) {
        totalScore += 5;
        notes.push('~ [SSIC] Physics metaphors partially present');
      } else {
        notes.push('○ [SSIC] Physics metaphors not strongly reflected in outputs');
      }
    } else {
      // No strong physics profile to check
      totalScore += 5;
      notes.push('○ [SSIC] Physics profile neutral, no strong metaphor expected');
    }

    // CHECK 8: Resistance zones addressed in prototype (10 points)
    maxScore += 10;
    if (ssic.resistanceZones.length > 0) {
      const resistanceWords = ssic.resistanceZones
        .flatMap(zone => zone.toLowerCase().split(' '))
        .filter(w => w.length > 4);

      const prototypeAddressesResistance = resistanceWords.some(word =>
        prototypeTextFull.includes(word)
      );

      if (prototypeAddressesResistance) {
        totalScore += 10;
        notes.push('✓ [SSIC] Prototype addresses resistance zones');
      } else {
        notes.push('○ [SSIC] Prototype may not explicitly address resistance zones');
      }
    } else {
      totalScore += 5;
      notes.push('○ [SSIC] No strong resistance zones detected');
    }

    // CHECK 9: Breakthrough points reflected in story arc (10 points)
    maxScore += 10;
    if (ssic.breakthroughPoints.length > 0) {
      const breakthroughWords = ssic.breakthroughPoints
        .flatMap(point => point.toLowerCase().split(' '))
        .filter(w => w.length > 4);

      const storyReflectsBreakthrough = breakthroughWords.some(word =>
        storyTextFull.includes(word) || story.desired_chapter.toLowerCase().includes(word)
      );

      if (storyReflectsBreakthrough) {
        totalScore += 10;
        notes.push('✓ [SSIC] Story arc reflects breakthrough points');
      } else {
        notes.push('○ [SSIC] Story arc may not explicitly reflect breakthrough points');
      }
    } else {
      totalScore += 5;
      notes.push('○ [SSIC] No strong breakthrough points detected');
    }
  }

  // ============================================================================
  // CALCULATE FINAL SCORE
  // ============================================================================
  const finalScore = Math.round((totalScore / maxScore) * 100);

  return {
    score: finalScore,
    notes,
  };
}

/**
 * Get consistency rating based on score
 * @param score - Consistency score (0-100)
 * @returns Human-readable rating
 */
export function getConsistencyRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Weak';
  return 'Poor';
}

/**
 * Get consistency color for UI display
 * @param score - Consistency score (0-100)
 * @returns Tailwind CSS color class
 */
export function getConsistencyColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 75) return 'blue';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}
