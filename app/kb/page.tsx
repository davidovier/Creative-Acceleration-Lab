'use client';

/**
 * KB Diagnostic Page
 * Visual testing interface for RAG search
 */

import { useState, useEffect } from 'react';

interface KBStats {
  count: number;
  topSources: string[];
  avgChunkSize: number;
}

interface SearchResult {
  id: number;
  sourceFile: string;
  sectionTitle: string | null;
  content: string;
  tags: string[];
  similarity: number;
  charCount: number;
}

export default function KBDiagnosticPage() {
  const [stats, setStats] = useState<KBStats | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/kb/stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/kb/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: 8 }),
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResults(data.results || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            KB Diagnostic Dashboard
          </h1>
          <p className="text-gray-600">
            Test semantic search and view knowledge base statistics
          </p>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Knowledge Base Stats</h2>
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Total Chunks
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.count.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">
                  Avg Chunk Size
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {stats.avgChunkSize} chars
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">
                  Top Sources
                </div>
                <div className="text-sm text-purple-900 mt-2">
                  {stats.topSources.slice(0, 3).map((source, i) => (
                    <div key={i} className="truncate">
                      {i + 1}. {source}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading stats...</div>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Semantic Search</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., archetypes, creative frameworks, brand identity..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Run Search'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Search Results ({results.length})
            </h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-600">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          {result.sourceFile}
                        </span>
                      </div>
                      {result.sectionTitle && (
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.sectionTitle}
                        </h3>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {(result.similarity * 100).toFixed(1)}% match
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.charCount} chars
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.content.length > 500
                        ? result.content.substring(0, 500) + '...'
                        : result.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && query && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            No results found. Try a different query.
          </div>
        )}
      </div>
    </div>
  );
}
