'use client';

import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { BusinessOverview } from './BusinessOverview';
import type { ShopHours } from '@/types';

interface BusinessOverviewClientProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export function BusinessOverviewClient({
  shopId,
  shopHours,
  calendarSettings,
}: BusinessOverviewClientProps) {
  return (
    <AppointmentProvider shopId={shopId}>
      <BusinessOverview
        shopId={shopId}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
      />
    </AppointmentProvider>
  );
}
