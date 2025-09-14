import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentNoShowProps {
  clientName: string;
  shopName: string;
  appointmentTime: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const AppointmentNoShow: React.FC<AppointmentNoShowProps> = ({
  clientName,
  shopName,
  appointmentTime,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`We missed you at ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Section style={missedSection}>
        <Text style={missedIcon}>😔</Text>
        <Text style={missedTitle}>We missed you!</Text>
      </Section>

      <Text style={mainText}>
        We&apos;re sorry we missed you for your appointment with {shopName} on{' '}
        <strong>{appointmentTime}</strong>.
      </Text>

      <Text style={mainText}>
        If you still need help, reply to this email and we&apos;ll get you the
        next available time.
      </Text>

      <Text style={closing}>
        Thank you,
        <br />
        {shopName}
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

const missedSection = {
  backgroundColor: '#fef2f2',
  padding: '24px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #fecaca',
};

const missedIcon = {
  fontSize: '32px',
  margin: '0 0 8px 0',
};

const missedTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
