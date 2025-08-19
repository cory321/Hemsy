'use client';

import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import ClientAppointmentsSection from '@/components/clients/ClientAppointmentsSection';
import ClientOrdersSection from '@/components/clients/ClientOrdersSection';

interface ClientDetailTabsProps {
  clientId: string;
  clientName: string;
  // Appointments props
  clientEmail?: string;
  clientPhone?: string;
  clientAcceptEmail?: boolean;
  clientAcceptSms?: boolean;
  shopId: string;
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
}

export default function ClientDetailTabs({
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  clientAcceptEmail,
  clientAcceptSms,
  shopId,
  shopHours,
  calendarSettings,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'appointments'>(
    'orders'
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab
          value="orders"
          label="Orders"
          iconPosition="start"
          icon={<i className="ri-shopping-bag-line" />}
        />
        <Tab
          value="appointments"
          label="Appointments"
          iconPosition="start"
          icon={<i className="ri-calendar-event-line" />}
        />
      </Tabs>

      {activeTab === 'orders' ? (
        <ClientOrdersSection clientId={clientId} clientName={clientName} />
      ) : (
        <ClientAppointmentsSection
          clientId={clientId}
          clientName={clientName}
          clientEmail={clientEmail ?? ''}
          clientPhone={clientPhone ?? ''}
          clientAcceptEmail={!!clientAcceptEmail}
          clientAcceptSms={!!clientAcceptSms}
          shopId={shopId}
          shopHours={shopHours ?? []}
          calendarSettings={
            calendarSettings ?? {
              buffer_time_minutes: 0,
              default_appointment_duration: 30,
            }
          }
        />
      )}
    </Box>
  );
}
