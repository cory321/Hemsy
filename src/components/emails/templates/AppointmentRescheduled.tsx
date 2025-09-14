import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentRescheduledProps {
  clientName: string;
  shopName: string;
  appointmentTime: string;
  previousTime: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const AppointmentRescheduled: React.FC<AppointmentRescheduledProps> = ({
  clientName,
  shopName,
  appointmentTime,
  previousTime,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview="Your appointment has been rescheduled"
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        Your appointment with {shopName} has been rescheduled.
      </Text>

      <Section style={timeSection}>
        <Text style={timeLabel}>Previous time:</Text>
        <Text style={timeValue}>{previousTime}</Text>

        <Text style={timeLabel}>New time:</Text>
        <Text style={timeValue}>{appointmentTime}</Text>
      </Section>

      <Text style={mainText}>
        If you have any questions, please contact us.
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
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
