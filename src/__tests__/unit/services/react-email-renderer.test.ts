import { ReactEmailRenderer } from '@/lib/services/email/react-email-renderer';
import { EmailType } from '@/types/email';

// Mock the @react-email/render module
jest.mock('@react-email/render', () => ({
	render: jest.fn().mockImplementation(async (component) => {
		// Mock HTML output based on component type
		if (!component) return '';
		return '<html><body><h1>Test Email</h1><p>Test content</p></body></html>';
	}),
}));

describe('ReactEmailRenderer', () => {
	let renderer: ReactEmailRenderer;

	beforeEach(() => {
		renderer = new ReactEmailRenderer();
	});

	const mockData = {
		client_name: 'John Doe',
		client_email: 'john@example.com',
		shop_name: 'Test Shop',
		shop_email: 'shop@example.com',
		shop_phone: '(555) 123-4567',
		shop_address: '123 Main St, City, ST 12345',
		appointment_time: 'Monday, March 15 at 2:00 PM',
		amount: '$125.00',
		payment_link: 'https://example.com/pay/123',
	};

	describe('render', () => {
		it('renders appointment_scheduled email', async () => {
			const result = await renderer.render('appointment_scheduled', {
				...mockData,
				confirmation_link: 'https://example.com/confirm/123',
				cancel_link: 'https://example.com/cancel/123',
			});

			expect(result.subject).toBe(
				'Your appointment is scheduled with Test Shop'
			);
			expect(result.html).toContain('<html>');
			expect(result.html).toContain('Test Email');
			expect(result.text).toContain('Test Email');
			expect(result.text).not.toContain('<');
		});

		it('renders payment_link email', async () => {
			const result = await renderer.render('payment_link', mockData);

			expect(result.subject).toBe('Your payment link from Test Shop');
			expect(result.html).toContain('<html>');
			expect(result.html).toContain('Test Email');
			expect(result.text).toContain('Test Email');
		});

		it('renders payment_received email', async () => {
			const result = await renderer.render('payment_received', {
				...mockData,
				order_details:
					'Wedding dress alterations\n- Hem adjustment\n- Waist taking in',
			});

			expect(result.subject).toBe('Payment received - Thank you!');
			expect(result.html).toContain('<html>');
			expect(result.html).toContain('Test Email');
		});

		it('throws error for truly unsupported email types', async () => {
			await expect(
				renderer.render('invalid_email_type' as EmailType, mockData)
			).rejects.toThrow('Unsupported email type: invalid_email_type');
		});

		it('generates proper subject lines', async () => {
			const testCases: Array<[EmailType, string]> = [
				[
					'appointment_scheduled',
					'Your appointment is scheduled with Test Shop',
				],
				['appointment_rescheduled', 'Your appointment has been rescheduled'],
				['appointment_canceled', 'Your appointment has been canceled'],
				['appointment_reminder', 'Appointment reminder: Test Shop'],
				['appointment_no_show', 'We missed you at Test Shop'],
				['appointment_confirmed', 'John Doe confirmed their appointment'],
				[
					'appointment_rescheduled_seamstress',
					'Appointment rescheduled: John Doe',
				],
				['appointment_canceled_seamstress', 'Appointment canceled: John Doe'],
				['payment_link', 'Your payment link from Test Shop'],
				['payment_received', 'Payment received - Thank you!'],
				['invoice_sent', 'Invoice from Test Shop'],
			];

			for (const [emailType, expectedSubject] of testCases) {
				const testData =
					emailType.includes('seamstress') ||
					emailType === 'appointment_confirmed'
						? { ...mockData, seamstress_name: 'Test Seamstress' }
						: mockData;
				const result = await renderer.render(emailType, testData);
				expect(result.subject).toBe(expectedSubject);
			}
		});

		it('handles missing optional data gracefully', async () => {
			const minimalData = {
				client_name: 'Jane Smith',
				client_email: 'jane@example.com',
				shop_name: 'Minimal Shop',
			};

			const result = await renderer.render('appointment_reminder', minimalData);

			expect(result.subject).toBe('Appointment reminder: Minimal Shop');
			expect(result.html).toContain('<html>');
			expect(result.html).toContain('Test Email');
		});
	});

	describe('htmlToText conversion', () => {
		it('converts HTML to plain text', async () => {
			const result = await renderer.render('appointment_scheduled', mockData);

			expect(result.text).not.toContain('<');
			expect(result.text).not.toContain('>');
			expect(result.text).toContain('Test Email');
		});

		it('handles HTML entities', async () => {
			const dataWithEntities = {
				...mockData,
				shop_name: 'Shop & Co',
			};

			const result = await renderer.render(
				'appointment_scheduled',
				dataWithEntities
			);

			expect(result.text).toContain('Test Email');
			expect(result.text).not.toContain('&amp;');
		});
	});
});
