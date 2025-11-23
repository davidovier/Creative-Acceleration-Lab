/**
 * Agent Orchestrator
 * Sequential execution of all four agents
 */

import { runInsightAgent } from './insight';
import { runStoryAgent } from './story';
import { runPrototypeAgent } from './prototype';
import { runSymbolAgent } from './symbol';
import { SessionReport } from './types';

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

  console.log('='.repeat(60));
  console.log('SESSION STARTED');
  console.log('='.repeat(60));
  console.log(`User text: ${userText.slice(0, 100)}...`);
  console.log('');

  try {
    // Step 1: Insight Agent
    console.log('→ Running Insight Agent...');
    const insightStart = Date.now();
    const insight = await runInsightAgent(userText);
    const insightDuration = Date.now() - insightStart;
    console.log(`✓ Insight Agent complete (${insightDuration}ms)`);
    console.log(`  Archetype: ${insight.archetype_guess}`);
    console.log('');

    // Step 2: Story Agent
    console.log('→ Running Story Agent...');
    const storyStart = Date.now();
    const story = await runStoryAgent(userText, insight);
    const storyDuration = Date.now() - storyStart;
    console.log(`✓ Story Agent complete (${storyDuration}ms)`);
    console.log(`  Current: ${story.current_chapter.slice(0, 60)}...`);
    console.log('');

    // Step 3: Prototype Agent
    console.log('→ Running Prototype Agent...');
    const prototypeStart = Date.now();
    const prototype = await runPrototypeAgent(userText, insight, story);
    const prototypeDuration = Date.now() - prototypeStart;
    console.log(`✓ Prototype Agent complete (${prototypeDuration}ms)`);
    console.log(`  Goal: ${prototype.goal.slice(0, 60)}...`);
    console.log('');

    // Step 4: Symbol Agent
    console.log('→ Running Symbol Agent...');
    const symbolStart = Date.now();
    const symbol = await runSymbolAgent(userText, insight, story, prototype);
    const symbolDuration = Date.now() - symbolStart;
    console.log(`✓ Symbol Agent complete (${symbolDuration}ms)`);
    console.log(`  Primary symbol: ${symbol.primary_symbol.slice(0, 60)}...`);
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
    };

    console.log('='.repeat(60));
    console.log('SESSION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total duration: ${totalDuration}ms`);
    console.log(`Breakdown:`);
    console.log(`  - Insight: ${insightDuration}ms`);
    console.log(`  - Story: ${storyDuration}ms`);
    console.log(`  - Prototype: ${prototypeDuration}ms`);
    console.log(`  - Symbol: ${symbolDuration}ms`);
    console.log('');

    return report;

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('SESSION FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error(`Duration before failure: ${totalDuration}ms`);
    console.error('');

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
