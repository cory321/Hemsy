import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentCanceledProps {
	clientName: string;
	shopName: string;
	previousTime: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
	appointmentId?: string;
}

export const AppointmentCanceled: React.FC<AppointmentCanceledProps> = ({
	clientName,
	shopName,
	previousTime,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
	appointmentId,
}) => {
	// Generate unique content to prevent Gmail from trimming repetitive emails
	const uniqueId = appointmentId
		? appointmentId.slice(-8)
		: Date.now().toString().slice(-8);
	const referenceContent = `Reference: ${uniqueId} | Sent: ${new Date().toLocaleDateString()}`;
	return (
		<EmailLayout
			preview="Your appointment has been canceled"
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
			referenceContent={referenceContent}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Appointment Canceled</Text>
			</Section>

			<Text style={greeting}>Hi {clientName},</Text>

			<Text style={mainText}>
				Your appointment with {shopName} scheduled for{' '}
				<strong>{previousTime}</strong> has been canceled.
			</Text>

			<Text style={mainText}>
				If you need to reschedule, please contact us.
			</Text>

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
