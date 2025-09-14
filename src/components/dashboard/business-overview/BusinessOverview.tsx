'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stack } from '@mui/material';
import { QuickActions } from './QuickActions';
import { BusinessHealth } from './BusinessHealth';
import { RecentActivity } from './RecentActivity';
import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import { AppointmentDialogWithConflictCheck } from '@/components/appointments/AppointmentDialogWithConflictCheck';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';
import { useAppointments } from '@/providers/AppointmentProvider';
import type { ShopHours } from '@/types';
import type { BusinessHealthData } from '@/lib/actions/dashboard';
import type { ActivityItem } from '@/lib/actions/recent-activity';

interface BusinessOverviewProps {
  shopId: string;
  shopHours: ShopHours[];
  calendarSettings: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
    allow_overlapping_appointments?: boolean;
  };
  businessHealthData?: BusinessHealthData | undefined;
  recentActivity?: ActivityItem[] | undefined;
  loading?: boolean;
}

export function BusinessOverview({
  shopId,
  shopHours,
  calendarSettings,
  businessHealthData,
  recentActivity,
  loading = false,
}: BusinessOverviewProps) {
  const router = useRouter();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // Get appointments from the provider to check for conflicts
  const { state, createAppointment } = useAppointments();

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
      <BusinessHealth
        {...businessHealthData}
        onViewFinances={handleViewFinances}
        loading={loading}
      />

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity || []} loading={loading} />

      {/* Dialogs */}
      <ClientCreateDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onCreated={() => {
          setClientDialogOpen(false);
          // Optionally refresh data or show success message
        }}
      />

      <AppointmentDialogWithConflictCheck
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        shopId={shopId}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
        onCreate={async (data) => {
          try {
            await createAppointment(shopId, { ...data, shopId });
            setAppointmentDialogOpen(false);
          } catch (error) {
            // Error is handled in the provider with toast
            console.error('Failed to create appointment:', error);
          }
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
