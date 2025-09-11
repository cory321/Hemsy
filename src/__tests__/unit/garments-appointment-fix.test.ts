/**
 * Unit test to verify that the shop hours fix for garments page works correctly.
 * Tests the getAvailableTimeSlots function with different shop hours scenarios.
 */

import { getAvailableTimeSlots } from '@/lib/utils/calendar';

describe('Garments Appointment Fix - getAvailableTimeSlots', () => {
  // Use a future date to avoid past date filtering
  const mockDate = new Date(2025, 0, 6); // Monday January 6, 2025 in local time
  const mockCalendarSettings = {
    buffer_time_minutes: 15,
    default_appointment_duration: 60,
  };

  it('should return available slots when shop hours are properly provided (like dashboard)', () => {
    const shopHours = [
      {
        day_of_week: 1, // Monday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 2, // Tuesday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      // ... other days would be here in a real scenario
    ];

    const availableSlots = getAvailableTimeSlots(
      mockDate,
      shopHours,
      [], // No existing appointments
      60, // 1 hour duration
      15 // 15 minute buffer
    );

    // Should have time slots available
    expect(availableSlots.length).toBeGreaterThan(0);

    // Should include common business hours
    expect(availableSlots).toContain('09:00');
    expect(availableSlots).toContain('10:00');
    expect(availableSlots).toContain('14:00');

    // Should not include slots that would extend past closing time
    expect(availableSlots).not.toContain('16:30'); // Would end at 17:30, past closing
  });

  it('should return empty array when shop hours array is empty (original issue)', () => {
    const shopHours: any[] = []; // Empty array - the original problem

    const availableSlots = getAvailableTimeSlots(
      mockDate,
      shopHours,
      [], // No existing appointments
      60, // 1 hour duration
      15 // 15 minute buffer
    );

    // Should have no available slots
    expect(availableSlots).toEqual([]);
  });

  it('should return empty array when shop is closed', () => {
    const shopHours = [
      {
        day_of_week: 1, // Monday
        open_time: null,
        close_time: null,
        is_closed: true,
      },
    ];

    const availableSlots = getAvailableTimeSlots(
      mockDate,
      shopHours,
      [], // No existing appointments
      60, // 1 hour duration
      15 // 15 minute buffer
    );

    // Should have no available slots
    expect(availableSlots).toEqual([]);
  });

  it('should return empty array when no hours defined for the day', () => {
    const shopHours = [
      {
        day_of_week: 2, // Tuesday - different day
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ];

    const availableSlots = getAvailableTimeSlots(
      mockDate, // Monday, but only Tuesday hours defined
      shopHours,
      [], // No existing appointments
      60, // 1 hour duration
      15 // 15 minute buffer
    );

    // Should have no available slots since no hours for Monday
    expect(availableSlots).toEqual([]);
  });

  it('should work with default shop hours (Mon-Fri 9-5)', () => {
    // Default shop hours that the dashboard gets
    const defaultShopHours = [];
    for (let day = 0; day <= 6; day++) {
      if (day === 0 || day === 6) {
        // Sunday or Saturday - closed
        defaultShopHours.push({
          day_of_week: day,
          open_time: null,
          close_time: null,
          is_closed: true,
        });
      } else {
        // Monday to Friday - 9 AM to 5 PM
        defaultShopHours.push({
          day_of_week: day,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: false,
        });
      }
    }

    const availableSlots = getAvailableTimeSlots(
      mockDate, // Monday
      defaultShopHours,
      [], // No existing appointments
      60, // 1 hour duration
      15 // 15 minute buffer
    );

    // Should have time slots available for Monday
    expect(availableSlots.length).toBeGreaterThan(0);
    expect(availableSlots).toContain('09:00');
    expect(availableSlots).toContain('10:00');
  });
});
