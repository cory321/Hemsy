'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stack } from '@mui/material';
import { QuickActions } from './QuickActions';
import { BusinessHealth } from './BusinessHealth';
import { RecentActivity } from './RecentActivity';
import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';
import { useAppointments } from '@/providers/AppointmentProvider';
import type { ShopHours } from '@/types';

interface BusinessOverviewProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export function BusinessOverview({
  shopId,
  shopHours,
  calendarSettings,
}: BusinessOverviewProps) {
  const router = useRouter();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // Get appointments from the provider to check for conflicts
  const { state } = useAppointments();

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'new-order':
        router.push('/orders/new');
        break;
      case 'new-client':
        setClientDialogOpen(true);
        break;
      case 'new-appointment':
        setAppointmentDialogOpen(true);
        break;
      case 'new-service':
        setServiceDialogOpen(true);
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const handleViewFinances = () => {
    console.log('View finances');
    // TODO: Navigate to finances page
  };

  return (
    <Stack spacing={3}>
      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Revenue Card */}
      <BusinessHealth onViewFinances={handleViewFinances} />

      {/* Recent Activity */}
      <RecentActivity />

      {/* Dialogs */}
      <ClientCreateDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onCreated={() => {
          setClientDialogOpen(false);
          // Optionally refresh data or show success message
        }}
      />

      <AppointmentDialog
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        shopHours={shopHours}
        existingAppointments={Array.from(state.appointments.values())}
        calendarSettings={calendarSettings}
        onCreate={async (data) => {
          // The AppointmentDialog will handle the creation through the provider
          setAppointmentDialogOpen(false);
          // Optionally refresh data or show success message
        }}
      />

      <CreateServiceDialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        onServiceSelect={() => {
          setServiceDialogOpen(false);
          // Optionally refresh data or show success message
        }}
      />
    </Stack>
  );
}
