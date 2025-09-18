import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentRescheduledSeamstressProps {
	clientName: string;
	seamstressName: string;
	appointmentTime: string;
	previousTime: string;
	shopName?: string;
	signature?: string;
	appointmentId?: string;
}

export const AppointmentRescheduledSeamstress: React.FC<
	AppointmentRescheduledSeamstressProps
> = ({
	clientName,
	seamstressName,
	appointmentTime,
	previousTime,
	shopName = 'Hemsy',
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
			preview={`Appointment rescheduled: ${clientName}`}
			shopName={shopName}
			signature={signature}
			referenceContent={referenceContent}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Appointment Rescheduled</Text>
			</Section>

			<Text style={greeting}>Hi {seamstressName},</Text>

			<Text style={mainText}>
				Your appointment with {clientName} has been rescheduled.
			</Text>

			<Section style={appointmentSection}>
				<Text style={newTimeValue}>{appointmentTime}</Text>
				<Text style={previousTimeValue}>{previousTime}</Text>
			</Section>

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

const appointmentSection = {
	margin: '32px 0',
	padding: '24px',
	backgroundColor: '#f8fafc',
	borderRadius: '8px',
	border: '2px solid #e2e8f0',
	textAlign: 'center' as const,
};

const newTimeValue = {
	fontSize: '20px',
	fontWeight: 'bold' as const,
	color: '#1e293b',
	lineHeight: '28px',
	margin: '0 0 16px 0',
};

const previousTimeValue = {
	fontSize: '16px',
	color: '#64748b',
	lineHeight: '22px',
	margin: '0',
	textDecoration: 'line-through',
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
