import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentRescheduledSeamstressProps {
  clientName: string;
  seamstressName: string;
  appointmentTime: string;
  previousTime: string;
  shopName?: string;
}

export const AppointmentRescheduledSeamstress: React.FC<
  AppointmentRescheduledSeamstressProps
> = ({
  clientName,
  seamstressName,
  appointmentTime,
  previousTime,
  shopName = 'Hemsy',
}) => {
  return (
    <EmailLayout
      preview={`Appointment rescheduled: ${clientName}`}
      shopName={shopName}
    >
      <Text style={greeting}>Hi {seamstressName},</Text>

      <Section style={notificationSection}>
        <Text style={notificationIcon}>📅</Text>
        <Text style={notificationTitle}>Appointment Rescheduled</Text>
        <Text style={clientNameText}>{clientName}</Text>
      </Section>

      <Section style={timeSection}>
        <Text style={timeLabel}>Previous time:</Text>
        <Text style={timeValue}>{previousTime}</Text>

        <Text style={timeLabel}>New time:</Text>
        <Text style={timeValueNew}>{appointmentTime}</Text>
      </Section>

      <Text style={mainText}>You can view details in Hemsy.</Text>

      <Text style={closing}>
        Thank you,
        <br />
        Hemsy
      </Text>
    </EmailLayout>
  );
};

// Styles
const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
  color: '#1a1a1a',
};

const mainText = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
  color: '#1a1a1a',
};

const notificationSection = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #3b82f6',
};

const notificationIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const notificationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1d4ed8',
  margin: '0 0 8px 0',
};

const clientNameText = {
  fontSize: '16px',
  color: '#1e40af',
  margin: '0',
};

const timeSection = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
};

const timeLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 4px 0',
};

const timeValue = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0 0 16px 0',
  textDecoration: 'line-through',
};

const timeValueNew = {
  fontSize: '16px',
  color: '#16a34a',
  margin: '0',
  fontWeight: 'bold',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
