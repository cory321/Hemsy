import { Suspense } from 'react';
import { BusinessOverviewClient } from './BusinessOverviewClient';
import { getBusinessHealthData } from '@/lib/actions/dashboard';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import { ensureUserAndShop } from '@/lib/actions/users';
import { getRecentActivity } from '@/lib/actions/recent-activity';
import { BusinessOverview } from './BusinessOverview';
import type { ShopHours } from '@/types';

async function BusinessOverviewWithData() {
  try {
    const [
      businessHealthData,
      shopHours,
      calendarSettings,
      { shop },
      recentActivity,
    ] = await Promise.all([
      getBusinessHealthData(),
      getShopHours(),
      getCalendarSettings(),
      ensureUserAndShop(),
      getRecentActivity(5), // Limit to 5 items for dashboard
    ]);

    // Transform shop hours to match expected type
    const transformedShopHours = shopHours.map((hour) => ({
      day_of_week: hour.day_of_week,
      open_time: hour.open_time,
      close_time: hour.close_time,
      is_closed: hour.is_closed ?? false,
    }));

    // Transform calendar settings to match expected type
    const transformedCalendarSettings = {
      buffer_time_minutes: calendarSettings.buffer_time_minutes ?? 0,
      default_appointment_duration:
        calendarSettings.default_appointment_duration ?? 30,
    };

    return (
      <BusinessOverviewClient
        shopId={shop.id}
        shopHours={transformedShopHours}
        calendarSettings={transformedCalendarSettings}
        businessHealthData={businessHealthData}
        recentActivity={recentActivity}
      />
    );
  } catch (error) {
    console.error('Error fetching business overview data:', error);
    // Fallback to component without data
    return (
      <BusinessOverviewClient
        shopId=""
        shopHours={[]}
        calendarSettings={{
          buffer_time_minutes: 0,
          default_appointment_duration: 30,
        }}
        recentActivity={[]}
      />
    );
  }
}

function BusinessOverviewLoading() {
  return (
    <BusinessOverviewClient
      shopId=""
      shopHours={[]}
      calendarSettings={{
        buffer_time_minutes: 0,
        default_appointment_duration: 30,
      }}
      recentActivity={[]}
      loading={true}
    />
  );
}

export function BusinessOverviewServer() {
  return (
    <Suspense fallback={<BusinessOverviewLoading />}>
      <BusinessOverviewWithData />
    </Suspense>
  );
}
