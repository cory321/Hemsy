import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointments,
  getShopHours,
  updateShopHours,
  getCalendarSettings,
  updateCalendarSettings,
} from '@/lib/actions/appointments';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase/server');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Appointments Integration Tests', () => {
  const mockUserId = 'clerk_user_123';
  const mockShopId = 'shop_123';

  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId });
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Fitting Appointment',
        date: '2024-02-01',
        start_time: '10:00',
        end_time: '11:00',
        type: 'fitting' as const,
        notes: 'Test appointment',
      };

      // Mock user and shop fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
        if (table === 'appointments') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'apt_123', ...appointmentData, shop_id: mockShopId },
              error: null,
            }),
          };
        }
      });

      // Mock conflict and hours check
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // No conflict
        .mockResolvedValueOnce({ data: true, error: null }); // Within hours

      const result = await createAppointment(appointmentData);

      expect(result).toEqual({
        id: 'apt_123',
        ...appointmentData,
        shop_id: mockShopId,
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'check_appointment_conflict',
        {
          p_shop_id: mockShopId,
          p_date: appointmentData.date,
          p_start_time: appointmentData.start_time,
          p_end_time: appointmentData.end_time,
        }
      );
    });

    it('should throw error when appointment conflicts', async () => {
      const appointmentData = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Fitting',
        date: '2024-02-01',
        start_time: '10:00',
        end_time: '11:00',
        type: 'fitting' as const,
        notes: null,
      };

      // Mock user and shop fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
      });

      // Mock conflict check returns true (conflict exists)
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

      await expect(createAppointment(appointmentData)).rejects.toThrow(
        'This time slot conflicts with another appointment'
      );
    });

    it('should throw error when outside working hours', async () => {
      const appointmentData = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Late Appointment',
        date: '2024-02-01',
        start_time: '20:00',
        end_time: '21:00',
        type: 'consultation' as const,
        notes: null,
      };

      // Mock user and shop fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
      });

      // Mock checks
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // No conflict
        .mockResolvedValueOnce({ data: false, error: null }); // Outside hours

      await expect(createAppointment(appointmentData)).rejects.toThrow(
        'Appointment must be within working hours'
      );
    });
  });

  describe('getAppointments', () => {
    it('should fetch appointments for date range', async () => {
      const mockAppointments = [
        {
          id: 'apt_1',
          shop_id: mockShopId,
          client_id: 'client_1',
          title: 'Fitting',
          date: '2024-02-01',
          start_time: '10:00',
          end_time: '11:00',
          type: 'fitting',
          status: 'scheduled',
          client: {
            id: 'client_1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '555-1234',
            accept_email: true,
            accept_sms: false,
          },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
        if (table === 'appointments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockAppointments,
              error: null,
            }),
          };
        }
      });

      const result = await getAppointments('2024-02-01', '2024-02-28', 'list');

      expect(result).toEqual(mockAppointments);
      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
    });
  });

  describe('updateShopHours', () => {
    it('should update shop working hours', async () => {
      const hours = [
        {
          day_of_week: 1,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: false,
        },
        {
          day_of_week: 2,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: false,
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
        if (table === 'shop_hours') {
          return {
            upsert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
      });

      await updateShopHours(hours);

      expect(mockSupabase.from).toHaveBeenCalledWith('shop_hours');
      const shopHoursTable = mockSupabase.from.mock.results.find(
        (r) => r.value && typeof r.value.upsert === 'function'
      )!.value;
      expect(shopHoursTable.upsert).toHaveBeenCalledWith(
        hours.map((h) => ({ shop_id: mockShopId, ...h })),
        { onConflict: 'shop_id,day_of_week' }
      );
    });
  });

  describe('getCalendarSettings', () => {
    it('should fetch calendar settings', async () => {
      const mockSettings = {
        buffer_time_minutes: 15,
        default_appointment_duration: 30,
        send_reminders: true,
        reminder_hours_before: 24,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
        if (table === 'calendar_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          };
        }
      });

      const result = await getCalendarSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockUserId },
              error: null,
            }),
          };
        }
        if (table === 'shops') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockShopId },
              error: null,
            }),
          };
        }
        if (table === 'calendar_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
      });

      const result = await getCalendarSettings();

      expect(result).toEqual({
        buffer_time_minutes: 0,
        default_appointment_duration: 30,
        send_reminders: true,
        reminder_hours_before: 24,
      });
    });
  });
});
