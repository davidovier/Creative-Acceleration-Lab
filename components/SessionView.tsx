/**
 * SessionView Component
 * Reusable session display for both live and historical sessions
 */

'use client';

import { motion } from 'framer-motion';
import FlowMeter from './FlowMeter';
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

interface SessionViewProps {
  report: any; // SessionReport type
}

export default function SessionView({ report }: SessionViewProps) {
  // Calculate dominant color
  const dominantColor = getDominantColor(report.symbol.color_palette_suggestions);

  // Calculate flow meter values
  const keywords = report.preprocessing?.keywords || [];
  const velocity = Math.min(100, keywords.length * 12.5);
  const resistance = Math.min(100, (report.insight?.core_wound?.length || 0) / 2);
  const clarity = Math.min(100, (report.insight?.core_desire?.length || 0) / 2);

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* LEFT PANEL: Creative Energy */}
      <motion.div className="lg:col-span-3 space-y-6" variants={staggerItem}>
        {/* Flow Meter */}
        <FlowMeter velocity={velocity} resistance={resistance} clarity={clarity} dominantColor={dominantColor} />

        {/* Color Palette */}
        <motion.div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100" variants={slideUp}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>🎨</span>
            <span>Color Language</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {report.symbol.color_palette_suggestions.map((item: any, i: number) => {
              const colorHex = typeof item === 'string' ? item : item.color;
              const meaning = typeof item === 'object' ? item.meaning : '';

              return (
                <motion.div
                  key={i}
                  className="group cursor-help"
                  variants={colorSwatchReveal}
                  custom={i}
                  whileHover={{ scale: 1.1 }}
                >
                  <div
                    className="w-full aspect-square rounded-xl shadow-md"
                    style={{ backgroundColor: colorHex }}
                  />
                  {meaning && (
                    <p className="text-[10px] text-gray-500 mt-1 text-center line-clamp-2 group-hover:text-gray-900 transition-colors">
                      {meaning}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Keywords */}
        {report.preprocessing?.keywords && (
          <motion.div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100" variants={slideUp}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>🔑</span>
              <span>Keywords</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.preprocessing.keywords.map((keyword: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* CENTER PANEL: Agent Outputs */}
      <motion.div className="lg:col-span-6 space-y-6" variants={staggerItem}>
        {/* Insight */}
        <AgentSection
          title="Insight"
          emoji={agentSymbols.insight.emoji}
          gradient="from-purple-500 to-pink-500"
          index={0}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Archetype</h4>
              <p className="text-lg font-bold text-gray-900">{report.insight.archetype_guess}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Emotional Summary
              </h4>
              <p className="text-gray-800 leading-relaxed">{report.insight.emotional_summary}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Core Wound</h4>
                <p className="text-sm text-gray-700 italic leading-relaxed">{report.insight.core_wound}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">Core Desire</h4>
                <p className="text-sm text-gray-700 italic leading-relaxed">{report.insight.core_desire}</p>
              </div>
            </div>
          </div>
        </AgentSection>

        {/* Story */}
        <AgentSection title="Story" emoji={agentSymbols.story.emoji} gradient="from-blue-500 to-cyan-500" index={1}>
          <div className="space-y-4">
            <p className="text-gray-800 leading-relaxed italic">{report.story.story_paragraph}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hero</h4>
                <p className="text-sm text-gray-700">{report.story.hero_description}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Villain</h4>
                <p className="text-sm text-gray-700">{report.story.villain_description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Current Chapter
                </h4>
                <p className="text-sm text-gray-700">{report.story.current_chapter}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Desired Chapter
                </h4>
                <p className="text-sm text-gray-700">{report.story.desired_chapter}</p>
              </div>
            </div>
          </div>
        </AgentSection>

        {/* Prototype */}
        <AgentSection
          title="Prototype"
          emoji={agentSymbols.prototype.emoji}
          gradient="from-amber-500 to-orange-500"
          index={2}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Goal</h4>
              <p className="text-gray-800 font-semibold leading-relaxed">{report.prototype.goal}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Constraints ({report.prototype.constraints.length})
              </h4>
              <ul className="space-y-1">
                {report.prototype.constraints.map((c: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">▪</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">5-Day Plan</h4>
              <div className="space-y-4">
                {report.prototype.day_by_day_plan.map((day: any, i: number) => (
                  <div key={i} className="border-l-4 border-amber-300 pl-4">
                    <h5 className="font-bold text-gray-900 mb-1">
                      Day {day.day}: {day.focus}
                    </h5>
                    <ul className="space-y-1">
                      {day.tasks.map((task: string, j: number) => (
                        <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">→</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AgentSection>

        {/* Symbol */}
        <AgentSection
          title="Symbol"
          emoji={agentSymbols.symbol.emoji}
          gradient="from-pink-500 to-rose-500"
          index={3}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Primary Symbol</h4>
              <p className="text-gray-800 leading-relaxed italic">{report.symbol.primary_symbol}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Secondary Symbols
              </h4>
              <ul className="space-y-1">
                {report.symbol.secondary_symbols.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-pink-400 mt-1">✦</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conceptual Motifs</h4>
              <ul className="space-y-1">
                {report.symbol.conceptual_motifs.map((m: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-pink-400 mt-1">◈</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AgentSection>
      </motion.div>

      {/* RIGHT PANEL: Insight Stream */}
      <motion.div className="lg:col-span-3 space-y-6" variants={staggerItem}>
        {/* Preprocessing */}
        {report.preprocessing && (
          <motion.div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200" variants={slideUp}>
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
                    {report.ssic.resistanceZones.map((zone: string, i: number) => (
                      <div key={i} className="text-purple-700 text-[10px]">
                        • {zone}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.ssic.breakthroughPoints.length > 0 && (
                <div className="pt-2 border-t border-purple-200">
                  <div className="text-purple-500 text-[10px] uppercase tracking-wide mb-1">Breakthrough Points</div>
                  <div className="space-y-1">
                    {report.ssic.breakthroughPoints.map((point: string, i: number) => (
                      <div key={i} className="text-purple-700 text-[10px]">
                        • {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Timing */}
        {report.totalDuration && (
          <motion.div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200" variants={slideUp}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              ⏱️ <span>Timing</span>
            </h3>
            <div className="text-2xl font-bold text-gray-900">{(report.totalDuration / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-500">total execution</div>
          </motion.div>
        )}

        {/* Consistency Notes */}
        {report.consistency && (
          <motion.div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200" variants={slideUp}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🔗 <span>Consistency</span>
            </h3>
            <div className="space-y-1">
              {report.consistency.notes.slice(0, 5).map((note: string, i: number) => (
                <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span>{note.startsWith('✓') ? '✓' : '○'}</span>
                  <span className="flex-1">{note.replace(/^[✓○]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Agent Section Component
function AgentSection({
  title,
  emoji,
  gradient,
  index,
  children,
}: {
  title: string;
  emoji: string;
  gradient: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100"
      variants={agentEntrance}
      custom={index}
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="text-3xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.15 + 0.2, type: 'spring' }}
          >
            {emoji}
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">Agent Output</p>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
