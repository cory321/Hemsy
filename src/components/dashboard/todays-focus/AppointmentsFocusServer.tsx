import { Suspense } from 'react';
import {
  getTodayAppointmentsDetailed,
  getNextAppointment,
} from '@/lib/actions/dashboard';
import { AppointmentsFocus } from './AppointmentsFocus';
import { AppointmentsFocusLoading } from './AppointmentsFocusLoading';

async function AppointmentsFocusData() {
  try {
    const [nextAppointment, todayAppointments] = await Promise.all([
      getNextAppointment(),
      getTodayAppointmentsDetailed(),
    ]);

    return (
      <AppointmentsFocus
        nextAppointment={nextAppointment}
        todayAppointments={todayAppointments}
      />
    );
  } catch (error) {
    console.error('Failed to fetch appointment data:', error);
    // Return empty state on error
    return <AppointmentsFocus nextAppointment={null} todayAppointments={[]} />;
  }
}

export function AppointmentsFocusServer() {
  return (
    <Suspense fallback={<AppointmentsFocusLoading />}>
      <AppointmentsFocusData />
    </Suspense>
  );
}
