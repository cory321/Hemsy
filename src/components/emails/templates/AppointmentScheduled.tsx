import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, Button } from '../components';

interface AppointmentScheduledProps {
  clientName: string;
  shopName: string;
  appointmentTime: string;
  confirmationLink?: string | undefined;
  cancelLink?: string | undefined;
  shopEmail?: string | undefined;
  shopPhone?: string | undefined;
  shopAddress?: string | undefined;
}

export const AppointmentScheduled: React.FC<AppointmentScheduledProps> = ({
  clientName,
  shopName,
  appointmentTime,
  confirmationLink,
  cancelLink,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`Your appointment is scheduled with ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        Your appointment with {shopName} is scheduled for{' '}
        <strong>{appointmentTime}</strong>.
      </Text>

      {confirmationLink && (
        <Section style={buttonSection}>
          <Button href={confirmationLink} variant="primary">
            Confirm Appointment
          </Button>
        </Section>
      )}

      {cancelLink && (
        <>
          <Text style={mainText}>
            If you need to cancel, please click the button below:
          </Text>
          <Section style={buttonSection}>
            <Button href={cancelLink} variant="secondary">
              Cancel Appointment
            </Button>
          </Section>
        </>
      )}

      <Text style={mainText}>
        If you have any questions or need to reschedule, please contact us.
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

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
