/**
 * Agent Orchestrator (Prompt 7: Enhanced with preprocessing & refinement)
 * (Prompt 9: Enhanced with SSIC physics-based symbolic intelligence)
 * Sequential execution of all four agents with shared vocabulary and symbolic linkage
 */

import { runInsightAgent } from './insight';
import { runStoryAgent } from './story';
import { runPrototypeAgent } from './prototype';
import { runSymbolAgent } from './symbol';
import { SessionReport } from './types';
import { ENABLE_AGENT_DEBUG_LOGS } from './config';
import { computeSessionConsistency, getConsistencyRating } from './consistency';
import { preprocessUserInput } from './preprocess';
import { extractKeywords } from './vocabulary';
import { mapColorsToEmotion } from './colorLogic';
import { refinePrototypeWithSymbols } from './refinePrototype';
import { extractPhysicsFromInsight } from '../ssic/extractPhysics';
import { enrichAgentContext, extractSSICSummary } from '../ssic/context';
import { SSICState } from '../ssic/state';

/**
 * Run full session with all four agents sequentially (Prompt 7 + Prompt 9)
 *
 * Execution flow:
 * 0. Preprocessing - Extract quotes, pronoun, clean text
 * 1. Insight Agent - Emotional and archetypal analysis (quote-aware)
 * 2. Vocabulary Extraction - Shared keywords for cross-agent coherence
 * 2.5. SSIC Physics Extraction - Build unified symbolic state (Prompt 9)
 * 3. Story Agent - Narrative structure (keyword, pronoun & SSIC-aware)
 * 4. Prototype Agent - 5-day sprint plan (keyword & SSIC-aware)
 * 5. Symbol Agent - Visual symbols (keyword, pronoun & SSIC-aware)
 * 6. Color Mapping - Transform palette with emotional meanings
 * 7. Refinement - Weave symbolic language into prototype tasks
 * 8. Consistency Check - Validate cross-agent alignment (SSIC-enhanced)
 *
 * @param userText - User's input text describing their creative challenge
 * @returns Complete session report with all agent outputs and preprocessing data
 */
export async function runFullSession(userText: string): Promise<SessionReport> {
  const startTime = Date.now();

  // Enhanced session header
  console.log('\n' + '═'.repeat(60));
  console.log('🎨  CREATIVE ACCELERATION SESSION (Prompt 7 + SSIC)');
  console.log('═'.repeat(60));
  console.log(`📝 Input: ${userText.length} chars`);
  if (ENABLE_AGENT_DEBUG_LOGS) {
    console.log(`🔍 Debug mode: ENABLED`);
    console.log(`📋 Preview: "${userText.slice(0, 120)}..."`);
  }
  console.log('');

  try {
    // Step 0: Preprocessing
    console.log('🔬 [0/8] Preprocessing — Extracting quotes, pronoun, cleaning text...');
    const preprocessStart = Date.now();
    const { extractedQuotes, pronoun, cleanedText } = preprocessUserInput(userText);
    const preprocessDuration = Date.now() - preprocessStart;
    console.log(`   ✓ Complete (${(preprocessDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Quotes extracted: ${extractedQuotes.length}`);
    console.log(`   → Pronoun detected: ${pronoun}`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Cleaned text length: ${cleanedText.length} chars`);
      if (extractedQuotes.length > 0) {
        console.log(`   → First quote: "${extractedQuotes[0].slice(0, 50)}..."`);
      }
    }
    console.log('');

    // Step 1: Insight Agent (quote-aware)
    console.log('🔮 [1/8] Insight Agent — Mapping emotional terrain...');
    const insightStart = Date.now();
    const insight = await runInsightAgent(cleanedText, extractedQuotes);
    const insightDuration = Date.now() - insightStart;
    console.log(`   ✓ Complete (${(insightDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Archetype: ${insight.archetype_guess}`);
    console.log(`   → Core wound: ${insight.core_wound.slice(0, 50)}...`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Supporting quotes: ${insight.supporting_quotes.length}`);
    }
    console.log('');

    // Step 2: Extract shared vocabulary
    console.log('📚 [2/9] Vocabulary Extraction — Building shared lexicon...');
    const vocabStart = Date.now();
    const keywords = extractKeywords(insight);
    const vocabDuration = Date.now() - vocabStart;
    console.log(`   ✓ Complete (${(vocabDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Keywords: ${keywords.join(', ')}`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Count: ${keywords.length}`);
    }
    console.log('');

    // Step 2.5: SSIC Physics Extraction (Prompt 9)
    console.log('⚛️  [2.5/9] SSIC Physics — Building unified symbolic state...');
    const ssicStart = Date.now();
    const ssicState: SSICState = extractPhysicsFromInsight(insight, keywords);
    const ssicDuration = Date.now() - ssicStart;
    console.log(`   ✓ Complete (${(ssicDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Charge: ${ssicState.charge.toFixed(0)} | Velocity: ${ssicState.velocity.toFixed(0)} | Inertia: ${ssicState.inertia.toFixed(0)}`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Flow Potential: ${ssicState.flowPotential.toFixed(0)}`);
      console.log(`   → Resistance Zones: ${ssicState.resistanceZones.join(', ')}`);
      console.log(`   → Breakthrough Points: ${ssicState.breakthroughPoints.join(', ')}`);
    }
    console.log('');

    // Step 3: Story Agent (keyword, pronoun & SSIC-aware)
    console.log('📖 [3/9] Story Agent — Crafting micro-myth...');
    const storyStart = Date.now();
    const storyEnriched = enrichAgentContext('story', ssicState, {
      userText: cleanedText,
      insight,
      keywords,
      pronoun,
    });
    const story = await runStoryAgent(cleanedText, insight, keywords, pronoun, storyEnriched.ssic);
    const storyDuration = Date.now() - storyStart;
    console.log(`   ✓ Complete (${(storyDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Current: ${story.current_chapter.slice(0, 55)}...`);
    console.log(`   → Desired: ${story.desired_chapter.slice(0, 55)}...`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Story length: ${story.story_paragraph.length} chars`);
    }
    console.log('');

    // Step 4: Prototype Agent (keyword & SSIC-aware)
    console.log('⚡ [4/9] Prototype Agent — Designing acceleration sprint...');
    const prototypeStart = Date.now();
    const prototypeEnriched = enrichAgentContext('prototype', ssicState, {
      userText: cleanedText,
      insight,
      story,
      keywords,
    });
    const initialPrototype = await runPrototypeAgent(cleanedText, insight, story, keywords, prototypeEnriched.ssic);
    const prototypeDuration = Date.now() - prototypeStart;
    console.log(`   ✓ Complete (${(prototypeDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Goal: ${initialPrototype.goal.slice(0, 60)}...`);
    console.log(`   → Days planned: ${initialPrototype.day_by_day_plan.length}`);
    console.log(`   → Constraints: ${initialPrototype.constraints.length}`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → AI features: ${initialPrototype.potential_ai_features.length}`);
      console.log(`   → Risks identified: ${initialPrototype.risks.length}`);
    }
    console.log('');

    // Step 5: Symbol Agent (keyword, pronoun & SSIC-aware)
    console.log('✨ [5/9] Symbol Agent — Distilling visual language...');
    const symbolStart = Date.now();
    const symbolEnriched = enrichAgentContext('symbol', ssicState, {
      userText: cleanedText,
      insight,
      story,
      prototype: initialPrototype,
      keywords,
      pronoun,
    });
    const rawSymbol = await runSymbolAgent(cleanedText, insight, story, initialPrototype, keywords, pronoun, symbolEnriched.ssic);
    const symbolDuration = Date.now() - symbolStart;
    console.log(`   ✓ Complete (${(symbolDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Primary: ${rawSymbol.primary_symbol.slice(0, 55)}...`);
    console.log(`   → Motifs: ${rawSymbol.secondary_symbols.length} + ${rawSymbol.conceptual_motifs.length}`);
    console.log(`   → Colors: ${rawSymbol.color_palette_suggestions.length}`);
    console.log('');

    // Step 6: Color Mapping
    console.log('🎨 [6/9] Color Mapping — Associating emotions with palette...');
    const colorStart = Date.now();
    const colorEmotions = mapColorsToEmotion(
      rawSymbol.color_palette_suggestions.map(c => typeof c === 'string' ? c : c.color),
      insight
    );
    const symbol = {
      ...rawSymbol,
      color_palette_suggestions: colorEmotions,
    };
    const colorDuration = Date.now() - colorStart;
    console.log(`   ✓ Complete (${(colorDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Emotions mapped: ${colorEmotions.length}`);
    if (ENABLE_AGENT_DEBUG_LOGS && colorEmotions.length > 0) {
      console.log(`   → First: ${colorEmotions[0].color} — ${colorEmotions[0].meaning.slice(0, 40)}...`);
    }
    console.log('');

    // Step 7: Refine Prototype with Symbolic Language
    console.log('🔗 [7/9] Prototype Refinement — Weaving symbolic language...');
    const refineStart = Date.now();
    const prototype = await refinePrototypeWithSymbols({
      userText: cleanedText,
      insight,
      story,
      prototype: initialPrototype,
      symbol,
    });
    const refineDuration = Date.now() - refineStart;
    console.log(`   ✓ Complete (${(refineDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Tasks refined with symbolic imagery`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Refined goal: ${prototype.goal.slice(0, 50)}...`);
    }
    console.log('');

    // Step 8: Compute consistency score (SSIC-enhanced)
    console.log('🔍 [8/9] Consistency Check — Validating cross-agent alignment...');
    const consistencyStart = Date.now();
    const consistency = computeSessionConsistency(insight, story, prototype, symbol, ssicState);
    const consistencyDuration = Date.now() - consistencyStart;
    console.log(`   ✓ Complete (${(consistencyDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Score: ${consistency.score}/100 (${getConsistencyRating(consistency.score)})`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Checks: ${consistency.notes.filter(n => n.startsWith('✓')).length}/${consistency.notes.length} passed`);
    }
    console.log('');

    // Build final report with preprocessing data and SSIC summary
    const totalDuration = Date.now() - startTime;
    const report: SessionReport = {
      userText,
      timestamp: new Date().toISOString(),
      insight,
      story,
      prototype,
      symbol,
      totalDuration,
      consistency,
      preprocessing: {
        extractedQuotes,
        pronoun,
        keywords,
      },
      ssic: ENABLE_AGENT_DEBUG_LOGS ? extractSSICSummary(ssicState) : undefined,
    };

    // Enhanced completion summary
    console.log('═'.repeat(60));
    console.log('✅  SESSION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`⏱️  Total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📊 Breakdown:`);
    console.log(`   • Preprocess: ${(preprocessDuration / 1000).toFixed(2)}s (${((preprocessDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Vocabulary: ${(vocabDuration / 1000).toFixed(2)}s (${((vocabDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • SSIC:       ${(ssicDuration / 1000).toFixed(2)}s (${((ssicDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Insight:    ${(insightDuration / 1000).toFixed(2)}s (${((insightDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Story:      ${(storyDuration / 1000).toFixed(2)}s (${((storyDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Prototype:  ${(prototypeDuration / 1000).toFixed(2)}s (${((prototypeDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Symbol:     ${(symbolDuration / 1000).toFixed(2)}s (${((symbolDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • ColorMap:   ${(colorDuration / 1000).toFixed(2)}s (${((colorDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Refinement: ${(refineDuration / 1000).toFixed(2)}s (${((refineDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`🎯 Coherence: ${consistency.score}/100 (${getConsistencyRating(consistency.score)})`);
    console.log('═'.repeat(60) + '\n');

    return report;

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error('\n' + '═'.repeat(60));
    console.error('❌  SESSION FAILED');
    console.error('═'.repeat(60));
    console.error(`💥 Error: ${error.message}`);
    console.error(`⏱️  Duration before failure: ${(totalDuration / 1000).toFixed(2)}s`);
    if (ENABLE_AGENT_DEBUG_LOGS && error.stack) {
      console.error(`🔍 Stack trace:`);
      console.error(error.stack);
    }
    console.error('═'.repeat(60) + '\n');

    throw error;
  }
}

/**
 * Validate user input before running session
 * @param userText - User input to validate
 * @returns Validation result
 */
export function validateUserInput(userText: string): {
  valid: boolean;
  error?: string;
} {
  if (!userText || typeof userText !== 'string') {
    return {
      valid: false,
      error: 'User text is required and must be a string',
    };
  }

  const trimmed = userText.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'User text cannot be empty',
    };
  }

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'User text must be at least 10 characters',
    };
  }

  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: 'User text must be less than 2000 characters',
    };
  }

  return { valid: true };
}
