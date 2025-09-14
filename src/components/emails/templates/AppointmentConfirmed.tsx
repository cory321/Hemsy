import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentConfirmedProps {
  clientName: string;
  seamstressName: string;
  appointmentTime: string;
  shopName?: string;
}

export const AppointmentConfirmed: React.FC<AppointmentConfirmedProps> = ({
  clientName,
  seamstressName,
  appointmentTime,
  shopName = 'Hemsy',
}) => {
  return (
    <EmailLayout
      preview={`${clientName} confirmed their appointment`}
      shopName={shopName}
    >
      <Text style={greeting}>Hi {seamstressName},</Text>

      <Section style={confirmationSection}>
        <Text style={confirmationIcon}>✅</Text>
        <Text style={confirmationTitle}>Appointment Confirmed</Text>
        <Text style={clientNameText}>{clientName}</Text>
      </Section>

      <Section style={appointmentSection}>
        <Text style={appointmentLabel}>Confirmed for:</Text>
        <Text style={appointmentTimeStyle}>{appointmentTime}</Text>
      </Section>

      <Text style={mainText}>You can view all your appointments in Hemsy.</Text>

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

const confirmationSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #bbf7d0',
};

const confirmationIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const confirmationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#16a34a',
  margin: '0 0 8px 0',
};

const clientNameText = {
  fontSize: '16px',
  color: '#15803d',
  margin: '0',
};

const appointmentSection = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const appointmentLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 8px 0',
};

const appointmentTimeStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
