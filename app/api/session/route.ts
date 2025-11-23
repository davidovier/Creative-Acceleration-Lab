/**
 * Session API
 * Multi-agent orchestration with RAG-powered Claude agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFullSession, validateUserInput } from '@/lib/agents/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for agent execution

/**
 * POST /api/session
 * Generate multi-agent session report
 *
 * Request body:
 * {
 *   "userText": "User's creative challenge description"
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "report": SessionReport (includes insight, story, prototype, symbol)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userText } = body;

    // Validate input
    const validation = validateUserInput(userText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Run full session with all agents
    console.log(`[API] Starting session for user text (${userText.length} chars)`);
    const report = await runFullSession(userText);

    console.log('[API] Session complete, returning report');
    return NextResponse.json({
      ok: true,
      report,
    });

  } catch (error: any) {
    console.error('[API] Session error:', error);
    return NextResponse.json(
      {
        error: 'Session failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
