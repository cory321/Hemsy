import { Suspense } from 'react';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
  getWeekOverviewData,
  getWeekSummaryStats,
} from '@/lib/actions/dashboard';
import { AppointmentsFocus } from './AppointmentsFocus';
import { AppointmentsFocusLoading } from './AppointmentsFocusLoading';

async function AppointmentsFocusData() {
  try {
    const [nextAppointment, todayAppointments, weekData, weekSummaryStats] =
      await Promise.all([
        getNextAppointment(),
        getTodayAppointmentsDetailed(),
        getWeekOverviewData(),
        getWeekSummaryStats(),
      ]);

    return (
      <AppointmentsFocus
        nextAppointment={nextAppointment}
        todayAppointments={todayAppointments}
        weekData={weekData}
        weekSummaryStats={weekSummaryStats}
      />
    );
  } catch (error) {
    console.error('Failed to fetch appointment data:', error);
    // Return empty state on error
    return (
      <AppointmentsFocus
        nextAppointment={null}
        todayAppointments={[]}
        weekData={undefined}
        weekSummaryStats={undefined}
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
