'use client';

import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';
import type { ShopHours } from '@/types';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid } from 'date-fns';
import { parseLocalDateFromYYYYMMDD } from '@/lib/utils/date';

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
  const search = useSearchParams();
  const viewParam = (search.get('view') || 'month') as
    | 'month'
    | 'week'
    | 'day'
    | 'list';
  const dateParam = search.get('date');
  const focusParam = search.get('focus') || undefined;

  // Robustly parse date-only strings as local dates to avoid off-by-one timezone shifts
  let parsedDate = new Date();
  if (dateParam) {
    parsedDate =
      dateParam.length === 10
        ? parseLocalDateFromYYYYMMDD(dateParam)
        : parseISO(dateParam);
  }
  const initialDate = isValid(parsedDate) ? parsedDate : new Date();
  const initialView = ['month', 'week', 'day', 'list'].includes(viewParam)
    ? (viewParam as any)
    : 'month';

  return (
    <CalendarWithReducer
      shopId={shopId}
      shopHours={shopHours}
      calendarSettings={calendarSettings}
      initialView={initialView}
      initialDate={initialDate}
      focusAppointmentId={focusParam}
    />
  );
}
