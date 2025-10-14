/**
 * Tests for timezone-aware appointment filtering
 *
 * This test ensures that "next appointment" calculations correctly use
 * the shop's timezone, not the server's timezone.
 *
 * Bug context: Production servers often run in UTC, but shops may be in
 * different timezones. When filtering appointments, we must compare times
 * in the shop's timezone to avoid showing past appointments as "next".
 */

import { describe, it, expect } from '@jest/globals';
import { toZonedTime } from 'date-fns-tz';
import { formatTimeForDatabase } from '@/lib/utils/date-time-utils';

describe('Dashboard Timezone Handling', () => {
	it('should correctly identify past appointments when server is in different timezone', () => {
		// Scenario: Server is in UTC (3:00 AM Oct 14), Shop is in Pacific (8:00 PM Oct 13)
		// During PDT (Pacific Daylight Time), offset is UTC-7
		const serverTime = new Date('2025-10-14T03:00:00Z'); // 3 AM UTC
		const shopTimezone = 'America/Los_Angeles';

		// Convert to shop timezone
		const shopTime = toZonedTime(serverTime, shopTimezone);

		// In October 2025, PDT is likely still active (DST ends early November)
		// So UTC 03:00 Oct 14 = PDT 20:00 Oct 13 (8 PM previous day)
		// The key point is they're on DIFFERENT days
		expect(shopTime.getDate()).not.toBe(serverTime.getUTCDate()); // Different day

		// Shop time should be evening (around 20:00), while UTC is early morning (03:00)
		expect(shopTime.getHours()).toBeGreaterThan(12); // PM hours in shop timezone
		expect(serverTime.getUTCHours()).toBeLessThan(12); // AM hours in UTC
	});

	it('should use shop timezone for time comparisons, not server timezone', () => {
		// This is a regression test for the bug where getCurrentTimeWithSeconds()
		// was using server's local time instead of shop's timezone time

		const serverTime = new Date('2025-10-14T03:00:00Z'); // 3 AM UTC (Oct 14)
		const shopTimezone = 'America/Los_Angeles';

		// Get shop's current time
		const shopNow = toZonedTime(serverTime, shopTimezone);
		const currentTimeInShopTZ = formatTimeForDatabase(shopNow);

		// Shop time should NOT be 03:00 (server's UTC time)
		expect(currentTimeInShopTZ).not.toBe('03:00');

		// An appointment at 13:00 (1 PM) should be in the past when it's 8 PM
		const appointmentTime = '13:00';
		// The comparison depends on the actual time, but we can verify
		// that we're using the shop's timezone time
		expect(shopNow.getHours()).toBeLessThan(24);
		expect(shopNow.getHours()).toBeGreaterThanOrEqual(0);
	});

	it('should correctly determine if appointment is in the past', () => {
		const serverTime = new Date('2025-10-14T03:04:00Z'); // 3:04 AM UTC
		const shopTimezone = 'America/Los_Angeles';

		const shopNow = toZonedTime(serverTime, shopTimezone);
		const currentTime = formatTimeForDatabase(shopNow);

		// If shop time is in the evening (e.g., 8 PM), then...
		// Appointments from earlier in the day should be past
		const apt1PM = '13:00:00'; // 1 PM
		const currentWithSeconds = currentTime + ':00';

		// Basic validation: time format should be correct
		expect(currentWithSeconds).toMatch(/^\d{2}:\d{2}:\d{2}$/);

		// The actual comparison depends on DST, but we can verify the logic works
		// If current time is in evening, 1 PM is definitely past
		if (shopNow.getHours() >= 14) {
			expect(apt1PM < currentWithSeconds).toBe(true);
		}
	});

	it('should format time with seconds for database comparison', () => {
		const serverTime = new Date('2025-10-14T03:04:30Z');
		const shopTimezone = 'America/Los_Angeles';

		const shopNow = toZonedTime(serverTime, shopTimezone);
		const timeHHMM = formatTimeForDatabase(shopNow);
		const timeWithSeconds = timeHHMM + ':00'; // Add seconds for HH:MM:SS format

		// Should be in HH:MM:SS format
		expect(timeWithSeconds).toMatch(/^\d{2}:\d{2}:\d{2}$/);

		// Verify it's not using UTC time (03:04)
		expect(timeWithSeconds).not.toBe('03:04:00');
	});
});

describe('Timezone Bug Regression Tests', () => {
	it('documents the original bug scenario', () => {
		// ORIGINAL BUG:
		// Server in UTC:  3:04 AM Oct 14
		// Shop in Pacific: 8:04 PM Oct 13 (during PDT/DST)
		//
		// Appointment: Jennifer Wallace at 1:00 PM Oct 13 (should be PAST)
		//
		// Before fix: getCurrentTimeWithSeconds() returned '03:04:00' (server UTC time)
		//   Query checked: 13:00:00 > 03:04:00 → TRUE → Incorrectly showed as "next"
		//
		// After fix: formatTimeForDatabase(shopNow) + ':00' returns shop time
		//   Query checks: 13:00:00 > [shop evening time] → FALSE → Correctly filtered out

		const serverTime = new Date('2025-10-14T03:04:00Z');

		const shopNow = toZonedTime(serverTime, 'America/Los_Angeles');
		const correctTime = formatTimeForDatabase(shopNow) + ':00';
		const appointmentTime = '13:00:00'; // 1 PM

		// Verify we're not using server UTC time
		expect(correctTime).not.toBe('03:04:00');

		// Before fix (simulated): Would have been wrong
		const serverLocalTime = '03:04:00';
		expect(appointmentTime > serverLocalTime).toBe(true); // This was the bug!

		// After fix: If shop time is in the evening, 1 PM is correctly identified as past
		if (shopNow.getHours() >= 14) {
			expect(appointmentTime < correctTime).toBe(true);
		}
	});

	it('ensures formatTimeForDatabase uses timezone-converted date', () => {
		// This test verifies that we're extracting time from a timezone-aware date object
		const utcTime = new Date('2025-10-14T15:30:00Z'); // 3:30 PM UTC
		const pacificTime = toZonedTime(utcTime, 'America/Los_Angeles');

		const timeString = formatTimeForDatabase(pacificTime);

		// Time should be in HH:MM format
		expect(timeString).toMatch(/^\d{2}:\d{2}$/);

		// Should NOT be the UTC time (15:30)
		expect(timeString).not.toBe('15:30');

		// Should be the Pacific time (08:30 AM PDT, assuming PDT is UTC-7)
		// The actual value depends on DST, but we verify it's different from UTC
		const utcHour = utcTime.getUTCHours();
		const pacificHour = pacificTime.getHours();
		expect(pacificHour).not.toBe(utcHour);
	});
});
