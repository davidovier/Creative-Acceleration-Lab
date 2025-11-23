/**
 * Symbol Agent API Route
 * For debugging and testing the Symbol agent individually
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSymbolAgent } from '@/lib/agents/symbol';
import { InsightOutput, StoryOutput, PrototypeOutput } from '@/lib/agents/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/agents/symbol
 * Test Symbol agent with user text + all previous agent outputs
 *
 * Request body:
 * {
 *   "userText": "string",
 *   "insight": InsightOutput,
 *   "story": StoryOutput,
 *   "prototype": PrototypeOutput
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "result": SymbolOutput
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userText, insight, story, prototype } = body;

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

    if (!prototype || typeof prototype !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'prototype is required and must be an object (PrototypeOutput)' },
        { status: 400 }
      );
    }

    // Run agent
    console.log(`[API] Running Symbol agent`);
    const result = await runSymbolAgent(
      userText,
      insight as InsightOutput,
      story as StoryOutput,
      prototype as PrototypeOutput
    );

    return NextResponse.json({
      ok: true,
      result,
    });

  } catch (error: any) {
    console.error('[API] Symbol agent error:', error);
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
