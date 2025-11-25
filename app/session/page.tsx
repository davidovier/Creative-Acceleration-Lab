'use client';

/**
 * Creative OS Session Interface (Prompt 8)
 * Immersive 3-panel dashboard with animations and symbolic motifs
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowMeter from '@/components/FlowMeter';
import { emotionalColors, getConsistencyColor, getDominantColor } from '@/theme/colors';
import { agentSymbols } from '@/theme/symbols';
import {
  fadeIn,
  slideUp,
  staggerContainer,
  staggerItem,
  agentEntrance,
  colorSwatchReveal,
} from '@/theme/motion';

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

interface ColorEmotion {
  color: string;
  meaning: string;
}

interface SymbolOutput {
  primary_symbol: string;
  secondary_symbols: string[];
  conceptual_motifs: string[];
  ui_motifs: string[];
  color_palette_suggestions: ColorEmotion[];
}

interface SSICSummary {
  resistance: string;
  momentum: string;
  charge: number;
  velocity: number;
  inertia: number;
  flowPotential: number;
  resistanceZones: string[];
  breakthroughPoints: string[];
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
  preprocessing?: {
    extractedQuotes: string[];
    pronoun: string;
    keywords: string[];
  };
  ssic?: SSICSummary;
}

interface SessionResult {
  ok: boolean;
  report?: SessionReport;
  error?: string;
  message?: string;
}

export default function CreativeOSSession() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  const handleGenerateSession = async () => {
    if (!userInput.trim()) {
      setError('Please enter your creative challenge');
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

  const handleExport = async () => {
    if (!result?.report) return;

    try {
      const res = await fetch('/api/session/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: result.report }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creative-session-${Date.now()}.md`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const navigateToRitual = () => {
    if (!result?.report) return;
    const encoded = encodeURIComponent(JSON.stringify(result.report));
    window.location.href = `/ritual?data=${encoded}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <motion.header
        className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✨
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creative OS</h1>
              <p className="text-xs text-gray-500">Multi-Agent Intelligence System</p>
            </div>
          </div>

          {result?.report && (
            <div className="flex gap-2">
              <button
                onClick={navigateToRitual}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
              >
                🕯️ Ritual Mode
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md"
              >
                📥 Export
              </button>
            </div>
          )}
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Input Section */}
        {!result && (
          <motion.div
            className="max-w-2xl mx-auto"
            variants={slideUp}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Your Creative Challenge
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Describe your project, challenge, or creative question. Our agents will analyze it through
                emotional, narrative, prototype, and symbolic lenses.
              </p>

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Example: I'm building a meditation app for urban professionals struggling with burnout..."
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-800"
                maxLength={2000}
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">{userInput.length} / 2000</span>
                <button
                  onClick={handleGenerateSession}
                  disabled={loading || !userInput.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Generating...
                    </span>
                  ) : (
                    'Generate Session'
                  )}
                </button>
              </div>

              {error && (
                <motion.div
                  className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong>Error:</strong> {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3-Panel Creative OS Interface */}
        {result?.report && (
          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* LEFT PANEL: Creative Energy */}
              <motion.div className="lg:col-span-3 space-y-6" variants={staggerItem}>
                <CreativeEnergyPanel report={result.report} />
              </motion.div>

              {/* CENTER PANEL: Session Canvas */}
              <motion.div className="lg:col-span-6 space-y-6" variants={staggerItem}>
                <SessionCanvas report={result.report} />
              </motion.div>

              {/* RIGHT PANEL: Insight Stream */}
              <motion.div className="lg:col-span-3 space-y-6" variants={staggerItem}>
                <InsightStream report={result.report} showRawJson={showRawJson} setShowRawJson={setShowRawJson} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LEFT PANEL: Creative Energy
// ============================================================================

function CreativeEnergyPanel({ report }: { report: SessionReport }) {
  const keywords = report.preprocessing?.keywords || [];
  const velocity = Math.min(100, keywords.length * 12.5);
  const resistance = Math.min(100, report.insight.core_wound.length / 2);
  const clarity = Math.min(100, report.insight.core_desire.length / 2);
  const dominantColor = getDominantColor(report.symbol.color_palette_suggestions);

  return (
    <div className="space-y-6">
      {/* Coherence Ring */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100"
        variants={slideUp}
      >
        <div className="text-center">
          <div className="relative inline-block">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={getConsistencyColor(report.consistency?.score || 0)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (report.consistency?.score || 0) / 100)}`}
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (report.consistency?.score || 0) / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <div className="text-3xl font-bold text-gray-900">{report.consistency?.score || 0}</div>
                <div className="text-xs text-gray-500">coherence</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-sm font-semibold text-gray-700">{report.insight.archetype_guess}</div>
          <div className="text-xs text-gray-500 mt-1">{report.insight.emotional_summary.slice(0, 60)}...</div>
        </div>
      </motion.div>

      {/* Flow Meter */}
      <motion.div variants={slideUp}>
        <FlowMeter
          velocity={velocity}
          resistance={resistance}
          clarity={clarity}
          dominantColor={dominantColor}
        />
      </motion.div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100"
          variants={slideUp}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Shared Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <motion.span
                key={i}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -3, 0],
                }}
                transition={{
                  opacity: { delay: i * 0.1 },
                  scale: { delay: i * 0.1 },
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }
                }}
              >
                {kw}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Color Palette */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-100"
        variants={slideUp}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Emotional Colors</h3>
        <div className="space-y-2">
          {report.symbol.color_palette_suggestions.map((ce, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              custom={i}
              variants={colorSwatchReveal}
            >
              <motion.div
                className="w-10 h-10 rounded-lg shadow-md flex-shrink-0"
                style={{ backgroundColor: ce.color }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-500">{ce.color}</p>
                <p className="text-xs text-gray-700 truncate italic">{ce.meaning}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// CENTER PANEL: Session Canvas
// ============================================================================

function SessionCanvas({ report }: { report: SessionReport }) {
  return (
    <div className="space-y-6">
      <AgentCard
        agent="insight"
        index={0}
        title="Emotional Insight"
        subtitle={report.insight.archetype_guess}
      >
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">{report.insight.emotional_summary}</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h4 className="text-sm font-semibold text-red-900 mb-2">Core Wound</h4>
              <p className="text-sm text-red-800">{report.insight.core_wound}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Core Desire</h4>
              <p className="text-sm text-green-800">{report.insight.core_desire}</p>
            </div>
          </div>

          {report.insight.supporting_quotes.length > 0 && (
            <div className="space-y-2">
              {report.insight.supporting_quotes.map((quote, i) => (
                <motion.div
                  key={i}
                  className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 rounded-r-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className="text-sm text-gray-700 italic">"{quote}"</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AgentCard>

      <AgentCard
        agent="story"
        index={1}
        title="Story Arc"
        subtitle="Hero's Journey"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <p className="text-gray-800 leading-relaxed italic">{report.story.story_paragraph}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">The Hero</h4>
              <p className="text-sm text-gray-700">{report.story.hero_description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">The Villain</h4>
              <p className="text-sm text-gray-700">{report.story.villain_description}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Chapter</h4>
              <p className="text-sm text-gray-700">{report.story.current_chapter}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Desired Chapter</h4>
              <p className="text-sm text-gray-700">{report.story.desired_chapter}</p>
            </div>
          </div>
        </div>
      </AgentCard>

      <AgentCard
        agent="prototype"
        index={2}
        title="5-Day Sprint"
        subtitle={report.prototype.goal.slice(0, 60) + '...'}
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <p className="text-sm font-semibold text-amber-900">{report.prototype.goal}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Constraints</h4>
            <ul className="space-y-1">
              {report.prototype.constraints.map((c, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">▸</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Sprint Plan</h4>
            <div className="space-y-3">
              {report.prototype.day_by_day_plan.map((day) => (
                <details key={day.day} className="group">
                  <summary className="cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 hover:from-amber-100 hover:to-orange-100 transition-all border border-amber-200">
                    <span className="font-semibold text-amber-900">Day {day.day}:</span>
                    <span className="text-sm text-gray-700 ml-2">{day.focus}</span>
                  </summary>
                  <div className="mt-2 pl-4 space-y-1">
                    {day.tasks.map((task, i) => (
                      <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </AgentCard>

      <AgentCard
        agent="symbol"
        index={3}
        title="Visual Symbols"
        subtitle="Design Language"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
            <h4 className="text-sm font-semibold text-pink-900 mb-2">Primary Symbol</h4>
            <p className="text-sm text-gray-700 italic">{report.symbol.primary_symbol}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Secondary Symbols</h4>
            <ul className="space-y-1">
              {report.symbol.secondary_symbols.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-pink-500">✦</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Conceptual Motifs</h4>
            <div className="flex flex-wrap gap-2">
              {report.symbol.conceptual_motifs.map((m, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs border border-pink-200"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">UI Motifs</h4>
            <div className="space-y-1">
              {report.symbol.ui_motifs.map((m, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500">⚡</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AgentCard>
    </div>
  );
}

interface AgentCardProps {
  agent: 'insight' | 'story' | 'prototype' | 'symbol';
  index: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function AgentCard({ agent, index, title, subtitle, children }: AgentCardProps) {
  const symbol = agentSymbols[agent];
  const gradients = {
    insight: 'from-purple-400 to-pink-400',
    story: 'from-blue-400 to-cyan-400',
    prototype: 'from-amber-400 to-orange-400',
    symbol: 'from-pink-400 to-rose-400',
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
      custom={index}
      variants={agentEntrance}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className={`h-1 bg-gradient-to-r ${gradients[agent]}`} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="text-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {symbol.emoji}
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// ============================================================================
// RIGHT PANEL: Insight Stream
// ============================================================================

function InsightStream({
  report,
  showRawJson,
  setShowRawJson,
}: {
  report: SessionReport;
  showRawJson: boolean;
  setShowRawJson: (show: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Preprocessing */}
      {report.preprocessing && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200"
          variants={slideUp}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            🔬 <span>Preprocessing</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-500">Pronoun:</span>
              <span className="ml-2 font-mono text-gray-700">{report.preprocessing.pronoun}</span>
            </div>
            <div>
              <span className="text-gray-500">Quotes:</span>
              <span className="ml-2 font-mono text-gray-700">{report.preprocessing.extractedQuotes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Keywords:</span>
              <span className="ml-2 font-mono text-gray-700">{report.preprocessing.keywords.length}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* SSIC Physics (Debug Only) */}
      {report.ssic && (
        <motion.div
          className="bg-purple-50 rounded-2xl shadow-lg p-4 border-2 border-purple-200"
          variants={slideUp}
        >
          <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
            ⚛️ <span>SSIC Physics (Debug)</span>
          </h3>
          <div className="space-y-3 text-xs">
            {/* Physics Values */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-purple-500 text-[10px] uppercase tracking-wide">Charge</div>
                <div className="font-mono text-purple-900">{report.ssic.charge.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-purple-500 text-[10px] uppercase tracking-wide">Velocity</div>
                <div className="font-mono text-purple-900">{report.ssic.velocity.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-purple-500 text-[10px] uppercase tracking-wide">Inertia</div>
                <div className="font-mono text-purple-900">{report.ssic.inertia.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-purple-500 text-[10px] uppercase tracking-wide">Flow</div>
                <div className="font-mono text-purple-900">{report.ssic.flowPotential.toFixed(0)}</div>
              </div>
            </div>

            {/* Resistance Profile */}
            <div className="pt-2 border-t border-purple-200">
              <div className="text-purple-500 text-[10px] uppercase tracking-wide mb-1">Resistance</div>
              <div className="text-purple-800 text-[11px] leading-snug">{report.ssic.resistance}</div>
            </div>

            {/* Momentum Profile */}
            <div className="pt-2 border-t border-purple-200">
              <div className="text-purple-500 text-[10px] uppercase tracking-wide mb-1">Momentum</div>
              <div className="text-purple-800 text-[11px] leading-snug">{report.ssic.momentum}</div>
            </div>

            {/* Zones */}
            {report.ssic.resistanceZones.length > 0 && (
              <div className="pt-2 border-t border-purple-200">
                <div className="text-purple-500 text-[10px] uppercase tracking-wide mb-1">Resistance Zones</div>
                <div className="space-y-1">
                  {report.ssic.resistanceZones.map((zone, i) => (
                    <div key={i} className="text-purple-700 text-[10px]">• {zone}</div>
                  ))}
                </div>
              </div>
            )}

            {report.ssic.breakthroughPoints.length > 0 && (
              <div className="pt-2 border-t border-purple-200">
                <div className="text-purple-500 text-[10px] uppercase tracking-wide mb-1">Breakthrough Points</div>
                <div className="space-y-1">
                  {report.ssic.breakthroughPoints.map((point, i) => (
                    <div key={i} className="text-purple-700 text-[10px]">• {point}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timing */}
      {report.totalDuration && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200"
          variants={slideUp}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            ⏱️ <span>Timing</span>
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {(report.totalDuration / 1000).toFixed(1)}s
          </div>
          <div className="text-xs text-gray-500">total execution</div>
        </motion.div>
      )}

      {/* Consistency Notes */}
      {report.consistency && (
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200"
          variants={slideUp}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            🔗 <span>Consistency</span>
          </h3>
          <div className="space-y-1">
            {report.consistency.notes.slice(0, 5).map((note, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span>{note.startsWith('✓') ? '✓' : '○'}</span>
                <span className="flex-1">{note.replace(/^[✓○]\s*/, '')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Raw JSON Toggle */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200"
        variants={slideUp}
      >
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            📋 <span>Raw JSON</span>
          </span>
          <span>{showRawJson ? '▼' : '▶'}</span>
        </button>

        {showRawJson && (
          <motion.div
            className="mt-3 max-h-96 overflow-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
              {JSON.stringify(report, null, 2)}
            </pre>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
