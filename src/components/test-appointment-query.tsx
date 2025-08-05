'use client';

import { useAppointmentsForMonth } from '@/lib/queries/appointment-queries';

export function TestAppointmentQuery({ shopId }: { shopId: string }) {
  const { data, isLoading, error } = useAppointmentsForMonth(
    shopId,
    2024,
    1 // January
  );

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Appointments: {data?.length || 0}</h3>
      <pre>{JSON.stringify(data?.[0], null, 2)}</pre>
    </div>
  );
}
