/**
 * FlowMeter Component
 * Liquid-like visualization of creative flow state
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FlowMeterProps {
  velocity: number;      // 0-100 (from keywords intensity)
  resistance: number;    // 0-100 (from core_wound)
  clarity: number;       // 0-100 (from core_desire)
  dominantColor?: string;
}

export default function FlowMeter({
  velocity,
  resistance,
  clarity,
  dominantColor = '#8B5CF6',
}: FlowMeterProps) {
  const [turbulence, setTurbulence] = useState(0.02);

  useEffect(() => {
    // Turbulence based on resistance
    setTurbulence(0.01 + (resistance / 100) * 0.05);
  }, [resistance]);

  // Calculate overall flow state
  const flowIntensity = (velocity + clarity - resistance) / 3;
  const flowColor = flowIntensity > 60 ? '#10B981' : flowIntensity > 30 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
      {/* SVG Liquid Visualization */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gooey filter for liquid effect */}
          <filter id="goo-flow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>

          {/* Turbulence for organic movement */}
          <filter id="turbulence">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={turbulence}
              numOctaves="3"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Velocity blob (top) */}
        <motion.circle
          cx="100"
          cy="60"
          r={20 + velocity / 5}
          fill={dominantColor}
          opacity="0.7"
          filter="url(#goo-flow)"
          animate={{
            cy: [60, 55, 60],
            r: [20 + velocity / 5, 25 + velocity / 5, 20 + velocity / 5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Clarity blob (left) */}
        <motion.circle
          cx="60"
          cy="120"
          r={18 + clarity / 6}
          fill={flowColor}
          opacity="0.6"
          filter="url(#goo-flow)"
          animate={{
            cx: [60, 55, 60],
            r: [18 + clarity / 6, 22 + clarity / 6, 18 + clarity / 6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />

        {/* Resistance blob (right) */}
        <motion.circle
          cx="140"
          cy="120"
          r={15 + resistance / 7}
          fill="#EF4444"
          opacity="0.5"
          filter="url(#goo-flow)"
          animate={{
            cx: [140, 145, 140],
            r: [15 + resistance / 7, 20 + resistance / 7, 15 + resistance / 7],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Center flow blob */}
        <motion.circle
          cx="100"
          cy="100"
          r={25}
          fill={flowColor}
          opacity="0.8"
          filter="url(#goo-flow)"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Turbulence overlay */}
        <rect
          x="0"
          y="0"
          width="200"
          height="200"
          fill={dominantColor}
          opacity="0.05"
          filter="url(#turbulence)"
        />
      </svg>

      {/* Labels */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="text-white text-sm font-semibold opacity-80">Creative Flow</div>

        <div className="space-y-2">
          <FlowMetric label="Velocity" value={velocity} color={dominantColor} />
          <FlowMetric label="Clarity" value={clarity} color={flowColor} />
          <FlowMetric label="Resistance" value={resistance} color="#EF4444" />
        </div>
      </div>
    </div>
  );
}

function FlowMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-xs opacity-70 w-20">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="text-white text-xs opacity-70 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}
