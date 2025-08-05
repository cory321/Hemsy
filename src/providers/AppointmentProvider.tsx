'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import {
  appointmentReducer,
  initialAppointmentState,
  AppointmentState,
  AppointmentActionType,
  AppointmentAction,
} from '@/lib/reducers/appointments-reducer';
import {
  getAppointmentsByTimeRange,
  createAppointment as createAppointmentAction,
  updateAppointment as updateAppointmentAction,
  CreateAppointmentData,
  UpdateAppointmentData,
} from '@/lib/actions/appointments-refactored';
import { Appointment } from '@/types';
import {
  calculateDateRange,
  CalendarView,
} from '@/lib/queries/appointment-keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface AppointmentContextValue {
  state: AppointmentState;
  dispatch: React.Dispatch<AppointmentAction>;

  // Data fetching
  loadAppointments: (
    shopId: string,
    dateRange: { startDate: string; endDate: string }
  ) => Promise<void>;

  // CRUD operations
  createAppointment: (
    shopId: string,
    data: CreateAppointmentData
  ) => Promise<void>;

  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<void>;

  cancelAppointment: (id: string) => Promise<void>;

  // Helpers
  getAppointmentsForDateRange: (
    startDate: string,
    endDate: string
  ) => Appointment[];

  isDateRangeLoaded: (startDate: string, endDate: string) => boolean;

  clearStaleData: () => void;
}

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
}

interface AppointmentProviderProps {
  children: React.ReactNode;
  shopId: string;
}

export function AppointmentProvider({
  children,
  shopId,
}: AppointmentProviderProps) {
  const [state, dispatch] = useReducer(
    appointmentReducer,
    initialAppointmentState
  );
  const queryClient = useQueryClient();
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);

  // Load appointments for a date range
  const loadAppointments = useCallback(
    async (
      shopId: string,
      dateRange: { startDate: string; endDate: string }
    ) => {
      const requestId = uuidv4();

      // Check if we already have fresh data for this range
      const existingRange = state.loadedRanges.find(
        (r) =>
          r.startDate <= dateRange.startDate &&
          r.endDate >= dateRange.endDate &&
          r.staleAt > Date.now()
      );

      if (existingRange) {
        // Data is already loaded and fresh
        return;
      }

      dispatch({
        type: AppointmentActionType.LOAD_APPOINTMENTS_START,
        payload: { dateRange, requestId },
      });

      try {
        const appointments = await getAppointmentsByTimeRange(
          shopId,
          dateRange.startDate,
          dateRange.endDate
        );

        dispatch({
          type: AppointmentActionType.LOAD_APPOINTMENTS_SUCCESS,
          payload: { appointments, dateRange, requestId },
        });
      } catch (error) {
        dispatch({
          type: AppointmentActionType.LOAD_APPOINTMENTS_ERROR,
          payload: {
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load appointments',
            dateRange,
            requestId,
          },
        });
        toast.error('Failed to load appointments');
      }
    },
    [state.loadedRanges]
  );

  // Create appointment with optimistic update
  const createAppointment = useCallback(
    async (shopId: string, data: CreateAppointmentData) => {
      const tempId = `temp-${uuidv4()}`;
      const optimisticAppointment: Appointment = {
        id: tempId,
        shop_id: shopId,
        client_id: data.clientId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        type: data.type,
        status: 'pending',
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: null, // Will be populated by the server
      };

      // Optimistic update
      dispatch({
        type: AppointmentActionType.CREATE_APPOINTMENT_OPTIMISTIC,
        payload: { appointment: optimisticAppointment, tempId },
      });

      try {
        const appointment = await createAppointmentAction(data);

        dispatch({
          type: AppointmentActionType.CREATE_APPOINTMENT_SUCCESS,
          payload: { appointment, tempId },
        });

        toast.success('Appointment created successfully');
      } catch (error) {
        dispatch({
          type: AppointmentActionType.CREATE_APPOINTMENT_ERROR,
          payload: {
            tempId,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create appointment',
          },
        });
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to create appointment'
        );
        throw error;
      }
    },
    []
  );

  // Update appointment with optimistic update
  const updateAppointment = useCallback(
    async (id: string, data: UpdateAppointmentData) => {
      const currentAppointment = state.appointments.get(id);
      if (!currentAppointment) {
        toast.error('Appointment not found');
        return;
      }

      // Optimistic update
      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC,
        payload: {
          id,
          updates: data,
          previousData: currentAppointment,
        },
      });

      try {
        const appointment = await updateAppointmentAction(data);

        dispatch({
          type: AppointmentActionType.UPDATE_APPOINTMENT_SUCCESS,
          payload: { appointment },
        });

        // Only show toast for significant updates
        if (data.status || data.date || data.startTime) {
          toast.success('Appointment updated successfully');
        }
      } catch (error) {
        dispatch({
          type: AppointmentActionType.UPDATE_APPOINTMENT_ERROR,
          payload: {
            id,
            previousData: currentAppointment,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update appointment',
          },
        });
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update appointment'
        );
        throw error;
      }
    },
    [state.appointments]
  );

  // Cancel appointment with optimistic update
  const cancelAppointment = useCallback(
    async (id: string) => {
      const currentAppointment = state.appointments.get(id);
      if (!currentAppointment) {
        toast.error('Appointment not found');
        return;
      }

      // Optimistic update
      dispatch({
        type: AppointmentActionType.CANCEL_APPOINTMENT_OPTIMISTIC,
        payload: {
          id,
          previousData: currentAppointment,
        },
      });

      try {
        // Cancel by updating status to 'canceled'
        const appointment = await updateAppointmentAction({
          id,
          status: 'canceled',
        });

        dispatch({
          type: AppointmentActionType.CANCEL_APPOINTMENT_SUCCESS,
          payload: { appointment },
        });

        toast.success('Appointment canceled successfully');
      } catch (error) {
        dispatch({
          type: AppointmentActionType.CANCEL_APPOINTMENT_ERROR,
          payload: {
            id,
            previousData: currentAppointment,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to cancel appointment',
          },
        });
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to cancel appointment'
        );
        throw error;
      }
    },
    [state.appointments]
  );

  // Get appointments for a specific date range
  const getAppointmentsForDateRange = useCallback(
    (startDate: string, endDate: string): Appointment[] => {
      const appointments: Appointment[] = [];

      for (const appointment of state.appointments.values()) {
        if (appointment.date >= startDate && appointment.date <= endDate) {
          appointments.push(appointment);
        }
      }

      return appointments.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
    },
    [state.appointments]
  );

  // Check if a date range is loaded
  const isDateRangeLoaded = useCallback(
    (startDate: string, endDate: string): boolean => {
      return state.loadedRanges.some(
        (range) =>
          range.startDate <= startDate &&
          range.endDate >= endDate &&
          range.staleAt > Date.now()
      );
    },
    [state.loadedRanges]
  );

  // Clear stale data
  const clearStaleData = useCallback(() => {
    dispatch({
      type: AppointmentActionType.CLEAR_STALE_DATA,
      payload: {},
    });
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!shopId) return;

    const channel = supabase
      .channel(`appointments:${shopId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          // Fetch full appointment data with client info
          const { data } = await supabase
            .from('appointments')
            .select(
              `
              *,
              client:clients(
                first_name,
                last_name,
                email,
                phone_number
              )
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            dispatch({
              type: AppointmentActionType.APPOINTMENT_CREATED_REMOTE,
              payload: { appointment: data },
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          // Skip if we have an optimistic update in progress
          if (state.optimisticUpdates.has(payload.new.id)) {
            return;
          }

          // Fetch full appointment data with client info
          const { data } = await supabase
            .from('appointments')
            .select(
              `
              *,
              client:clients(
                first_name,
                last_name,
                email,
                phone_number
              )
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            dispatch({
              type: AppointmentActionType.APPOINTMENT_UPDATED_REMOTE,
              payload: { appointment: data },
            });
          }
        }
      )
      // Note: We don't subscribe to DELETE events because appointments are never deleted,
      // only canceled (which is handled by UPDATE events)
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [shopId, state.optimisticUpdates, supabase]);

  // Clean up stale data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleData();
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [clearStaleData]);

  const value: AppointmentContextValue = {
    state,
    dispatch,
    loadAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getAppointmentsForDateRange,
    isDateRangeLoaded,
    clearStaleData,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}
