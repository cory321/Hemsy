'use client';

import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';
import type { ShopHours } from '@/types';

interface AppointmentsClientProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export function AppointmentsClient({
  shopId,
  shopHours,
  calendarSettings,
}: AppointmentsClientProps) {
  return (
    <CalendarWithReducer
      shopId={shopId}
      shopHours={shopHours}
      calendarSettings={calendarSettings}
      initialView="month"
    />
  );
}
