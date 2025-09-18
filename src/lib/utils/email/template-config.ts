import { EmailType } from '@/types/email';

export interface EditableSection {
	id: string;
	label: string;
	defaultContent: string;
	allowVariables: boolean;
	maxLength?: number;
	required?: boolean;
}

export interface EmailTemplateConfig {
	emailType: EmailType;
	editableSections: EditableSection[];
	nonEditableSections: string[];
	preview?: {
		clientName: string;
		shopName: string;
		appointmentTime?: string;
		amount?: string;
		// Add other preview data as needed
	};
}

export const EMAIL_TEMPLATE_CONFIGS: Record<EmailType, EmailTemplateConfig> = {
	appointment_scheduled: {
		emailType: 'appointment_scheduled',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'introduction',
				label: 'Introduction',
				defaultContent: 'Your appointment with {shop_name} is scheduled for:',
				allowVariables: true,
				maxLength: 200,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent:
					'If you have any questions or need to reschedule, please contact us.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['appointment_datetime', 'action_buttons'],
		preview: {
			clientName: 'Jane Smith',
			shopName: "Sam's Alterations",
			appointmentTime: 'Monday, Jan 15 at 2:00 PM',
		},
	},

	appointment_rescheduled: {
		emailType: 'appointment_rescheduled',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent:
					'Your appointment with {shop_name} has been rescheduled.',
				allowVariables: true,
				maxLength: 200,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent:
					'If you have any questions or concerns, please contact us.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['previous_time', 'new_time', 'action_buttons'],
	},

	appointment_canceled: {
		emailType: 'appointment_canceled',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent: 'Your appointment with {shop_name} has been canceled.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent:
					'We apologize for any inconvenience. Please contact us to reschedule.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['canceled_appointment_time'],
	},

	appointment_reminder: {
		emailType: 'appointment_reminder',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent:
					'This is a friendly reminder about your upcoming appointment with {shop_name}.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent: 'We look forward to seeing you!',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['appointment_datetime'],
	},

	invoice_sent: {
		emailType: 'invoice_sent',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'introduction',
				label: 'Introduction',
				defaultContent: 'Please find your invoice for the following services:',
				allowVariables: false,
				maxLength: 200,
			},
			{
				id: 'payment_message',
				label: 'Payment Message',
				defaultContent: 'You can pay securely using the link below:',
				allowVariables: false,
				maxLength: 200,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent:
					'If you have any questions about this invoice, please contact us.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: [
			'invoice_details',
			'amount_section',
			'due_date',
			'payment_button',
		],
	},

	payment_received: {
		emailType: 'payment_received',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent: 'Thank you! We have received your payment of {amount}.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent: 'Your order details are shown below.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['order_details', 'amount_paid'],
	},

	payment_link: {
		emailType: 'payment_link',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent:
					'You have an outstanding balance of {amount} with {shop_name}.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'payment_message',
				label: 'Payment Message',
				defaultContent:
					'Please use the secure link below to make your payment:',
				allowVariables: false,
				maxLength: 200,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['payment_button', 'amount_due'],
	},

	appointment_no_show: {
		emailType: 'appointment_no_show',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent:
					'We missed you at your appointment today with {shop_name}.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent: 'Please contact us to reschedule your appointment.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['missed_appointment_time'],
	},

	appointment_confirmed: {
		emailType: 'appointment_confirmed',
		editableSections: [
			{
				id: 'header',
				label: 'Header',
				defaultContent: '{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {client_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent: 'Thank you for confirming your appointment!',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'footer_message',
				label: 'Footer Message',
				defaultContent: 'We look forward to seeing you.',
				allowVariables: false,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Thank you,\n{shop_name}',
				allowVariables: true,
				maxLength: 100,
			},
		],
		nonEditableSections: ['appointment_datetime'],
	},

	appointment_rescheduled_seamstress: {
		emailType: 'appointment_rescheduled_seamstress',
		editableSections: [
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {seamstress_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent: '{client_name} has rescheduled their appointment.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Hemsy Notifications',
				allowVariables: false,
				maxLength: 100,
			},
		],
		nonEditableSections: ['previous_time', 'new_time'],
	},

	appointment_canceled_seamstress: {
		emailType: 'appointment_canceled_seamstress',
		editableSections: [
			{
				id: 'greeting',
				label: 'Greeting',
				defaultContent: 'Hi {seamstress_name},',
				allowVariables: true,
				maxLength: 100,
			},
			{
				id: 'message',
				label: 'Message',
				defaultContent: '{client_name} has canceled their appointment.',
				allowVariables: true,
				maxLength: 300,
			},
			{
				id: 'closing',
				label: 'Closing',
				defaultContent: 'Hemsy Notifications',
				allowVariables: false,
				maxLength: 100,
			},
		],
		nonEditableSections: ['canceled_appointment_time'],
	},
};

// Helper function to get config for a specific email type
export function getEmailTemplateConfig(
	emailType: EmailType
): EmailTemplateConfig | undefined {
	return EMAIL_TEMPLATE_CONFIGS[emailType];
}

// Helper function to get default content for all sections
export function getDefaultSectionContent(
	emailType: EmailType
): Record<string, string> {
	const config = EMAIL_TEMPLATE_CONFIGS[emailType];
	if (!config) return {};

	return config.editableSections.reduce(
		(acc, section) => {
			acc[section.id] = section.defaultContent;
			return acc;
		},
		{} as Record<string, string>
	);
}
