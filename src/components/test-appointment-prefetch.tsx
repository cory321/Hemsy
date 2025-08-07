'use client';

import { useState } from 'react';
import {
  useAppointmentsTimeRange,
  usePrefetchAdjacentWindows,
  useCreateAppointment,
  calculateDateRange,
} from '@/lib/queries/appointment-queries';
import { format } from 'date-fns';

export function TestAppointmentPrefetch({ shopId }: { shopId: string }) {
  const [currentDate] = useState(new Date());
  const [view] = useState<'month' | 'week' | 'day'>('month');

  // Calculate date range for current view
  const { startDate, endDate } = calculateDateRange(currentDate, view);

  // Main query for current view
  const { data, isLoading, error } = useAppointmentsTimeRange(
    shopId,
    startDate,
    endDate,
    view
  );

  // Prefetch adjacent windows in the background
  usePrefetchAdjacentWindows(shopId, currentDate, view);

  // Mutation for creating appointments
  const createMutation = useCreateAppointment();

  const handleCreateTest = () => {
    createMutation.mutate({
      shopId,

      date: format(currentDate, 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '11:00',
      type: 'consultation',
    });
  };

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Test Appointment Query with Prefetching</h3>
      <p>Current view: {view}</p>
      <p>
        Date range: {startDate} to {endDate}
      </p>
      <p>Appointments found: {data?.length || 0}</p>

      <button onClick={handleCreateTest} disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Test Appointment'}
      </button>

      {createMutation.isError && (
        <p style={{ color: 'red' }}>Error: {createMutation.error?.message}</p>
      )}

      {createMutation.isSuccess && (
        <p style={{ color: 'green' }}>Appointment created successfully!</p>
      )}

      <div>
        <h4>First appointment:</h4>
        <pre>{JSON.stringify(data?.[0], null, 2)}</pre>
      </div>
    </div>
  );
}
