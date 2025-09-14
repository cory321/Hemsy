import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentReminderProps {
  clientName: string;
  shopName: string;
  appointmentTime: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({
  clientName,
  shopName,
  appointmentTime,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`Appointment reminder: ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        This is a reminder about your appointment with {shopName} scheduled for:
      </Text>

      <Section style={appointmentSection}>
        <Text style={appointmentTimeStyle}>{appointmentTime}</Text>
      </Section>

      <Text style={mainText}>
        If you need to reschedule or cancel, please contact us as soon as
        possible.
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

const appointmentSection = {
  backgroundColor: '#fef3c7',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #f59e0b',
};

const appointmentTimeStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
