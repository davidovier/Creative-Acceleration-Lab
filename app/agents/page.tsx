'use client';

/**
 * Agent Playground
 * Debug and test individual agents
 */

import { useState } from 'react';

type AgentType = 'insight' | 'story' | 'prototype' | 'symbol';

export default function AgentPlaygroundPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('insight');
  const [userText, setUserText] = useState('');
  const [insightJson, setInsightJson] = useState('');
  const [storyJson, setStoryJson] = useState('');
  const [prototypeJson, setPrototypeJson] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAgent = async () => {
    if (!userText.trim()) {
      setError('Please enter user text');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let body: any = { userText };

      // Add previous agent outputs based on selected agent
      if (selectedAgent !== 'insight') {
        if (!insightJson.trim()) {
          setError('Insight JSON is required for this agent');
          setLoading(false);
          return;
        }
        body.insight = JSON.parse(insightJson);
      }

      if (selectedAgent === 'prototype' || selectedAgent === 'symbol') {
        if (!storyJson.trim()) {
          setError('Story JSON is required for this agent');
          setLoading(false);
          return;
        }
        body.story = JSON.parse(storyJson);
      }

      if (selectedAgent === 'symbol') {
        if (!prototypeJson.trim()) {
          setError('Prototype JSON is required for this agent');
          setLoading(false);
          return;
        }
        body.prototype = JSON.parse(prototypeJson);
      }

      const res = await fetch(`/api/agents/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || 'Agent failed');
      }

      setResult(data.result);

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
            Agent Playground
          </h1>
          <p className="text-gray-600">
            Test and debug individual agents
          </p>
        </div>

        {/* Agent Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Agent
          </label>
          <div className="grid grid-cols-4 gap-4">
            {[
              { value: 'insight', label: '🔍 Insight', desc: 'Emotional analysis' },
              { value: 'story', label: '📖 Story', desc: 'Narrative structure' },
              { value: 'prototype', label: '⚙️ Prototype', desc: '5-day plan' },
              { value: 'symbol', label: '✨ Symbol', desc: 'Visual design' },
            ].map((agent) => (
              <button
                key={agent.value}
                onClick={() => setSelectedAgent(agent.value as AgentType)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedAgent === agent.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-lg font-semibold">{agent.label}</div>
                <div className="text-xs text-gray-500">{agent.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User Text
              </label>
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Enter creative challenge..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {userText.length} / 2000 characters
              </div>
            </div>

            {/* Insight JSON (for Story, Prototype, Symbol) */}
            {selectedAgent !== 'insight' && (
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insight JSON
                </label>
                <textarea
                  value={insightJson}
                  onChange={(e) => setInsightJson(e.target.value)}
                  placeholder='{"emotional_summary": "...", ...}'
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                />
              </div>
            )}

            {/* Story JSON (for Prototype, Symbol) */}
            {(selectedAgent === 'prototype' || selectedAgent === 'symbol') && (
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Story JSON
                </label>
                <textarea
                  value={storyJson}
                  onChange={(e) => setStoryJson(e.target.value)}
                  placeholder='{"hero_description": "...", ...}'
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                />
              </div>
            )}

            {/* Prototype JSON (for Symbol) */}
            {selectedAgent === 'symbol' && (
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prototype JSON
                </label>
                <textarea
                  value={prototypeJson}
                  onChange={(e) => setPrototypeJson(e.target.value)}
                  placeholder='{"goal": "...", ...}'
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                />
              </div>
            )}

            <button
              onClick={runAgent}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Running Agent...' : `Run ${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Agent`}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agent Output
            </h3>
            {result ? (
              <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-xs whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-400 text-center py-12">
                Run an agent to see output
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Tip:</strong> Copy output from one agent and paste as input for the next agent to chain them manually
        </div>
      </div>
    </div>
  );
}
