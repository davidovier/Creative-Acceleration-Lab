/**
 * Prototype Agent API Route
 * For debugging and testing the Prototype agent individually
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPrototypeAgent } from '@/lib/agents/prototype';
import { InsightOutput, StoryOutput } from '@/lib/agents/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/agents/prototype
 * Test Prototype agent with user text + insight + story outputs
 *
 * Request body:
 * {
 *   "userText": "string",
 *   "insight": InsightOutput,
 *   "story": StoryOutput
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "result": PrototypeOutput
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userText, insight, story } = body;

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

    if (!story || typeof story !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'story is required and must be an object (StoryOutput)' },
        { status: 400 }
      );
    }

    // Run agent
    console.log(`[API] Running Prototype agent`);
    const result = await runPrototypeAgent(
      userText,
      insight as InsightOutput,
      story as StoryOutput
    );

    return NextResponse.json({
      ok: true,
      result,
    });

  } catch (error: any) {
    console.error('[API] Prototype agent error:', error);
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
