import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentCanceledProps {
  clientName: string;
  shopName: string;
  previousTime: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const AppointmentCanceled: React.FC<AppointmentCanceledProps> = ({
  clientName,
  shopName,
  previousTime,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview="Your appointment has been canceled"
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        Your appointment with {shopName} scheduled for{' '}
        <strong>{previousTime}</strong> has been canceled.
      </Text>

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

const closing = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
  color: '#1a1a1a',
};
