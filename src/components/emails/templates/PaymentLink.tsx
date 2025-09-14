import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, Button } from '../components';

interface PaymentLinkProps {
  clientName: string;
  shopName: string;
  paymentLink: string;
  amount: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const PaymentLink: React.FC<PaymentLinkProps> = ({
  clientName,
  shopName,
  paymentLink,
  amount,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`Your payment link from ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        You can pay for your order using the secure payment link below:
      </Text>

      <Section style={amountSection}>
        <Text style={amountLabel}>Amount due:</Text>
        <Text style={amountValue}>{amount}</Text>
      </Section>

      <Section style={buttonSection}>
        <Button href={paymentLink} variant="primary">
          Pay Now
        </Button>
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

const amountSection = {
  backgroundColor: '#f0fdf4',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #16a34a',
};

const amountLabel = {
  fontSize: '14px',
  color: '#15803d',
  margin: '0 0 8px 0',
};

const amountValue = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#15803d',
  margin: '0',
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
