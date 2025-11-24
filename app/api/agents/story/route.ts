/**
 * Story Agent API Route (Prompt 7: keyword & pronoun-aware)
 * For debugging and testing the Story agent individually
 */

import { NextRequest, NextResponse } from 'next/server';
import { runStoryAgent } from '@/lib/agents/story';
import { InsightOutput } from '@/lib/agents/types';
import { extractKeywords } from '@/lib/agents/vocabulary';
import { getPreferredPronoun } from '@/lib/agents/preprocess';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/agents/story
 * Test Story agent with user text + insight output
 *
 * Request body:
 * {
 *   "userText": "string",
 *   "insight": InsightOutput
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "result": StoryOutput
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userText, insight } = body;

    // Validate input
    if (!userText || typeof userText !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'userText is required and must be a string' },
        { status: 400 }
      );
    }

    if (!insight || typeof insight !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'insight is required and must be an object (InsightOutput)' },
        { status: 400 }
      );
    }

    // Validate insight structure
    const requiredFields = ['emotional_summary', 'core_wound', 'core_desire', 'archetype_guess', 'supporting_quotes'];
    for (const field of requiredFields) {
      if (!(field in insight)) {
        return NextResponse.json(
          { ok: false, error: `insight.${field} is required` },
          { status: 400 }
        );
      }
    }

    // Extract keywords and pronoun
    const keywords = extractKeywords(insight as InsightOutput);
    const pronoun = getPreferredPronoun(userText);

    // Run agent
    console.log(`[API] Running Story agent (archetype: ${insight.archetype_guess}, pronoun: ${pronoun})`);
    const result = await runStoryAgent(userText, insight as InsightOutput, keywords, pronoun);

    return NextResponse.json({
      ok: true,
      result,
      preprocessing: {
        keywords,
        pronoun,
      },
    });

  } catch (error: any) {
    console.error('[API] Story agent error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
