'use client';

/**
 * Session Page
 * Main interface for generating multi-agent session reports
 */

import { useState } from 'react';

interface SessionResult {
  status: string;
  message?: string;
  results?: any[];
  error?: string;
}

export default function SessionPage() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSession = async () => {
    if (!userInput.trim()) {
      setError('Please enter your creative challenge or question');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: userInput }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Creative Acceleration Session
          </h1>
          <p className="text-xl text-gray-600">
            Multi-agent RAG system for creative innovation
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by Claude AI + Knowledge Base
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Your Creative Challenge
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Describe your creative project, brand challenge, or innovation question.
            Our AI agents will analyze it through multiple lenses: insight, story, prototype, and symbol.
          </p>

          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Example: I'm building a sustainable fashion brand targeting Gen Z. Help me develop a brand identity that resonates with their values while standing out in a crowded market..."
            className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-800"
            maxLength={2000}
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-500">
              {userInput.length} / 2000 characters
            </span>
            <button
              onClick={handleGenerateSession}
              disabled={loading || !userInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Report...
                </span>
              ) : (
                'Generate Session Report'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Session Report
            </h2>

            {result.status === 'session endpoint not implemented yet' ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Session Endpoint In Development
                    </h3>
                    <p className="text-yellow-800">
                      The multi-agent session endpoint is currently being implemented.
                      This will be available in Prompt 4 with full agent orchestration.
                    </p>
                    <div className="mt-4 text-sm text-yellow-700">
                      <strong>Coming soon:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Insight Agent (archetypes & emotion)</li>
                        <li>Story Architect (narrative & myth)</li>
                        <li>Prototype Engineer (5-day sprint plan)</li>
                        <li>Symbol Weaver (visual symbols & design)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="bg-gray-50 rounded-xl p-6 overflow-auto text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Info Section */}
        {!result && !loading && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">
                  🔍 1. Insight Agent
                </h4>
                <p className="text-sm">
                  Analyzes your challenge through archetypal patterns, emotional drivers, and psychological frameworks.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  📖 2. Story Architect
                </h4>
                <p className="text-sm">
                  Crafts narrative structures, mythological patterns, and compelling story angles for your brand.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">
                  ⚙️ 3. Prototype Engineer
                </h4>
                <p className="text-sm">
                  Designs a practical 5-day sprint plan with concrete prototyping steps and validation methods.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-pink-900 mb-2">
                  ✨ 4. Symbol Weaver
                </h4>
                <p className="text-sm">
                  Generates visual symbols, color palettes, and design elements that embody your brand essence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
