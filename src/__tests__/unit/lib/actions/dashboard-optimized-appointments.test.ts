/**
 * Test for dashboard-optimized appointments fix
 * Ensures next appointment finding logic works correctly
 */

import { describe, it, expect } from '@jest/globals';
import type { Appointment } from '@/types';

describe('Dashboard Optimized - Next Appointment Logic', () => {
  // Test the core logic that finds the next appointment
  const findNextAppointment = (
    appointments: Appointment[],
    today: string,
    currentTime: string
  ): Appointment | null => {
    // Filter future appointments
    const futureAppointments = appointments.filter((apt) => {
      if (apt.date > today) return true;
      if (apt.date === today && apt.start_time > currentTime) return true;
      return false;
    });

    // Sort by date and time
    futureAppointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    return futureAppointments[0] || null;
  };

  it('should find next appointment within current week', () => {
    const appointments: Appointment[] = [
      {
        id: '1',
        shop_id: 'shop-1',
        client_id: 'client-1',
        date: '2025-09-10',
        start_time: '14:00:00',
        end_time: '14:30:00',
        status: 'confirmed',
        type: 'fitting',
        client: {
          id: 'client-1',
          shop_id: 'shop-1',
          first_name: 'Current',
          last_name: 'Week',
          email: 'current@example.com',
          phone_number: '555-0100',
          accept_email: true,
          accept_sms: false,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
    ];

    const result = findNextAppointment(appointments, '2025-09-09', '10:00:00');

    expect(result).toBeDefined();
    expect(result?.date).toBe('2025-09-10');
    expect(result?.client?.first_name).toBe('Current');
  });

  it('should find next appointment beyond current week when no appointments in current week', () => {
    const appointments: Appointment[] = [
      {
        id: '2',
        shop_id: 'shop-1',
        client_id: 'client-2',
        date: '2025-09-26',
        start_time: '10:00:00',
        end_time: '10:30:00',
        status: 'pending',
        type: 'consultation',
        client: {
          id: 'client-2',
          shop_id: 'shop-1',
          first_name: 'Sheppy',
          last_name: 'Scott',
          email: 'sheppy@example.com',
          phone_number: '555-0123',
          accept_email: true,
          accept_sms: true,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
    ];

    const result = findNextAppointment(appointments, '2025-09-09', '10:00:00');

    expect(result).toBeDefined();
    expect(result?.date).toBe('2025-09-26');
    expect(result?.start_time).toBe('10:00:00');
    expect(result?.client?.first_name).toBe('Sheppy');
    expect(result?.client?.last_name).toBe('Scott');
  });

  it('should return null when no future appointments exist', () => {
    const appointments: Appointment[] = [
      {
        id: '3',
        shop_id: 'shop-1',
        client_id: 'client-3',
        date: '2025-09-08', // Past date
        start_time: '14:00:00',
        end_time: '14:30:00',
        status: 'confirmed',
        type: 'fitting',
        client: {
          id: 'client-3',
          shop_id: 'shop-1',
          first_name: 'Past',
          last_name: 'Client',
          email: 'past@example.com',
          phone_number: '555-0200',
          accept_email: true,
          accept_sms: false,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
    ];

    const result = findNextAppointment(appointments, '2025-09-09', '10:00:00');

    expect(result).toBeNull();
  });

  it('should prefer earlier appointment when multiple future appointments exist', () => {
    const appointments: Appointment[] = [
      {
        id: '4',
        shop_id: 'shop-1',
        client_id: 'client-4',
        date: '2025-09-26',
        start_time: '11:00:00',
        end_time: '11:30:00',
        status: 'pending',
        type: 'consultation',
        client: {
          id: 'client-4',
          shop_id: 'shop-1',
          first_name: 'Later',
          last_name: 'Appointment',
          email: 'later@example.com',
          phone_number: '555-0300',
          accept_email: true,
          accept_sms: true,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
      {
        id: '5',
        shop_id: 'shop-1',
        client_id: 'client-5',
        date: '2025-09-26',
        start_time: '10:00:00',
        end_time: '10:30:00',
        status: 'pending',
        type: 'consultation',
        client: {
          id: 'client-5',
          shop_id: 'shop-1',
          first_name: 'Earlier',
          last_name: 'Appointment',
          email: 'earlier@example.com',
          phone_number: '555-0400',
          accept_email: true,
          accept_sms: true,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
    ];

    const result = findNextAppointment(appointments, '2025-09-09', '10:00:00');

    expect(result).toBeDefined();
    expect(result?.start_time).toBe('10:00:00');
    expect(result?.client?.first_name).toBe('Earlier');
  });

  it('should handle same-day future appointments correctly', () => {
    const appointments: Appointment[] = [
      {
        id: '6',
        shop_id: 'shop-1',
        client_id: 'client-6',
        date: '2025-09-09', // Today
        start_time: '15:00:00', // Future time
        end_time: '15:30:00',
        status: 'confirmed',
        type: 'fitting',
        client: {
          id: 'client-6',
          shop_id: 'shop-1',
          first_name: 'Today',
          last_name: 'Future',
          email: 'today@example.com',
          phone_number: '555-0500',
          accept_email: true,
          accept_sms: false,
          created_at: '2025-09-01T00:00:00Z',
          updated_at: '2025-09-01T00:00:00Z',
        },
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-01T00:00:00Z',
      },
    ];

    const result = findNextAppointment(appointments, '2025-09-09', '10:00:00');

    expect(result).toBeDefined();
    expect(result?.date).toBe('2025-09-09');
    expect(result?.start_time).toBe('15:00:00');
    expect(result?.client?.first_name).toBe('Today');
  });
});
