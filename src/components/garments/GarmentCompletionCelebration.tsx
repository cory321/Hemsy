'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ConfettiCelebration from '@/components/celebration/ConfettiCelebration';
import { useGarment } from '@/contexts/GarmentContext';

/**
 * Triggers confetti only when completion transitions from false -> true.
 * Excludes soft-deleted services and supports re-trigger after toggling.
 */
export default function GarmentCompletionCelebration() {
  const { garment } = useGarment();
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const prevCompletedRef = useRef<boolean | null>(null);

  const allServicesCompleted = useMemo(() => {
    const allServices = garment?.garment_services || [];
    const active = allServices.filter((s: any) => !s.is_removed);
    if (active.length === 0) return false;
    return active.every((s: any) => !!s.is_done);
  }, [garment?.garment_services]);

  useEffect(() => {
    if (prevCompletedRef.current === null) {
      prevCompletedRef.current = allServicesCompleted;
      return;
    }

    if (!prevCompletedRef.current && allServicesCompleted) {
      setCelebrateCount((c) => c + 1);
      setIsActive(true);
    }

    if (!allServicesCompleted) {
      setIsActive(false);
    }

    prevCompletedRef.current = allServicesCompleted;
  }, [allServicesCompleted]);

  if (!isActive) return null;

  return <ConfettiCelebration key={celebrateCount} />;
}
