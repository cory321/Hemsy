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

export function BusinessOverview() {
  const router = useRouter();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

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
        onCreate={async () => {
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
