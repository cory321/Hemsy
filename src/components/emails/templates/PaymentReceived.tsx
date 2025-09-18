import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface PaymentReceivedProps {
	clientName: string;
	shopName: string;
	amount: string;
	orderDetails: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
	orderId?: string;
}

export const PaymentReceived: React.FC<PaymentReceivedProps> = ({
	clientName,
	shopName,
	amount,
	orderDetails,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
	orderId,
}) => {
	// Generate unique content to prevent Gmail from trimming repetitive emails
	const uniqueId = orderId
		? orderId.slice(-8)
		: Date.now().toString().slice(-8);
	const referenceContent = `Reference: ${uniqueId} | Sent: ${new Date().toLocaleDateString()}`;
	return (
		<EmailLayout
			preview="Payment received - Thank you!"
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
			referenceContent={referenceContent}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Payment Confirmation</Text>
			</Section>

			<Text style={greeting}>Hi {clientName},</Text>

			<Section style={successSection}>
				<Text style={successTitle}>Payment Received!</Text>
				<Text style={successAmount}>{amount}</Text>
			</Section>

			<Text style={mainText}>
				We have successfully received your payment. Thank you!
			</Text>

			<Section style={orderSection}>
				<Text style={orderTitle}>Order details:</Text>
				<Text style={orderDetailsStyle}>{orderDetails}</Text>
			</Section>

			<Text style={mainText}>Thank you for your business!</Text>

			<Text style={closing}>Thank you</Text>
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

const successSection = {
	backgroundColor: '#f0fdf4',
	padding: '24px',
	borderRadius: '6px',
	margin: '24px 0',
	textAlign: 'center' as const,
	border: '1px solid #16a34a',
};

const successTitle = {
	fontSize: '20px',
	fontWeight: 'bold',
	color: '#15803d',
	margin: '0 0 12px 0',
};

const successAmount = {
	fontSize: '28px',
	fontWeight: 'bold',
	color: '#15803d',
	margin: '0',
};

const orderSection = {
	backgroundColor: '#f8fafc',
	padding: '16px',
	borderRadius: '6px',
	margin: '24px 0',
};

const orderTitle = {
	fontSize: '16px',
	fontWeight: 'bold',
	color: '#374151',
	margin: '0 0 8px 0',
};

const orderDetailsStyle = {
	fontSize: '14px',
	color: '#1a1a1a',
	margin: '0',
	whiteSpace: 'pre-line' as const,
};

const closing = {
	fontSize: '16px',
	lineHeight: '24px',
	margin: '24px 0 0 0',
	color: '#1a1a1a',
};

const headerSection = {
	padding: '24px 0',
	borderBottom: '1px solid #e6e6e6',
	marginBottom: '24px',
};

const headerText = {
	fontSize: '24px',
	fontWeight: 'bold',
	color: '#1a1a1a',
	margin: '0',
	textAlign: 'left' as const,
};
