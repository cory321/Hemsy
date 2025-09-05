'use client';

import { useEffect, useRef } from 'react';

export type ConfettiCelebrationProps = {
  /** total falling time after the initial pop */
  durationMs?: number;
  /** strength of the initial pop */
  particleCount?: number;
};

export default function ConfettiCelebration({
  durationMs = 4000,
  particleCount = 140,
}: ConfettiCelebrationProps) {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReducedMotion) {
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    (async () => {
      const confetti = (await import('canvas-confetti')).default;

      confetti({
        particleCount,
        spread: 75,
        origin: { y: 0.6 },
        ticks: 200,
      });

      const end = Date.now() + durationMs;
      intervalId = window.setInterval(() => {
        if (Date.now() > end || cancelled) {
          if (intervalId) window.clearInterval(intervalId);
          return;
        }

        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          gravity: 1.1,
          ticks: 200,
          scalar: 0.9,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          gravity: 1.1,
          ticks: 200,
          scalar: 0.9,
        });
      }, 200);
    })();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [durationMs, particleCount]);

  return null;
}
