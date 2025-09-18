import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentCanceledSeamstressProps {
	clientName: string;
	seamstressName: string;
	previousTime: string;
	shopName?: string;
	signature?: string;
}

export const AppointmentCanceledSeamstress: React.FC<
	AppointmentCanceledSeamstressProps
> = ({
	clientName,
	seamstressName,
	previousTime,
	shopName = 'Hemsy',
	signature,
}) => {
	return (
		<EmailLayout
			preview={`Appointment canceled: ${clientName}`}
			shopName={shopName}
			signature={signature}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Appointment Canceled</Text>
			</Section>

			<Text style={greeting}>Hi {seamstressName},</Text>

			<Text style={mainText}>
				Your appointment with {clientName} scheduled for{' '}
				<strong>{previousTime}</strong> has been canceled.
			</Text>

			<Text style={closing}>Sent from Hemsy</Text>
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
