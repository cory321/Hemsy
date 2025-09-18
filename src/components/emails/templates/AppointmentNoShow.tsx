import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout } from '../components';

interface AppointmentNoShowProps {
	clientName: string;
	shopName: string;
	appointmentTime: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
}

export const AppointmentNoShow: React.FC<AppointmentNoShowProps> = ({
	clientName,
	shopName,
	appointmentTime,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
}) => {
	return (
		<EmailLayout
			preview={`We missed you at ${shopName}`}
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Missed Appointment</Text>
			</Section>

			<Text style={greeting}>Hi {clientName},</Text>

			<Text style={mainText}>
				We&apos;re sorry we missed you for your appointment with {shopName} on{' '}
				<strong>{appointmentTime}</strong>.
			</Text>

			<Text style={mainText}>
				Please contact us to reschedule your appointment.
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

const missedSection = {
	backgroundColor: '#fef2f2',
	padding: '24px',
	borderRadius: '6px',
	margin: '24px 0',
	textAlign: 'center' as const,
	border: '1px solid #fecaca',
};

const missedIcon = {
	fontSize: '32px',
	margin: '0 0 8px 0',
};

const missedTitle = {
	fontSize: '20px',
	fontWeight: 'bold',
	color: '#dc2626',
	margin: '0',
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
