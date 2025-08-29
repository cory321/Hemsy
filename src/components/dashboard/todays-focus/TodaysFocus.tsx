'use client';

import { Stack, Card, CardContent, Typography } from '@mui/material';
import { NextAppointmentCard } from './NextAppointmentCard';
import { TodaySchedule } from './TodaySchedule';
import { WeekOverview } from './WeekOverview';
import { ReadyForPickup } from './ReadyForPickup';

export function TodaysFocus() {
  // TODO: Replace with real data from actions/queries
  const nextAppointment = {
    time: '10:30 AM',
    clientName: 'Sarah Johnson',
    service: 'Consultation',
  };

  const todayAppointments = [
    {
      time: '10:30 AM',
      client: 'Sarah Johnson',
      type: 'fitting',
      current: true,
    },
    {
      time: '1:00 PM',
      client: 'Michael Brown',
      type: 'consultation',
    },
    { time: '3:30 PM', client: 'Lisa Chen', type: 'pickup' },
  ];

  return (
    <Stack spacing={3}>
      {/* Next Appointment Card */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Today&apos;s Focus
          </Typography>

          <NextAppointmentCard
            time={nextAppointment.time}
            clientName={nextAppointment.clientName}
            service={nextAppointment.service}
            onCall={() => console.log('Call clicked')}
            onLocation={() => console.log('Location clicked')}
            onViewDetails={() => console.log('View details clicked')}
            onViewClient={() => console.log('View client clicked')}
            onCopyPhone={() => {
              // TODO: Implement actual phone copy functionality
              navigator.clipboard?.writeText('555-0123'); // placeholder
              console.log('Phone copied to clipboard');
            }}
            onSendEmail={() => console.log('Send email clicked')}
          />

          <TodaySchedule appointments={todayAppointments} />
        </CardContent>
      </Card>

      {/* This Week Overview */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <WeekOverview onViewCalendar={() => console.log('View calendar')} />
        </CardContent>
      </Card>

      {/* Ready for Pickup */}
      <ReadyForPickup onSendReminders={() => console.log('Send reminders')} />
    </Stack>
  );
}
