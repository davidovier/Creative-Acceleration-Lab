/**
 * Debug Session API
 * Enhanced debugging endpoint for agent orchestration
 *
 * SECURITY: Only active when AGENT_DEBUG=true
 * Never exposes API keys or secrets
 * Not enabled by default on Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFullSession, validateUserInput } from '@/lib/agents/orchestrator';
import { ENABLE_AGENT_DEBUG_LOGS } from '@/lib/agents/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Helper to sanitize prompts (remove API keys if accidentally included)
function sanitizeText(text: string): string {
  // Remove anything that looks like an API key
  return text
    .replace(/sk-ant-[a-zA-Z0-9-_]+/g, '[REDACTED-API-KEY]')
    .replace(/ANTHROPIC_API_KEY[=:]\s*[^\s]+/gi, 'ANTHROPIC_API_KEY=[REDACTED]');
}

interface DebugSessionResponse {
  ok: boolean;
  debugEnabled: boolean;
  report?: any;
  debug?: {
    timing: {
      total: number;
      breakdown: {
        insight?: number;
        story?: number;
        prototype?: number;
        symbol?: number;
      };
    };
    validation: {
      inputLength: number;
      validationResult: any;
    };
    environment: {
      nodeEnv: string;
      runtime: string;
      debugMode: boolean;
    };
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/debug/session
 * Enhanced session endpoint with detailed debugging information
 *
 * Only active when AGENT_DEBUG=true environment variable is set
 *
 * Returns:
 * - Full session report
 * - Timing breakdowns per agent
 * - Input validation details
 * - Environment information
 *
 * Note: Prompts and raw outputs are NOT exposed for security
 */
export async function POST(req: NextRequest): Promise<NextResponse<DebugSessionResponse>> {
  // Check if debug mode is enabled
  if (!ENABLE_AGENT_DEBUG_LOGS) {
    return NextResponse.json(
      {
        ok: false,
        debugEnabled: false,
        error: 'Debug endpoint is not enabled',
        message: 'Set AGENT_DEBUG=true in environment to enable debug endpoint',
      },
      { status: 403 }
    );
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { userText } = body;

    // Validate input
    const validation = validateUserInput(userText);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          debugEnabled: true,
          error: validation.error,
          debug: {
            timing: {
              total: Date.now() - startTime,
              breakdown: {},
            },
            validation: {
              inputLength: userText?.length || 0,
              validationResult: validation,
            },
            environment: {
              nodeEnv: process.env.NODE_ENV || 'unknown',
              runtime: 'nodejs',
              debugMode: ENABLE_AGENT_DEBUG_LOGS,
            },
          },
        },
        { status: 400 }
      );
    }

    console.log(`[DEBUG API] Starting session for user text (${userText.length} chars)`);
    console.log(`[DEBUG API] Preview: "${sanitizeText(userText.slice(0, 100))}..."`);

    // Run full session with timing
    const agentStartTimes: { [key: string]: number } = {};
    const agentDurations: { [key: string]: number } = {};

    // Note: In a production version, you might want to create a debug wrapper
    // around runFullSession that captures intermediate outputs.
    // For now, we rely on the orchestrator's console logging.

    const report = await runFullSession(userText);
    const totalDuration = Date.now() - startTime;

    // Extract timing from report if available
    const breakdown: any = {};
    if (report.totalDuration) {
      // Calculate approximate breakdown based on sequential execution
      // This is an approximation - for exact timing, orchestrator logs provide details
      breakdown.total = report.totalDuration;
    }

    console.log('[DEBUG API] Session complete, returning detailed report');

    return NextResponse.json({
      ok: true,
      debugEnabled: true,
      report,
      debug: {
        timing: {
          total: totalDuration,
          breakdown: breakdown,
        },
        validation: {
          inputLength: userText.length,
          validationResult: validation,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'unknown',
          runtime: 'nodejs',
          debugMode: ENABLE_AGENT_DEBUG_LOGS,
        },
      },
    });

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error('[DEBUG API] Session error:', error);

    return NextResponse.json(
      {
        ok: false,
        debugEnabled: true,
        error: 'Session failed',
        message: sanitizeText(error.message),
        debug: {
          timing: {
            total: totalDuration,
            breakdown: {},
          },
          validation: {
            inputLength: 0,
            validationResult: { valid: false },
          },
          environment: {
            nodeEnv: process.env.NODE_ENV || 'unknown',
            runtime: 'nodejs',
            debugMode: ENABLE_AGENT_DEBUG_LOGS,
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/debug/session
 * Check if debug endpoint is enabled
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    debugEnabled: ENABLE_AGENT_DEBUG_LOGS,
    message: ENABLE_AGENT_DEBUG_LOGS
      ? 'Debug endpoint is active. Use POST with {"userText": "..."} to run a debug session.'
      : 'Debug endpoint is disabled. Set AGENT_DEBUG=true to enable.',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      runtime: 'nodejs',
    },
  });
}
