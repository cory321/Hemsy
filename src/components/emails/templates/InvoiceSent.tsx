import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, Button } from '../components';

interface InvoiceSentProps {
  clientName: string;
  shopName: string;
  invoiceDetails: string;
  amount: string;
  dueDate: string;
  paymentLink?: string | undefined;
  shopEmail?: string | undefined;
  shopPhone?: string | undefined;
  shopAddress?: string | undefined;
}

export const InvoiceSent: React.FC<InvoiceSentProps> = ({
  clientName,
  shopName,
  invoiceDetails,
  amount,
  dueDate,
  paymentLink,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <EmailLayout
      preview={`Invoice from ${shopName}`}
      shopName={shopName}
      shopEmail={shopEmail}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
    >
      <Text style={greeting}>Hi {clientName},</Text>

      <Text style={mainText}>
        Please find your invoice for the following services:
      </Text>

      <Section style={invoiceSection}>
        <Text style={invoiceTitle}>Services:</Text>
        <Text style={invoiceDetailsStyle}>{invoiceDetails}</Text>

        <Section style={amountSection}>
          <Text style={amountLabel}>Total amount due:</Text>
          <Text style={amountValue}>{amount}</Text>
        </Section>

        <Text style={dueDateStyle}>
          Due date: <strong>{dueDate}</strong>
        </Text>
      </Section>

      {paymentLink && (
        <>
          <Text style={mainText}>
            You can pay securely using the link below:
          </Text>
          <Section style={buttonSection}>
            <Button href={paymentLink} variant="primary">
              Pay Invoice
            </Button>
          </Section>
        </>
      )}

      <Text style={mainText}>
        If you have any questions about this invoice, please contact us.
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

const invoiceSection = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const invoiceTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 12px 0',
};

const invoiceDetailsStyle = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0 0 20px 0',
  whiteSpace: 'pre-line' as const,
};

const amountSection = {
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '4px',
  margin: '16px 0',
  textAlign: 'center' as const,
  border: '1px solid #d1d5db',
};

const amountLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const amountValue = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
};

const dueDateStyle = {
  fontSize: '14px',
  color: '#dc2626',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
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
