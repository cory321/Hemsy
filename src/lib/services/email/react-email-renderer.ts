import { render } from '@react-email/render';
import { EmailType } from '@/types/email';
import {
	AppointmentScheduled,
	AppointmentScheduledPreview,
	AppointmentRescheduled,
	AppointmentRescheduledPreview,
	AppointmentCanceled,
	AppointmentReminder,
	AppointmentNoShow,
	AppointmentConfirmed,
	AppointmentRescheduledSeamstress,
	AppointmentCanceledSeamstress,
	PaymentLink,
	PaymentLinkPreview,
	PaymentReceived,
	InvoiceSent,
} from '@/components/emails/templates';

interface EmailData {
	// Client info
	client_name: string;
	client_email: string;
	client_phone?: string;

	// Shop info
	shop_name: string;
	shop_email?: string;
	shop_phone?: string;
	shop_address?: string;
	shop_signature?: string;

	// Appointment info
	appointment_time?: string;
	previous_time?: string;
	appointment_id?: string;

	// Payment info
	amount?: string;
	payment_link?: string;
	order_details?: string;
	invoice_details?: string;
	due_date?: string;

	// Links
	confirmation_link?: string;
	cancel_link?: string;

	// Other
	seamstress_name?: string;
}

interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

export class ReactEmailRenderer {
	async render(
		emailType: EmailType,
		data: Record<string, any>
	): Promise<RenderedEmail> {
		const component = this.getEmailComponent(emailType, data);
		const subject = this.getSubject(emailType, data);

		// Render to HTML
		const html = await render(component as React.ReactElement);

		// Generate text version (basic conversion)
		const text = this.htmlToText(html);

		return {
			subject,
			html,
			text,
		};
	}

	private getEmailComponent(emailType: EmailType, data: Record<string, any>) {
		const props = {
			clientName: data.client_name,
			shopName: data.shop_name,
			shopEmail: data.shop_email,
			shopPhone: data.shop_phone,
			shopAddress: data.shop_address,
			signature: data.shop_signature,
			appointmentId: data.appointment_id,
		};

		switch (emailType) {
			case 'appointment_scheduled':
				// Use preview template if preview flag is set
				if (data.preview) {
					return AppointmentScheduledPreview({
						...props,
						appointmentTime: data.appointment_time || '',
					});
				}
				return AppointmentScheduled({
					...props,
					appointmentTime: data.appointment_time || '',
					confirmationLink: data.confirmation_link,
					cancelLink: data.cancel_link,
				});

			case 'appointment_rescheduled':
				// Use preview template if preview flag is set
				if (data.preview) {
					return AppointmentRescheduledPreview({
						...props,
						appointmentTime: data.appointment_time || '',
						previousTime: data.previous_time || '',
					});
				}
				return AppointmentRescheduled({
					...props,
					appointmentTime: data.appointment_time || '',
					previousTime: data.previous_time || '',
					confirmationLink: data.confirmation_link,
					cancelLink: data.cancel_link,
				});

			case 'appointment_canceled':
				return AppointmentCanceled({
					...props,
					previousTime: data.previous_time || '',
				});

			case 'appointment_reminder':
				return AppointmentReminder({
					...props,
					appointmentTime: data.appointment_time || '',
				});

			case 'payment_link':
				// Use preview template if preview flag is set
				if (data.preview) {
					return PaymentLinkPreview({
						...props,
						amount: data.amount || '',
					});
				}
				return PaymentLink({
					...props,
					paymentLink: data.payment_link || '',
					amount: data.amount || '',
				});

			case 'payment_received':
				return PaymentReceived({
					...props,
					amount: data.amount || '',
					orderDetails: data.order_details || '',
				});

			case 'invoice_sent':
				return InvoiceSent({
					...props,
					invoiceDetails: data.invoice_details || '',
					amount: data.amount || '',
					dueDate: data.due_date || '',
					paymentLink: data.payment_link,
				});

			case 'appointment_no_show':
				return AppointmentNoShow({
					...props,
					appointmentTime: data.appointment_time || '',
				});

			case 'appointment_confirmed':
				return AppointmentConfirmed({
					clientName: data.client_name,
					seamstressName: data.seamstress_name || 'Seamstress',
					appointmentTime: data.appointment_time || '',
					shopName: 'Hemsy',
				});

			case 'appointment_rescheduled_seamstress':
				return AppointmentRescheduledSeamstress({
					clientName: data.client_name,
					seamstressName: data.seamstress_name || 'Seamstress',
					appointmentTime: data.appointment_time || '',
					previousTime: data.previous_time || '',
					shopName: 'Hemsy',
				});

			case 'appointment_canceled_seamstress':
				return AppointmentCanceledSeamstress({
					clientName: data.client_name,
					seamstressName: data.seamstress_name || 'Seamstress',
					previousTime: data.previous_time || '',
					shopName: 'Hemsy',
				});

			default:
				throw new Error(`Unsupported email type: ${emailType}`);
		}
	}

	private getSubject(emailType: EmailType, data: Record<string, any>): string {
		const shopName = data.shop_name;
		const clientName = data.client_name;

		switch (emailType) {
			case 'appointment_scheduled':
				return `Your appointment is scheduled with ${shopName}`;
			case 'appointment_rescheduled':
				return 'Your appointment has been rescheduled';
			case 'appointment_canceled':
				return 'Your appointment has been canceled';
			case 'appointment_reminder':
				return `Appointment reminder: ${shopName}`;
			case 'payment_link':
				return `Your payment link from ${shopName}`;
			case 'payment_received':
				return 'Payment received - Thank you!';
			case 'invoice_sent':
				return `Invoice from ${shopName}`;
			case 'appointment_no_show':
				return `We missed you at ${shopName}`;
			case 'appointment_rescheduled_seamstress':
				return `Appointment rescheduled: ${clientName}`;
			case 'appointment_canceled_seamstress':
				return `Appointment canceled: ${clientName}`;
			case 'appointment_confirmed':
				return `${clientName} confirmed their appointment`;
			default:
				return `Message from ${shopName}`;
		}
	}

	private htmlToText(html: string): string {
		// Basic HTML to text conversion
		return html
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
			.replace(/&amp;/g, '&') // Replace HTML entities
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
			.trim();
	}
}
