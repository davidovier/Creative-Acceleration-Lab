/**
 * KB Statistics API
 * Returns statistics about the knowledge base
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKBStats } from '@/lib/rag/search';

export const runtime = 'nodejs';

/**
 * GET /api/kb/stats
 * Returns KB statistics (total chunks, top sources, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const stats = await getKBStats();

    return NextResponse.json({
      count: stats.totalChunks,
      topSources: stats.topSources,
      avgChunkSize: stats.avgChunkSize,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('KB stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch KB statistics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
