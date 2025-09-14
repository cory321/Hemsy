import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentCanceledSeamstressProps {
  clientName: string;
  seamstressName: string;
  previousTime: string;
  shopName?: string;
}

export const AppointmentCanceledSeamstress: React.FC<
  AppointmentCanceledSeamstressProps
> = ({ clientName, seamstressName, previousTime, shopName = 'Hemsy' }) => {
  return (
    <EmailLayout
      preview={`Appointment canceled: ${clientName}`}
      shopName={shopName}
    >
      <Text style={greeting}>Hi {seamstressName},</Text>

      <Section style={notificationSection}>
        <Text style={notificationIcon}>❌</Text>
        <Text style={notificationTitle}>Appointment Canceled</Text>
        <Text style={clientNameText}>{clientName}</Text>
      </Section>

      <Section style={timeSection}>
        <Text style={timeLabel}>Canceled appointment:</Text>
        <Text style={timeValue}>{previousTime}</Text>
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
  backgroundColor: '#fef2f2',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #fecaca',
};

const notificationIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const notificationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0 0 8px 0',
};

const clientNameText = {
  fontSize: '16px',
  color: '#b91c1c',
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
  margin: '0 0 8px 0',
};

const timeValue = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0',
  textDecoration: 'line-through',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
