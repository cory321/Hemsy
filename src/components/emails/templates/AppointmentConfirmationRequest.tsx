import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, Button } from '../components';

interface AppointmentConfirmationRequestProps {
  clientName: string;
  shopName: string;
  appointmentTime: string;
  confirmationLink: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const AppointmentConfirmationRequest: React.FC<
  AppointmentConfirmationRequestProps
> = ({
  clientName,
  shopName,
  appointmentTime,
  confirmationLink,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`Please confirm your appointment with ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        Please confirm your appointment scheduled for{' '}
        <strong>{appointmentTime}</strong> by clicking the button below:
      </Text>

      <Section style={buttonSection}>
        <Button href={confirmationLink} variant="primary">
          Confirm Appointment
        </Button>
      </Section>

      <Section style={warningSection}>
        <Text style={warningText}>⏰ This link will expire in 24 hours.</Text>
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

const buttonSection = {
  margin: '24px 0',
  textAlign: 'center' as const,
};

const warningSection = {
  backgroundColor: '#fef3c7',
  padding: '12px',
  borderRadius: '6px',
  margin: '16px 0 24px 0',
  textAlign: 'center' as const,
  border: '1px solid #f59e0b',
};

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
  fontWeight: 'bold',
};

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
