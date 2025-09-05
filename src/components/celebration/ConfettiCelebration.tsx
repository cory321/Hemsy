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
  particleCount = 200,
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
        spread: 90,
        origin: { y: 0.6 },
        ticks: 200,
        scalar: 1.0,
      });

      const end = Date.now() + durationMs;
      intervalId = window.setInterval(() => {
        if (Date.now() > end || cancelled) {
          if (intervalId) window.clearInterval(intervalId);
          return;
        }

        // Center-only gentle falling effect
        confetti({
          particleCount: 10,
          angle: 90,
          spread: 70,
          origin: { x: 0.5, y: 0 },
          gravity: 1.1,
          ticks: 200,
          scalar: 1.0,
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
