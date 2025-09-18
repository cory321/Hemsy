import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, PreviewButton } from '../components';

interface PaymentLinkPreviewProps {
	clientName: string;
	shopName: string;
	amount: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
	orderId?: string;
}

export const PaymentLinkPreview: React.FC<PaymentLinkPreviewProps> = ({
	clientName,
	shopName,
	amount,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
	orderId,
}) => {
	// Generate unique content to prevent Gmail from trimming repetitive emails
	const uniqueId = orderId ? orderId.slice(-8) : 'PREVIEW123';
	const referenceContent = `Reference: ${uniqueId} | Sent: ${new Date().toLocaleDateString()}`;
	return (
		<EmailLayout
			preview={`Your payment link from ${shopName}`}
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
			referenceContent={referenceContent}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Payment Request</Text>
			</Section>

			<Text style={greeting}>Hi {clientName},</Text>

			<Text style={mainText}>
				You can pay for your order using the secure payment link below:
			</Text>

			<Section style={amountSection}>
				<Text style={amountLabel}>Amount due:</Text>
				<Text style={amountValue}>{amount}</Text>
			</Section>

			<Section style={buttonSection}>
				<PreviewButton variant="primary">Pay Now</PreviewButton>
			</Section>

			<Text style={mainText}>
				If you have any questions, please contact us.
			</Text>

			<Text style={closing}>Thank you</Text>
		</EmailLayout>
	);
};

// Styles (same as PaymentLink.tsx)
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
