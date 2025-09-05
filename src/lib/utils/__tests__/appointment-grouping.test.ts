import {
  getAppointmentTimeDisplay,
  getAppointmentStatusColor,
} from '../appointment-grouping';
import type { Appointment } from '@/types';

describe('getAppointmentTimeDisplay', () => {
  it('should format morning times correctly', () => {
    const appointment = {
      start_time: '09:30',
      end_time: '10:00',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('9:30 AM - 10:00 AM');
  });

  it('should format afternoon times correctly', () => {
    const appointment = {
      start_time: '14:30',
      end_time: '15:45',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('2:30 PM - 3:45 PM');
  });

  it('should handle midnight correctly', () => {
    const appointment = {
      start_time: '00:00',
      end_time: '00:30',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('12:00 AM - 12:30 AM');
  });

  it('should handle noon correctly', () => {
    const appointment = {
      start_time: '12:00',
      end_time: '12:30',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('12:00 PM - 12:30 PM');
  });

  it('should handle invalid time formats gracefully', () => {
    const appointment = {
      start_time: 'invalid',
      end_time: '10:00',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('invalid - 10:00 AM');
  });

  it('should handle missing colons gracefully', () => {
    const appointment = {
      start_time: '1430',
      end_time: '1500',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('1430 - 1500');
  });

  it('should handle time with seconds (HH:MM:SS format)', () => {
    const appointment = {
      start_time: '11:15:00',
      end_time: '13:30:00',
    } as Appointment;

    expect(getAppointmentTimeDisplay(appointment)).toBe('11:15 AM - 1:30 PM');
  });
});

describe('getAppointmentStatusColor', () => {
  it('should return correct colors for different statuses', () => {
    expect(getAppointmentStatusColor('confirmed')).toBe('success');
    expect(getAppointmentStatusColor('pending')).toBe('warning');
    expect(getAppointmentStatusColor('canceled')).toBe('error');
    expect(getAppointmentStatusColor('no_show')).toBe('error');
    expect(getAppointmentStatusColor('declined')).toBe('default');
    expect(getAppointmentStatusColor('unknown')).toBe('default');
  });
});
