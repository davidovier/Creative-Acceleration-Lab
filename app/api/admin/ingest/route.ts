/**
 * Admin Ingestion Endpoint
 * Triggers KB ingestion from API (for CI/CD)
 * Protected by ADMIN_INGEST_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * POST /api/admin/ingest
 * Triggers KB ingestion (server-side only)
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_INGEST_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'ADMIN_INGEST_SECRET not configured' },
        { status: 500 }
      );
    }

    if (adminSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin secret' },
        { status: 401 }
      );
    }

    // Only allow on server-side (not in browser)
    if (typeof window !== 'undefined') {
      return NextResponse.json(
        { error: 'Ingestion must run server-side' },
        { status: 400 }
      );
    }

    // Import ingestion function (dynamic to avoid bundling in client)
    const { ingestKB } = await import('@/scripts/ingest_kb.js');

    const startTime = Date.now();

    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      logs.push('ERROR: ' + args.join(' '));
      originalError(...args);
    };

    try {
      // Run ingestion
      await ingestKB();

      // Restore console
      console.log = originalLog;
      console.error = originalError;

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Parse logs for summary
      const summary = parseLogs(logs);

      return NextResponse.json({
        status: 'success',
        message: 'KB ingestion completed successfully',
        ...summary,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
        logs: logs.slice(-50), // Last 50 log lines
      });

    } catch (error: any) {
      // Restore console
      console.log = originalLog;
      console.error = originalError;

      return NextResponse.json({
        status: 'error',
        error: error.message,
        logs: logs.slice(-50),
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * Parse logs to extract summary statistics
 */
function parseLogs(logs: string[]): Record<string, any> {
  const summary: Record<string, any> = {
    filesScanned: 0,
    chunksCreated: 0,
    chunksInserted: 0,
    chunksSkipped: 0,
    errors: 0,
    cost: '$0.00',
  };

  for (const log of logs) {
    // Extract files scanned
    const filesMatch = log.match(/Files scanned:\s+(\d+)/);
    if (filesMatch) summary.filesScanned = parseInt(filesMatch[1]);

    // Extract chunks created
    const chunksMatch = log.match(/Chunks created:\s+(\d+)/);
    if (chunksMatch) summary.chunksCreated = parseInt(chunksMatch[1]);

    // Extract chunks inserted
    const insertedMatch = log.match(/Chunks inserted:\s+(\d+)/);
    if (insertedMatch) summary.chunksInserted = parseInt(insertedMatch[1]);

    // Extract chunks skipped
    const skippedMatch = log.match(/Chunks skipped:\s+(\d+)/);
    if (skippedMatch) summary.chunksSkipped = parseInt(skippedMatch[1]);

    // Extract errors
    const errorsMatch = log.match(/Errors:\s+(\d+)/);
    if (errorsMatch) summary.errors = parseInt(errorsMatch[1]);

    // Extract total cost
    const costMatch = log.match(/Total embeddings:.*?\$([0-9.]+)/);
    if (costMatch) summary.cost = `$${costMatch[1]}`;
  }

  return summary;
}

/**
 * GET /api/admin/ingest
 * Returns status (for health checks)
 */
export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_INGEST_SECRET;

  if (adminSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Ingestion endpoint is available',
    method: 'POST',
    headers: {
      'x-admin-secret': 'required',
    },
  });
}
