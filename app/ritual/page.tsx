'use client';

/**
 * Creative Ritual Mode (Prompt 8)
 * Slow, meditative reveal of session insights one element at a time
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ritualReveal } from '@/theme/motion';

interface SessionReport {
  insight: {
    emotional_summary: string;
    core_wound: string;
    core_desire: string;
    archetype_guess: string;
  };
  story: {
    hero_description: string;
    villain_description: string;
    current_chapter: string;
    desired_chapter: string;
    story_paragraph: string;
  };
  prototype: {
    goal: string;
    day_by_day_plan: {
      day: number;
      focus: string;
      tasks: string[];
    }[];
  };
  symbol: {
    primary_symbol: string;
    secondary_symbols: string[];
  };
}

interface RitualStep {
  title: string;
  content: JSX.Element;
  emoji: string;
}

function RitualModeContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<SessionReport | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decoded = JSON.parse(decodeURIComponent(data));
        setReport(decoded);
      } catch (err) {
        console.error('Failed to parse session data:', err);
      }
    }
  }, [searchParams]);

  const steps: RitualStep[] = report
    ? [
        {
          title: 'Emotional Essence',
          emoji: '🔮',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🔮</div>
                <h2 className="text-3xl font-bold text-white mb-2">{report.insight.archetype_guess}</h2>
                <p className="text-purple-200 text-sm">Your Creative Archetype</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-white/90 text-lg leading-relaxed">{report.insight.emotional_summary}</p>
              </div>
            </div>
          ),
        },
        {
          title: 'Core Wound',
          emoji: '🩸',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🩸</div>
                <h2 className="text-3xl font-bold text-white mb-2">The Fracture</h2>
                <p className="text-red-200 text-sm">What holds you back</p>
              </div>
              <div className="bg-red-500/20 rounded-2xl p-8 backdrop-blur-sm border border-red-500/30">
                <p className="text-white text-xl leading-relaxed italic">{report.insight.core_wound}</p>
              </div>
            </div>
          ),
        },
        {
          title: 'Core Desire',
          emoji: '✨',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-3xl font-bold text-white mb-2">The Longing</h2>
                <p className="text-green-200 text-sm">What calls you forward</p>
              </div>
              <div className="bg-green-500/20 rounded-2xl p-8 backdrop-blur-sm border border-green-500/30">
                <p className="text-white text-xl leading-relaxed italic">{report.insight.core_desire}</p>
              </div>
            </div>
          ),
        },
        {
          title: 'Story',
          emoji: '📖',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-3xl font-bold text-white mb-2">Your Myth</h2>
                <p className="text-blue-200 text-sm">The journey unfolding</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <p className="text-white/90 text-lg leading-relaxed italic">{report.story.story_paragraph}</p>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-blue-200 text-sm mb-2">The Hero</p>
                  <p className="text-white/80 text-sm">{report.story.hero_description}</p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-red-200 text-sm mb-2">The Villain</p>
                  <p className="text-white/80 text-sm">{report.story.villain_description}</p>
                </div>
              </div>
            </div>
          ),
        },
        ...report.prototype.day_by_day_plan.slice(0, 5).map((day) => ({
          title: `Day ${day.day}`,
          emoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][day.day - 1] || '📅',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">{['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][day.day - 1]}</div>
                <h2 className="text-3xl font-bold text-white mb-2">Day {day.day}</h2>
                <p className="text-amber-200 text-lg">{day.focus}</p>
              </div>
              <div className="bg-amber-500/20 rounded-2xl p-6 backdrop-blur-sm border border-amber-500/30">
                <ul className="space-y-3">
                  {day.tasks.map((task, i) => (
                    <motion.li
                      key={i}
                      className="text-white/90 text-base flex items-start gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <span className="text-amber-400 mt-1">→</span>
                      <span>{task}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          ),
        })),
        {
          title: 'Symbols',
          emoji: '🌀',
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🌀</div>
                <h2 className="text-3xl font-bold text-white mb-2">Visual Language</h2>
                <p className="text-pink-200 text-sm">Symbols of transformation</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <div>
                  <p className="text-pink-200 text-sm mb-2">Primary Symbol</p>
                  <p className="text-white text-lg leading-relaxed italic">{report.symbol.primary_symbol}</p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-pink-200 text-sm mb-2">Secondary Symbols</p>
                  <ul className="space-y-2">
                    {report.symbol.secondary_symbols.map((s, i) => (
                      <motion.li
                        key={i}
                        className="text-white/80 text-sm flex items-start gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 }}
                      >
                        <span className="text-pink-400">✦</span>
                        <span>{s}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
      ]
    : [];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 8000); // 8 seconds per step
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStep === steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, steps.length]);

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🕯️</div>
          <p className="text-xl">Loading ritual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Ambient background animation */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Navigation */}
      <div className="absolute top-8 left-8 z-50">
        <a
          href="/session"
          className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          <span>←</span>
          <span>Exit Ritual</span>
        </a>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-8 right-8 z-50">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentStep ? 'bg-white' : i < currentStep ? 'bg-white/50' : 'bg-white/20'
              }`}
              animate={{
                scale: i === currentStep ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: i === currentStep ? Infinity : 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={ritualReveal}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {steps[currentStep]?.content}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <motion.div
            className="mt-12 flex items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>

            <button
              onClick={handleAutoPlay}
              className="px-6 py-3 bg-purple-500/30 hover:bg-purple-500/40 text-white rounded-full backdrop-blur-sm transition-all"
            >
              {isPlaying ? '⏸ Pause' : '▶ Auto'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </motion.div>

          {/* Step counter */}
          <motion.div
            className="mt-6 text-center text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            {currentStep + 1} / {steps.length}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function RitualMode() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">🕯️</div>
            <p className="text-xl">Preparing ritual...</p>
          </div>
        </div>
      }
    >
      <RitualModeContent />
    </Suspense>
  );
}
