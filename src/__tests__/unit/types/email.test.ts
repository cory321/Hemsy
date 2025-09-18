import { isEmailType, isEmailStatus } from '@/types/email';

describe('Email Type Guards', () => {
	describe('isEmailType', () => {
		it('returns true for valid email types', () => {
			expect(isEmailType('appointment_scheduled')).toBe(true);
			expect(isEmailType('appointment_rescheduled')).toBe(true);
			expect(isEmailType('appointment_canceled')).toBe(true);
			expect(isEmailType('payment_link')).toBe(true);
			expect(isEmailType('appointment_confirmed')).toBe(true);
		});

		it('returns false for invalid email types', () => {
			expect(isEmailType('invalid_type')).toBe(false);
			expect(isEmailType('')).toBe(false);
			expect(isEmailType('APPOINTMENT_SCHEDULED')).toBe(false);
			expect(isEmailType('appointment_schedule')).toBe(false);
		});
	});

	describe('isEmailStatus', () => {
		it('returns true for valid statuses', () => {
			expect(isEmailStatus('pending')).toBe(true);
			expect(isEmailStatus('sent')).toBe(true);
			expect(isEmailStatus('failed')).toBe(true);
			expect(isEmailStatus('bounced')).toBe(true);
			expect(isEmailStatus('complained')).toBe(true);
		});

		it('returns false for invalid statuses', () => {
			expect(isEmailStatus('delivered')).toBe(false);
			expect(isEmailStatus('')).toBe(false);
			expect(isEmailStatus('SENT')).toBe(false);
			expect(isEmailStatus('success')).toBe(false);
		});
	});
});
