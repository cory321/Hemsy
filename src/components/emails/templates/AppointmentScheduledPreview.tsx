import React from 'react';
import { Text, Section } from '@react-email/components';
import { EmailLayout, PreviewButton } from '../components';

interface AppointmentScheduledPreviewProps {
	clientName: string;
	shopName: string;
	appointmentTime: string;
	shopEmail?: string;
	shopPhone?: string;
	shopAddress?: string;
	signature?: string;
	appointmentId?: string;
}

export const AppointmentScheduledPreview: React.FC<
	AppointmentScheduledPreviewProps
> = ({
	clientName,
	shopName,
	appointmentTime,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
	appointmentId,
}) => {
	// Generate unique content to prevent Gmail from trimming repetitive emails
	const uniqueId = appointmentId ? appointmentId.slice(-8) : 'PREVIEW123';

	// Default content with variable substitution
	const content = {
		header: 'Appointment Scheduled',
		greeting: 'Hi {client_name},'.replace('{client_name}', clientName),
		introduction: (
			<>
				Your appointment with <strong>{shopName}</strong> has been scheduled.
				Please confirm the date and time below.
			</>
		),
		// Add unique content to prevent Gmail trimming (moved to footer)
		referenceContent: `Reference: ${uniqueId} | Sent: ${new Date().toLocaleDateString()}`,
		footer_message:
			'If you have any questions or need to reschedule, please contact us.',
		closing: 'Thank you',
	};

	return (
		<EmailLayout
			preview={`Your appointment is scheduled with ${shopName}`}
			shopName={shopName}
			shopEmail={shopEmail}
			shopPhone={shopPhone}
			shopAddress={shopAddress}
			signature={signature}
			referenceContent={content.referenceContent}
		>
			{/* Custom Header */}
			<Section style={headerSection}>
				<Text style={headerText}>{content.header}</Text>
			</Section>

			<Text style={greeting}>{content.greeting}</Text>

			<Text style={mainText}>{content.introduction}</Text>

			<Section style={appointmentSection}>
				<Text style={appointmentDateTime}>{appointmentTime}</Text>
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

			<Text style={mainText}>{content.footer_message}</Text>

			<Text style={closing}>
				{content.closing.split('\n').map((line, index) => (
					<React.Fragment key={index}>
						{line}
						{index < content.closing.split('\n').length - 1 && <br />}
					</React.Fragment>
				))}
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

const buttonSection = {
	margin: '24px 0',
	textAlign: 'center' as const,
};

const appointmentSection = {
	margin: '32px 0',
	padding: '24px',
	backgroundColor: '#f8fafc',
	borderRadius: '8px',
	border: '2px solid #e2e8f0',
	textAlign: 'center' as const,
};

const appointmentDateTime = {
	fontSize: '20px',
	fontWeight: 'bold',
	color: '#1e293b',
	lineHeight: '28px',
	margin: '0',
};

const buttonRowSection = {
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
