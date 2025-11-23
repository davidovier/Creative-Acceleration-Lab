/**
 * KB Search API
 * Semantic search endpoint for knowledge base
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchKB } from '@/lib/rag/search';

export const runtime = 'nodejs';

/**
 * POST /api/kb/search
 * Search knowledge base with semantic similarity
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, k = 8, similarityThreshold = 0.5, filterTags = null } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const results = await searchKB(query, {
      k,
      similarityThreshold,
      filterTags,
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('KB search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
