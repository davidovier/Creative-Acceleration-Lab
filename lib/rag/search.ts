/**
 * RAG Search Helper
 * Semantic search using pgvector and OpenAI embeddings
 */

import { embedText } from './embed';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when actually needed (not at build time)
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export interface SearchResult {
  id: number;
  sourceFile: string;
  sectionTitle: string | null;
  content: string;
  tags: string[];
  similarity: number;
  charCount: number;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  k?: number;
  similarityThreshold?: number;
  filterTags?: string[];
}

/**
 * Search knowledge base using semantic similarity
 * @param query - User query text
 * @param options - Search options (k, threshold, tags)
 * @returns Array of matching chunks with similarity scores
 */
export async function searchKB(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    k = 8,
    similarityThreshold = 0.5,
    filterTags = null,
  } = options;

  try {
    // Step 1: Generate embedding for query
    const { embedding } = await embedText(query);

    // Step 2: Call search_kb RPC function
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('search_kb', {
      query_embedding: embedding,
      match_threshold: similarityThreshold,
      match_count: k,
      filter_tags: filterTags,
    });

    if (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Step 3: Transform results to SearchResult format
    const results: SearchResult[] = data.map((row: any) => ({
      id: row.id,
      sourceFile: row.source_file,
      sectionTitle: row.section_title,
      content: row.content,
      tags: row.tags || [],
      similarity: row.similarity,
      charCount: row.char_count,
      metadata: row.metadata || {},
    }));

    return results;

  } catch (error: any) {
    console.error('searchKB error:', error);
    throw error;
  }
}

/**
 * Search KB and format results for agent context
 * @param query - User query text
 * @param k - Number of results to return
 * @returns Formatted context string
 */
export async function searchKBForContext(
  query: string,
  k: number = 5
): Promise<string> {
  const results = await searchKB(query, { k });

  if (results.length === 0) {
    return 'No relevant context found.';
  }

  // Format as context for agents
  const contextParts = results.map((result, index) => {
    const source = result.sectionTitle
      ? `${result.sourceFile} - ${result.sectionTitle}`
      : result.sourceFile;

    return `[${index + 1}] Source: ${source}\n${result.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Get KB statistics
 * @returns Chunk count and other stats
 */
export async function getKBStats(): Promise<{
  totalChunks: number;
  topSources: string[];
  avgChunkSize: number;
}> {
  try {
    const supabase = getSupabaseClient();

    // Total chunks
    const { count: totalChunks } = await supabase
      .from('kb_chunks')
      .select('*', { count: 'exact', head: true });

    // Top sources
    const { data: sourceData } = await supabase
      .from('kb_chunks')
      .select('source_file')
      .limit(1000);

    const sourceCounts: Record<string, number> = {};
    sourceData?.forEach(row => {
      const folder = row.source_file.split('/')[0];
      sourceCounts[folder] = (sourceCounts[folder] || 0) + 1;
    });

    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([folder]) => folder);

    // Average chunk size
    const { data: sizeData } = await supabase
      .from('kb_chunks')
      .select('char_count')
      .limit(1000);

    const avgChunkSize = sizeData && sizeData.length > 0
      ? Math.round(sizeData.reduce((sum, row) => sum + (row.char_count || 0), 0) / sizeData.length)
      : 0;

    return {
      totalChunks: totalChunks || 0,
      topSources,
      avgChunkSize,
    };

  } catch (error: any) {
    console.error('getKBStats error:', error);
    return {
      totalChunks: 0,
      topSources: [],
      avgChunkSize: 0,
    };
  }
}
