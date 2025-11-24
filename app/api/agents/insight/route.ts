/**
 * Insight Agent API Route (Prompt 7: quote-aware)
 * For debugging and testing the Insight agent individually
 */

import { NextRequest, NextResponse } from 'next/server';
import { runInsightAgent } from '@/lib/agents/insight';
import { preprocessUserInput } from '@/lib/agents/preprocess';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/agents/insight
 * Test Insight agent with just user text
 *
 * Request body:
 * {
 *   "userText": "string"
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "result": InsightOutput
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userText } = body;

    // Validate input
    if (!userText || typeof userText !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'userText is required and must be a string' },
        { status: 400 }
      );
    }

    if (userText.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: 'userText must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (userText.length > 2000) {
      return NextResponse.json(
        { ok: false, error: 'userText must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Preprocess user input
    const { extractedQuotes, cleanedText } = preprocessUserInput(userText);

    // Run agent
    console.log(`[API] Running Insight agent (${userText.length} chars, ${extractedQuotes.length} quotes)`);
    const result = await runInsightAgent(cleanedText, extractedQuotes);

    return NextResponse.json({
      ok: true,
      result,
      preprocessing: {
        extractedQuotes,
        quotesCount: extractedQuotes.length,
      },
    });

  } catch (error: any) {
    console.error('[API] Insight agent error:', error);
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
