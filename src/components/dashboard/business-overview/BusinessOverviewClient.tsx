'use client';

import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { BusinessOverview } from './BusinessOverview';
import type { ShopHours } from '@/types';
import type { BusinessHealthData } from '@/lib/actions/dashboard';
import type { ActivityItem } from '@/lib/actions/recent-activity';

interface BusinessOverviewClientProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  businessHealthData?: BusinessHealthData;
  recentActivity?: ActivityItem[] | undefined;
  loading?: boolean;
}

export function BusinessOverviewClient({
  shopId,
  shopHours,
  calendarSettings,
  businessHealthData,
  recentActivity,
  loading = false,
}: BusinessOverviewClientProps) {
  return (
    <AppointmentProvider shopId={shopId}>
      <BusinessOverview
        shopId={shopId}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
        businessHealthData={businessHealthData}
        recentActivity={recentActivity}
        loading={loading}
      />
    </AppointmentProvider>
  );
}
