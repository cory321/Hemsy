'use client';

import { useEffect, useMemo, useState } from 'react';
import ConfettiCelebration from '@/components/celebration/ConfettiCelebration';
import { useGarment } from '@/contexts/GarmentContext';

/**
 * Triggers a confetti celebration when all non-removed services are marked done.
 * Respects prefers-reduced-motion via ConfettiCelebration and only fires once per mount.
 */
export default function GarmentCompletionCelebration() {
  const { garment } = useGarment();
  const [shouldCelebrate, setShouldCelebrate] = useState(false);

  const allServicesCompleted = useMemo(() => {
    const allServices = garment?.garment_services || [];
    const active = allServices.filter((s: any) => !s.is_removed);
    if (active.length === 0) return false;
    return active.every((s: any) => s.is_done);
  }, [garment?.garment_services]);

  useEffect(() => {
    if (allServicesCompleted) {
      setShouldCelebrate(true);
    }
  }, [allServicesCompleted]);

  if (!shouldCelebrate) return null;

  return <ConfettiCelebration />;
}
