import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, PreviewButton } from '../components';

interface AppointmentRescheduledPreviewProps {
	clientName: string;
	shopName: string;
	appointmentTime: string;
	previousTime: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
}

export const AppointmentRescheduledPreview: React.FC<
	AppointmentRescheduledPreviewProps
> = ({
	clientName,
	shopName,
	appointmentTime,
	previousTime,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
}) => {
	return (
		<EmailLayout
			preview="Your appointment has been rescheduled"
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>Appointment Rescheduled</Text>
			</Section>

			<Text style={greeting}>Hi {clientName},</Text>

			<Text style={mainText}>
				Your appointment with {shopName} has been rescheduled. Please confirm
				the date and time below.
			</Text>

			<Section style={appointmentSection}>
				<Text style={newTimeValue}>{appointmentTime}</Text>
				<Text style={previousTimeValue}>{previousTime}</Text>
			</Section>

			<Section style={buttonRowSection}>
				<table
					style={{
						width: '100%',
						borderCollapse: 'collapse' as const,
						margin: '0 auto',
					}}
				>
					<tbody>
						<tr>
							<td style={{ textAlign: 'center', padding: '0 8px' }}>
								<PreviewButton variant="muted-green">
									Confirm Appointment
								</PreviewButton>
							</td>
							<td style={{ textAlign: 'center', padding: '0 8px' }}>
								<PreviewButton variant="muted-red">
									Decline Appointment
								</PreviewButton>
							</td>
						</tr>
					</tbody>
				</table>
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

const buttonRowSection = {
	margin: '32px 0',
};
