'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ConfettiParticle {
  id: number;
  leftPercent: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  drift: number;
}

const CONFETTI_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];

/**
 * Lightweight falling confetti burst for gym PR celebrations.
 */
export function GymPrConfetti(): React.ReactElement | null {
  const reducedMotion = useReducedMotion();
  const particles = useMemo<ConfettiParticle[]>(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        leftPercent: 8 + ((index * 47) % 84),
        delay: (index % 6) * 0.06,
        duration: 1.6 + (index % 4) * 0.2,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? '#22c55e',
        size: 6 + (index % 3) * 2,
        drift: ((index % 5) - 2) * 18,
      })),
    [],
  );

  if (reducedMotion) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-sm"
          style={{
            left: `${String(particle.leftPercent)}%`,
            top: '-8%',
            width: particle.size,
            height: particle.size * 1.4,
            backgroundColor: particle.color,
          }}
          initial={{ opacity: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: ['0vh', '95vh'],
            x: [0, particle.drift],
            rotate: [0, 180 + particle.id * 12],
          }}
          transition={{
            delay: particle.delay,
            duration: particle.duration,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
