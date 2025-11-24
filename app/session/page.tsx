'use client';

/**
 * Session Page
 * Main interface for generating multi-agent session reports
 */

import { useState } from 'react';

interface InsightOutput {
  emotional_summary: string;
  core_wound: string;
  core_desire: string;
  archetype_guess: string;
  supporting_quotes: string[];
}

interface StoryOutput {
  hero_description: string;
  villain_description: string;
  current_chapter: string;
  desired_chapter: string;
  story_paragraph: string;
}

interface PrototypeOutput {
  goal: string;
  constraints: string[];
  day_by_day_plan: {
    day: number;
    focus: string;
    tasks: string[];
  }[];
  potential_ai_features: string[];
  risks: string[];
}

interface SymbolOutput {
  primary_symbol: string;
  secondary_symbols: string[];
  conceptual_motifs: string[];
  ui_motifs: string[];
  color_palette_suggestions: string[];
}

interface SessionReport {
  userText: string;
  timestamp: string;
  insight: InsightOutput;
  story: StoryOutput;
  prototype: PrototypeOutput;
  symbol: SymbolOutput;
  totalDuration?: number;
  consistency?: {
    score: number;
    notes: string[];
  };
}

interface SessionResult {
  ok: boolean;
  report?: SessionReport;
  error?: string;
  message?: string;
}

export default function SessionPage() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

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
        body: JSON.stringify({ userText: userInput }),
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
        {result && result.ok && result.report && (
          <div className="space-y-8">
            {/* Insight Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Emotional Insight</h2>
                  <p className="text-sm text-gray-500">Archetype: {result.report.insight.archetype_guess}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Emotional Summary</h3>
                  <p className="text-gray-700">{result.report.insight.emotional_summary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 rounded-xl p-4">
                    <h4 className="font-semibold text-red-900 mb-2">Core Wound</h4>
                    <p className="text-red-800 text-sm">{result.report.insight.core_wound}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Core Desire</h4>
                    <p className="text-green-800 text-sm">{result.report.insight.core_desire}</p>
                  </div>
                </div>

                {result.report.insight.supporting_quotes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Supporting Wisdom from Knowledge Base</h4>
                    <div className="space-y-2">
                      {result.report.insight.supporting_quotes.map((quote, i) => (
                        <div key={i} className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 rounded-r-lg">
                          <p className="text-sm text-gray-700 italic">{quote}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  📖
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Your Story Arc</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <p className="text-gray-800 leading-relaxed">{result.report.story.story_paragraph}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">The Hero (You)</h4>
                    <p className="text-gray-700 text-sm">{result.report.story.hero_description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">The Villain (Challenge)</h4>
                    <p className="text-gray-700 text-sm">{result.report.story.villain_description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Current Chapter</h4>
                    <p className="text-gray-700 text-sm">{result.report.story.current_chapter}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Desired Chapter</h4>
                    <p className="text-gray-700 text-sm">{result.report.story.desired_chapter}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prototype Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  ⚙️
                </div>
                <h2 className="text-3xl font-bold text-gray-900">5-Day Prototype Plan</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Sprint Goal</h4>
                  <p className="text-gray-800">{result.report.prototype.goal}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Constraints (Focus Points)</h4>
                  <ul className="space-y-2">
                    {result.report.prototype.constraints.map((constraint, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">▸</span>
                        <span className="text-gray-700 text-sm">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Day-by-Day Plan</h4>
                  <div className="space-y-4">
                    {result.report.prototype.day_by_day_plan.map((day) => (
                      <div key={day.day} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">
                            {day.day}
                          </div>
                          <h5 className="font-semibold text-gray-900">{day.focus}</h5>
                        </div>
                        <ul className="space-y-1 ml-13">
                          {day.tasks.map((task, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Potential AI Features</h4>
                    <ul className="space-y-2">
                      {result.report.prototype.potential_ai_features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500">◆</span>
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Risks & Mitigation</h4>
                    <ul className="space-y-2">
                      {result.report.prototype.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500">⚠</span>
                          <span className="text-gray-700 text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Symbol Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                  ✨
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Symbols & Visuals</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                  <h4 className="font-semibold text-pink-900 mb-3">Primary Symbol</h4>
                  <p className="text-gray-800">{result.report.symbol.primary_symbol}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Secondary Symbols</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {result.report.symbol.secondary_symbols.map((symbol, i) => (
                      <div key={i} className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                        {symbol}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Conceptual Motifs</h4>
                  <div className="space-y-2">
                    {result.report.symbol.conceptual_motifs.map((concept, i) => (
                      <div key={i} className="border-l-4 border-pink-400 pl-4 py-2 bg-pink-50 rounded-r-lg">
                        <p className="text-sm text-gray-700">{concept}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">UI Design Motifs</h4>
                  <ul className="space-y-2">
                    {result.report.symbol.ui_motifs.map((motif, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500">▸</span>
                        <span className="text-gray-700 text-sm">{motif}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Color Palette</h4>
                  <div className="space-y-2">
                    {result.report.symbol.color_palette_suggestions.map((color, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300"
                          style={{
                            backgroundColor: color.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#cccccc'
                          }}
                        />
                        <p className="text-sm text-gray-700 flex-1">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Consistency Score (Prompt 6) */}
            {result.report.consistency && (
              <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      🎯 Coherence Score
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Cross-agent thematic alignment</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${
                      result.report.consistency.score >= 90 ? 'text-green-600' :
                      result.report.consistency.score >= 75 ? 'text-blue-600' :
                      result.report.consistency.score >= 60 ? 'text-yellow-600' :
                      result.report.consistency.score >= 40 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {result.report.consistency.score}
                    </div>
                    <div className="text-sm text-gray-500">out of 100</div>
                    <div className={`text-xs font-semibold mt-1 ${
                      result.report.consistency.score >= 90 ? 'text-green-700' :
                      result.report.consistency.score >= 75 ? 'text-blue-700' :
                      result.report.consistency.score >= 60 ? 'text-yellow-700' :
                      result.report.consistency.score >= 40 ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {result.report.consistency.score >= 90 ? 'Excellent' :
                       result.report.consistency.score >= 75 ? 'Good' :
                       result.report.consistency.score >= 60 ? 'Fair' :
                       result.report.consistency.score >= 40 ? 'Weak' : 'Poor'}
                    </div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                    View detailed consistency checks ({result.report.consistency.notes.filter(n => n.startsWith('✓')).length}/{result.report.consistency.notes.length} passed)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {result.report.consistency.notes.map((note, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 text-sm p-2 rounded ${
                          note.startsWith('✓') ? 'bg-green-50 text-green-800' :
                          note.startsWith('~') ? 'bg-yellow-50 text-yellow-800' :
                          'bg-red-50 text-red-800'
                        }`}
                      >
                        <span className="font-mono">{note.charAt(0)}</span>
                        <span>{note.slice(2)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Session Meta */}
            {result.report.totalDuration && (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-600">
                Session completed in {(result.report.totalDuration / 1000).toFixed(2)}s
              </div>
            )}

            {/* Debug: Show Raw JSON */}
            <div className="bg-white rounded-xl shadow p-4">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                {showRawJson ? '▼ Hide Raw JSON' : '▶ Show Raw JSON (Debug)'}
              </button>
              {showRawJson && (
                <pre className="mt-4 bg-gray-50 rounded-lg p-4 overflow-auto text-xs whitespace-pre-wrap border border-gray-200">
                  {JSON.stringify(result.report, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {result && !result.ok && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Session Failed</h3>
            <p className="text-red-700">{result.error || result.message}</p>
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
