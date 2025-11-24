/**
 * RAG Search Helper
 * Semantic search using pgvector and OpenAI embeddings
 * Enhanced with per-agent search profiles for better grounding
 */

import { embedText } from './embed';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENABLE_AGENT_DEBUG_LOGS } from '@/lib/agents/config';

// Lazy initialization - only create client when actually needed (not at build time)
let supabaseClient: SupabaseClient | null = null;

// In-memory RAG cache for speed optimization (Prompt 6)
// Keyed by composite query string, stores search results
// Cache lifetime: per-request only (cleared on server restart)
const ragCache = new Map<string, SearchResult[]>();

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

// ============================================================================
// AGENT-AWARE RAG SEARCH (PROMPT 6)
// ============================================================================

export type AgentName = 'insight' | 'story' | 'prototype' | 'symbol';

export interface RagQueryOptions {
  agent: AgentName;
  userText: string;
  extraHints?: string[];
  k?: number;
  threshold?: number;
}

/**
 * Per-agent search profiles
 * Each agent gets optimized query hints and parameters for better KB grounding
 */
interface AgentSearchProfile {
  defaultK: number;
  defaultThreshold: number;
  queryHints: string[];
  preferredSources?: string[]; // Optional source_file prefixes to prioritize
}

const AGENT_SEARCH_PROFILES: Record<AgentName, AgentSearchProfile> = {
  insight: {
    defaultK: 7,
    defaultThreshold: 0.55,
    queryHints: [
      'emotional diagnostics',
      'archetypes',
      'identity',
      'creative tension',
      'founder psychology',
      'psychological patterns',
      'inner conflicts',
    ],
    preferredSources: ['Frameworks', 'Human_Story_Engine'],
  },
  story: {
    defaultK: 6,
    defaultThreshold: 0.55,
    queryHints: [
      'Human Story Engine',
      'narrative framework',
      'myth structure',
      'archetypal story',
      'hero journey',
      'transformation arc',
      'symbolic narrative',
    ],
    preferredSources: ['Human_Story_Engine', 'Frameworks'],
  },
  prototype: {
    defaultK: 8,
    defaultThreshold: 0.50,
    queryHints: [
      '5-Day Prototype Ritual',
      'Creative Acceleration',
      'Speed Studio',
      'anti-bureaucracy',
      'experiments',
      'rituals',
      'rapid prototyping',
      'hands-on creation',
      'expressive experiments',
    ],
    preferredSources: ['Frameworks', 'Speed_Studio', '5_Day_Prototype'],
  },
  symbol: {
    defaultK: 7,
    defaultThreshold: 0.55,
    queryHints: [
      'symbolic mapping',
      'symbol dictionary',
      'color psychology',
      'geometry',
      'metaphor',
      'visual language',
      'archetypal imagery',
      'design symbolism',
    ],
    preferredSources: ['Frameworks', 'Symbol_Systems'],
  },
};

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
 * Agent-aware knowledge base search
 * Uses per-agent profiles for optimized query construction and parameters
 * Includes in-memory caching for speed optimization
 *
 * @param options - Agent name, user text, optional hints and overrides
 * @returns Array of matching chunks with similarity scores
 */
export async function searchKbForAgent(
  options: RagQueryOptions
): Promise<SearchResult[]> {
  const { agent, userText, extraHints = [], k, threshold } = options;

  // Get agent profile
  const profile = AGENT_SEARCH_PROFILES[agent];
  if (!profile) {
    throw new Error(`Unknown agent: ${agent}`);
  }

  // Build composite query string
  // Combine: cleaned user text + agent hints + extra hints
  const cleanedUserText = userText.trim().slice(0, 300); // Use first 300 chars to avoid token limits
  const allHints = [...profile.queryHints, ...extraHints];
  const hintsString = allHints.join(' ');

  const compositeQuery = `${hintsString} ${cleanedUserText}`;

  // Use profile defaults or overrides
  const finalK = k ?? profile.defaultK;
  const finalThreshold = threshold ?? profile.defaultThreshold;

  // Generate cache key: agent + query + params
  const cacheKey = `${agent}:${compositeQuery}:${finalK}:${finalThreshold}`;

  // Check cache first
  if (ragCache.has(cacheKey)) {
    if (ENABLE_AGENT_DEBUG_LOGS) {
      console.log(`\n🔍 [RAG] ${agent.toUpperCase()} Agent Search (CACHED)`);
      console.log(`   Cache hit for query`);
    }
    return ragCache.get(cacheKey)!;
  }

  // Debug logging
  if (ENABLE_AGENT_DEBUG_LOGS) {
    console.log(`\n🔍 [RAG] ${agent.toUpperCase()} Agent Search`);
    console.log(`   Query length: ${compositeQuery.length} chars`);
    console.log(`   Parameters: k=${finalK}, threshold=${finalThreshold}`);
    console.log(`   Hints: ${profile.queryHints.slice(0, 3).join(', ')}...`);
  }

  // Execute search
  const results = await searchKB(compositeQuery, {
    k: finalK,
    similarityThreshold: finalThreshold,
  });

  // Store in cache
  ragCache.set(cacheKey, results);

  // Debug: show what we found
  if (ENABLE_AGENT_DEBUG_LOGS && results.length > 0) {
    console.log(`   ✓ Found ${results.length} chunks`);
    const topSources = results
      .slice(0, 3)
      .map(r => {
        const source = r.sectionTitle ? `${r.sourceFile}/${r.sectionTitle}` : r.sourceFile;
        return `${source} (${r.similarity.toFixed(2)})`;
      });
    console.log(`   Top sources:\n     • ${topSources.join('\n     • ')}`);
  } else if (ENABLE_AGENT_DEBUG_LOGS) {
    console.log(`   ⚠️  No chunks found above threshold`);
  }

  return results;
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
 * Format search results for agent prompts
 * @param results - Search results from searchKbForAgent
 * @returns Formatted context string
 */
export function formatSearchResultsForPrompt(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant KB context found.';
  }

  const contextParts = results.map((result, index) => {
    const source = result.sectionTitle
      ? `${result.sourceFile} - ${result.sectionTitle}`
      : result.sourceFile;

    return `[${index + 1}] Source: ${source}\n${result.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Clear RAG cache
 * Useful for testing or when KB content changes
 */
export function clearRagCache(): void {
  ragCache.clear();
  if (ENABLE_AGENT_DEBUG_LOGS) {
    console.log('[RAG Cache] Cleared');
  }
}

/**
 * Get RAG cache statistics
 * @returns Cache size and hit rate info
 */
export function getRagCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: ragCache.size,
    keys: Array.from(ragCache.keys()).map(k => k.split(':')[0]), // Just show agent names
  };
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
