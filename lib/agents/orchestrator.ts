/**
 * Agent Orchestrator
 * Sequential execution of all four agents
 */

import { runInsightAgent } from './insight';
import { runStoryAgent } from './story';
import { runPrototypeAgent } from './prototype';
import { runSymbolAgent } from './symbol';
import { SessionReport } from './types';
import { ENABLE_AGENT_DEBUG_LOGS } from './config';
import { computeSessionConsistency, getConsistencyRating } from './consistency';

/**
 * Run full session with all four agents sequentially
 *
 * Execution flow:
 * 1. Insight Agent - Emotional and archetypal analysis
 * 2. Story Agent - Narrative structure (uses Insight output)
 * 3. Prototype Agent - 5-day sprint plan (uses Insight + Story)
 * 4. Symbol Agent - Visual symbols (uses all previous outputs)
 *
 * @param userText - User's input text describing their creative challenge
 * @returns Complete session report with all agent outputs
 */
export async function runFullSession(userText: string): Promise<SessionReport> {
  const startTime = Date.now();

  // Enhanced session header
  console.log('\n' + '═'.repeat(60));
  console.log('🎨  CREATIVE ACCELERATION SESSION');
  console.log('═'.repeat(60));
  console.log(`📝 Input: ${userText.length} chars`);
  if (ENABLE_AGENT_DEBUG_LOGS) {
    console.log(`🔍 Debug mode: ENABLED`);
    console.log(`📋 Preview: "${userText.slice(0, 120)}..."`);
  }
  console.log('');

  try {
    // Step 1: Insight Agent
    console.log('🔮 [1/5] Insight Agent — Mapping emotional terrain...');
    const insightStart = Date.now();
    const insight = await runInsightAgent(userText);
    const insightDuration = Date.now() - insightStart;
    console.log(`   ✓ Complete (${(insightDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Archetype: ${insight.archetype_guess}`);
    console.log(`   → Core wound: ${insight.core_wound.slice(0, 50)}...`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Quotes retrieved: ${insight.supporting_quotes.length}`);
    }
    console.log('');

    // Step 2: Story Agent
    console.log('📖 [2/5] Story Agent — Crafting micro-myth...');
    const storyStart = Date.now();
    const story = await runStoryAgent(userText, insight);
    const storyDuration = Date.now() - storyStart;
    console.log(`   ✓ Complete (${(storyDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Current: ${story.current_chapter.slice(0, 55)}...`);
    console.log(`   → Desired: ${story.desired_chapter.slice(0, 55)}...`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Story length: ${story.story_paragraph.length} chars`);
    }
    console.log('');

    // Step 3: Prototype Agent
    console.log('⚡ [3/5] Prototype Agent — Designing acceleration sprint...');
    const prototypeStart = Date.now();
    const prototype = await runPrototypeAgent(userText, insight, story);
    const prototypeDuration = Date.now() - prototypeStart;
    console.log(`   ✓ Complete (${(prototypeDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Goal: ${prototype.goal.slice(0, 60)}...`);
    console.log(`   → Days planned: ${prototype.day_by_day_plan.length}`);
    console.log(`   → Constraints: ${prototype.constraints.length}`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → AI features: ${prototype.potential_ai_features.length}`);
      console.log(`   → Risks identified: ${prototype.risks.length}`);
    }
    console.log('');

    // Step 4: Symbol Agent
    console.log('✨ [4/5] Symbol Agent — Distilling visual language...');
    const symbolStart = Date.now();
    const symbol = await runSymbolAgent(userText, insight, story, prototype);
    const symbolDuration = Date.now() - symbolStart;
    console.log(`   ✓ Complete (${(symbolDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Primary: ${symbol.primary_symbol.slice(0, 55)}...`);
    console.log(`   → Motifs: ${symbol.secondary_symbols.length} + ${symbol.conceptual_motifs.length}`);
    console.log(`   → Colors: ${symbol.color_palette_suggestions.length}`);
    console.log('');

    // Step 5: Compute consistency score
    console.log('🔗 [5/5] Consistency Check — Validating cross-agent alignment...');
    const consistencyStart = Date.now();
    const consistency = computeSessionConsistency(insight, story, prototype, symbol);
    const consistencyDuration = Date.now() - consistencyStart;
    console.log(`   ✓ Complete (${(consistencyDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Score: ${consistency.score}/100 (${getConsistencyRating(consistency.score)})`);
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`   → Checks: ${consistency.notes.filter(n => n.startsWith('✓')).length}/${consistency.notes.length} passed`);
    }
    console.log('');

    // Build final report
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
    };

    // Enhanced completion summary
    console.log('═'.repeat(60));
    console.log('✅  SESSION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`⏱️  Total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📊 Breakdown:`);
    console.log(`   • Insight:   ${(insightDuration / 1000).toFixed(2)}s (${((insightDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Story:     ${(storyDuration / 1000).toFixed(2)}s (${((storyDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Prototype: ${(prototypeDuration / 1000).toFixed(2)}s (${((prototypeDuration / totalDuration) * 100).toFixed(0)}%)`);
    console.log(`   • Symbol:    ${(symbolDuration / 1000).toFixed(2)}s (${((symbolDuration / totalDuration) * 100).toFixed(0)}%)`);
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
