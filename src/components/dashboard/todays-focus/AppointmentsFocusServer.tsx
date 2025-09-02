import { Suspense } from 'react';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
  getWeekOverviewData,
  getWeekSummaryStats,
} from '@/lib/actions/dashboard';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import { AppointmentsFocus } from './AppointmentsFocus';
import { AppointmentsFocusLoading } from './AppointmentsFocusLoading';

async function AppointmentsFocusData() {
  try {
    const [
      nextAppointment,
      todayAppointments,
      weekData,
      weekSummaryStats,
      shopHours,
      calendarSettings,
    ] = await Promise.all([
      getNextAppointment(),
      getTodayAppointmentsDetailed(),
      getWeekOverviewData(),
      getWeekSummaryStats(),
      getShopHours(),
      getCalendarSettings(),
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
      <AppointmentsFocus
        nextAppointment={nextAppointment}
        todayAppointments={todayAppointments}
        weekData={weekData}
        weekSummaryStats={weekSummaryStats}
        shopHours={transformedShopHours}
        calendarSettings={transformedCalendarSettings}
      />
    );
  } catch (error) {
    console.error('Failed to fetch appointment data:', error);
    // Return empty state on error
    return (
      <AppointmentsFocus
        nextAppointment={null}
        todayAppointments={[]}
        weekData={[]}
        weekSummaryStats={{
          totalAppointments: 0,
          totalGarmentsDue: 0,
          totalOverdue: 0,
        }}
        shopHours={[]}
        calendarSettings={{
          buffer_time_minutes: 0,
          default_appointment_duration: 30,
        }}
      />
    );
  }
}

export function AppointmentsFocusServer() {
  return (
    <Suspense fallback={<AppointmentsFocusLoading />}>
      <AppointmentsFocusData />
    </Suspense>
  );
}
