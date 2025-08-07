import { Appointment } from '@/types';

// Action Types
export enum AppointmentActionType {
  // Data Loading
  LOAD_APPOINTMENTS_START = 'LOAD_APPOINTMENTS_START',
  LOAD_APPOINTMENTS_SUCCESS = 'LOAD_APPOINTMENTS_SUCCESS',
  LOAD_APPOINTMENTS_ERROR = 'LOAD_APPOINTMENTS_ERROR',

  // CRUD Operations
  CREATE_APPOINTMENT_OPTIMISTIC = 'CREATE_APPOINTMENT_OPTIMISTIC',
  CREATE_APPOINTMENT_SUCCESS = 'CREATE_APPOINTMENT_SUCCESS',
  CREATE_APPOINTMENT_ERROR = 'CREATE_APPOINTMENT_ERROR',

  UPDATE_APPOINTMENT_OPTIMISTIC = 'UPDATE_APPOINTMENT_OPTIMISTIC',
  UPDATE_APPOINTMENT_SUCCESS = 'UPDATE_APPOINTMENT_SUCCESS',
  UPDATE_APPOINTMENT_ERROR = 'UPDATE_APPOINTMENT_ERROR',

  CANCEL_APPOINTMENT_OPTIMISTIC = 'CANCEL_APPOINTMENT_OPTIMISTIC',
  CANCEL_APPOINTMENT_SUCCESS = 'CANCEL_APPOINTMENT_SUCCESS',
  CANCEL_APPOINTMENT_ERROR = 'CANCEL_APPOINTMENT_ERROR',

  // Real-time Updates
  APPOINTMENT_UPDATED_REMOTE = 'APPOINTMENT_UPDATED_REMOTE',
  APPOINTMENT_CREATED_REMOTE = 'APPOINTMENT_CREATED_REMOTE',
  // Note: We don't delete appointments, only cancel them

  // Cache Management
  INVALIDATE_DATE_RANGE = 'INVALIDATE_DATE_RANGE',
  CLEAR_STALE_DATA = 'CLEAR_STALE_DATA',
}

// Action Interfaces
export interface LoadAppointmentsStartAction {
  type: AppointmentActionType.LOAD_APPOINTMENTS_START;
  payload: {
    dateRange: { startDate: string; endDate: string };
    requestId: string; // Unique ID to prevent race conditions
  };
}

export interface LoadAppointmentsSuccessAction {
  type: AppointmentActionType.LOAD_APPOINTMENTS_SUCCESS;
  payload: {
    appointments: Appointment[];
    dateRange: { startDate: string; endDate: string };
    requestId: string;
  };
}

export interface LoadAppointmentsErrorAction {
  type: AppointmentActionType.LOAD_APPOINTMENTS_ERROR;
  payload: {
    error: string;
    dateRange: { startDate: string; endDate: string };
    requestId: string;
  };
}

export interface CreateAppointmentOptimisticAction {
  type: AppointmentActionType.CREATE_APPOINTMENT_OPTIMISTIC;
  payload: {
    appointment: Appointment;
    tempId: string;
  };
}

export interface CreateAppointmentSuccessAction {
  type: AppointmentActionType.CREATE_APPOINTMENT_SUCCESS;
  payload: {
    appointment: Appointment;
    tempId: string;
  };
}

export interface CreateAppointmentErrorAction {
  type: AppointmentActionType.CREATE_APPOINTMENT_ERROR;
  payload: {
    tempId: string;
    error: string;
  };
}

export interface UpdateAppointmentOptimisticAction {
  type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC;
  payload: {
    id: string;
    updates: Partial<Appointment>;
    previousData?: Appointment;
  };
}

export interface UpdateAppointmentSuccessAction {
  type: AppointmentActionType.UPDATE_APPOINTMENT_SUCCESS;
  payload: {
    appointment: Appointment;
  };
}

export interface UpdateAppointmentErrorAction {
  type: AppointmentActionType.UPDATE_APPOINTMENT_ERROR;
  payload: {
    id: string;
    previousData: Appointment;
    error: string;
  };
}

export interface CancelAppointmentOptimisticAction {
  type: AppointmentActionType.CANCEL_APPOINTMENT_OPTIMISTIC;
  payload: {
    id: string;
    previousData: Appointment;
  };
}

export interface CancelAppointmentSuccessAction {
  type: AppointmentActionType.CANCEL_APPOINTMENT_SUCCESS;
  payload: {
    appointment: Appointment;
  };
}

export interface CancelAppointmentErrorAction {
  type: AppointmentActionType.CANCEL_APPOINTMENT_ERROR;
  payload: {
    id: string;
    previousData: Appointment;
    error: string;
  };
}

export interface RemoteUpdateAction {
  type:
    | AppointmentActionType.APPOINTMENT_UPDATED_REMOTE
    | AppointmentActionType.APPOINTMENT_CREATED_REMOTE;
  payload: {
    appointment?: Appointment;
    id?: string;
  };
}

export interface InvalidateDateRangeAction {
  type: AppointmentActionType.INVALIDATE_DATE_RANGE;
  payload: {
    startDate: string;
    endDate: string;
  };
}

export interface ClearStaleDataAction {
  type: AppointmentActionType.CLEAR_STALE_DATA;
  payload: {
    keepDateRange?: { startDate: string; endDate: string };
  };
}

export type AppointmentAction =
  | LoadAppointmentsStartAction
  | LoadAppointmentsSuccessAction
  | LoadAppointmentsErrorAction
  | CreateAppointmentOptimisticAction
  | CreateAppointmentSuccessAction
  | CreateAppointmentErrorAction
  | UpdateAppointmentOptimisticAction
  | UpdateAppointmentSuccessAction
  | UpdateAppointmentErrorAction
  | CancelAppointmentOptimisticAction
  | CancelAppointmentSuccessAction
  | CancelAppointmentErrorAction
  | RemoteUpdateAction
  | InvalidateDateRangeAction
  | ClearStaleDataAction;

// State Interface
export interface AppointmentState {
  // Main data store - keyed by appointment ID
  appointments: Map<string, Appointment>;

  // Date range cache - tracks which date ranges have been loaded
  loadedRanges: Array<{
    startDate: string;
    endDate: string;
    loadedAt: number;
    staleAt: number; // Timestamp when data should be considered stale
  }>;

  // Loading states
  loading: {
    [requestId: string]: {
      dateRange: { startDate: string; endDate: string };
      status: 'pending' | 'success' | 'error';
    };
  };

  // Optimistic updates tracking
  optimisticUpdates: Map<
    string,
    {
      type: 'create' | 'update'; // No 'delete' - we only cancel appointments
      timestamp: number;
    }
  >;

  // Error states
  errors: Map<string, string>;

  // Last sync timestamp
  lastSync: number;

  // Active request tracking (prevents race conditions)
  activeRequests: Map<string, string>; // requestId -> dateRange key
}

// Initial State
export const initialAppointmentState: AppointmentState = {
  appointments: new Map(),
  loadedRanges: [],
  loading: {},
  optimisticUpdates: new Map(),
  errors: new Map(),
  lastSync: Date.now(),
  activeRequests: new Map(),
};

// Helper Functions
function isDateInRange(
  date: string,
  startDate: string,
  endDate: string
): boolean {
  return date >= startDate && date <= endDate;
}

function shouldInvalidateRange(
  appointment: Appointment,
  range: { startDate: string; endDate: string }
): boolean {
  return isDateInRange(appointment.date, range.startDate, range.endDate);
}

function mergeAppointments(
  existing: Map<string, Appointment>,
  newAppointments: Appointment[],
  dateRange: { startDate: string; endDate: string }
): Map<string, Appointment> {
  const merged = new Map(existing);

  // Remove appointments in the date range that aren't in the new data
  for (const [id, appointment] of merged) {
    if (
      isDateInRange(appointment.date, dateRange.startDate, dateRange.endDate) &&
      !newAppointments.find((a) => a.id === id)
    ) {
      merged.delete(id);
    }
  }

  // Add/update appointments from new data
  for (const appointment of newAppointments) {
    merged.set(appointment.id, appointment);
  }

  return merged;
}

// Reducer
export function appointmentReducer(
  state: AppointmentState,
  action: AppointmentAction
): AppointmentState {
  switch (action.type) {
    case AppointmentActionType.LOAD_APPOINTMENTS_START: {
      const { dateRange, requestId } = action.payload;
      return {
        ...state,
        loading: {
          ...state.loading,
          [requestId]: { dateRange, status: 'pending' },
        },
        activeRequests: new Map(state.activeRequests).set(
          requestId,
          `${dateRange.startDate}_${dateRange.endDate}`
        ),
      };
    }

    case AppointmentActionType.LOAD_APPOINTMENTS_SUCCESS: {
      const { appointments, dateRange, requestId } = action.payload;

      // Check if this request is still active (prevents race conditions)
      const activeRangeKey = state.activeRequests.get(requestId);
      const currentRangeKey = `${dateRange.startDate}_${dateRange.endDate}`;

      if (activeRangeKey !== currentRangeKey) {
        // This response is for an outdated request, ignore it
        return state;
      }

      const newAppointments = mergeAppointments(
        state.appointments,
        appointments,
        dateRange
      );

      const now = Date.now();
      const staleTime = 5 * 60 * 1000; // 5 minutes

      return {
        ...state,
        appointments: newAppointments,
        loadedRanges: [
          ...state.loadedRanges.filter(
            (range) =>
              !(
                range.startDate === dateRange.startDate &&
                range.endDate === dateRange.endDate
              )
          ),
          {
            ...dateRange,
            loadedAt: now,
            staleAt: now + staleTime,
          },
        ],
        loading: {
          ...state.loading,
          [requestId]: { dateRange, status: 'success' },
        },
        activeRequests: new Map(
          Array.from(state.activeRequests).filter(([id]) => id !== requestId)
        ),
        lastSync: now,
      };
    }

    case AppointmentActionType.LOAD_APPOINTMENTS_ERROR: {
      const { error, dateRange, requestId } = action.payload;
      return {
        ...state,
        loading: {
          ...state.loading,
          [requestId]: { dateRange, status: 'error' },
        },
        errors: new Map(state.errors).set(requestId, error),
        activeRequests: new Map(
          Array.from(state.activeRequests).filter(([id]) => id !== requestId)
        ),
      };
    }

    case AppointmentActionType.CREATE_APPOINTMENT_OPTIMISTIC: {
      const { appointment, tempId } = action.payload;
      return {
        ...state,
        appointments: new Map(state.appointments).set(tempId, appointment),
        optimisticUpdates: new Map(state.optimisticUpdates).set(tempId, {
          type: 'create',
          timestamp: Date.now(),
        }),
      };
    }

    case AppointmentActionType.CREATE_APPOINTMENT_SUCCESS: {
      const { appointment, tempId } = action.payload;
      const newAppointments = new Map(state.appointments);
      newAppointments.delete(tempId);
      newAppointments.set(appointment.id, appointment);

      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.delete(tempId);

      return {
        ...state,
        appointments: newAppointments,
        optimisticUpdates: newOptimisticUpdates,
      };
    }

    case AppointmentActionType.CREATE_APPOINTMENT_ERROR: {
      const { tempId } = action.payload;
      const newAppointments = new Map(state.appointments);
      newAppointments.delete(tempId);

      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.delete(tempId);

      return {
        ...state,
        appointments: newAppointments,
        optimisticUpdates: newOptimisticUpdates,
        errors: new Map(state.errors).set(tempId, action.payload.error),
      };
    }

    case AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC: {
      const { id, updates } = action.payload;
      const existing = state.appointments.get(id);
      if (!existing) return state;

      return {
        ...state,
        appointments: new Map(state.appointments).set(id, {
          ...existing,
          ...updates,
          updated_at: new Date().toISOString(),
        }),
        optimisticUpdates: new Map(state.optimisticUpdates).set(id, {
          type: 'update',
          timestamp: Date.now(),
        }),
      };
    }

    case AppointmentActionType.UPDATE_APPOINTMENT_SUCCESS: {
      const { appointment } = action.payload;
      return {
        ...state,
        appointments: new Map(state.appointments).set(
          appointment.id,
          appointment
        ),
        optimisticUpdates: new Map(
          Array.from(state.optimisticUpdates).filter(
            ([id]) => id !== appointment.id
          )
        ),
      };
    }

    case AppointmentActionType.UPDATE_APPOINTMENT_ERROR: {
      const { id, previousData } = action.payload;
      return {
        ...state,
        appointments: new Map(state.appointments).set(id, previousData),
        optimisticUpdates: new Map(
          Array.from(state.optimisticUpdates).filter(([aid]) => aid !== id)
        ),
        errors: new Map(state.errors).set(id, action.payload.error),
      };
    }

    case AppointmentActionType.CANCEL_APPOINTMENT_OPTIMISTIC: {
      const { id, previousData } = action.payload;
      const existing = state.appointments.get(id);
      if (!existing) return state;

      return {
        ...state,
        appointments: new Map(state.appointments).set(id, {
          ...existing,
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }),
        optimisticUpdates: new Map(state.optimisticUpdates).set(id, {
          type: 'update',
          timestamp: Date.now(),
        }),
      };
    }

    case AppointmentActionType.CANCEL_APPOINTMENT_SUCCESS: {
      const { appointment } = action.payload;
      return {
        ...state,
        appointments: new Map(state.appointments).set(
          appointment.id,
          appointment
        ),
        optimisticUpdates: new Map(
          Array.from(state.optimisticUpdates).filter(
            ([id]) => id !== appointment.id
          )
        ),
      };
    }

    case AppointmentActionType.CANCEL_APPOINTMENT_ERROR: {
      const { id, previousData } = action.payload;
      return {
        ...state,
        appointments: new Map(state.appointments).set(id, previousData),
        optimisticUpdates: new Map(
          Array.from(state.optimisticUpdates).filter(([aid]) => aid !== id)
        ),
        errors: new Map(state.errors).set(id, action.payload.error),
      };
    }

    case AppointmentActionType.APPOINTMENT_UPDATED_REMOTE: {
      const { appointment } = action.payload;
      if (!appointment) return state;

      // Only update if we don't have an optimistic update in progress
      if (state.optimisticUpdates.has(appointment.id)) {
        return state;
      }

      return {
        ...state,
        appointments: new Map(state.appointments).set(
          appointment.id,
          appointment
        ),
      };
    }

    case AppointmentActionType.APPOINTMENT_CREATED_REMOTE: {
      const { appointment } = action.payload;
      if (!appointment) return state;

      return {
        ...state,
        appointments: new Map(state.appointments).set(
          appointment.id,
          appointment
        ),
      };
    }

    // Note: We don't handle remote deletes because appointments are never deleted,
    // only canceled (which is handled by APPOINTMENT_UPDATED_REMOTE)

    case AppointmentActionType.INVALIDATE_DATE_RANGE: {
      const { startDate, endDate } = action.payload;
      return {
        ...state,
        loadedRanges: state.loadedRanges.filter(
          (range) => !(range.startDate >= startDate && range.endDate <= endDate)
        ),
      };
    }

    case AppointmentActionType.CLEAR_STALE_DATA: {
      const now = Date.now();
      const { keepDateRange } = action.payload;

      // Remove stale loaded ranges
      const freshRanges = state.loadedRanges.filter(
        (range) => range.staleAt > now
      );

      // If a specific range should be kept, ensure it's included
      if (keepDateRange) {
        const existingRange = freshRanges.find(
          (r) =>
            r.startDate === keepDateRange.startDate &&
            r.endDate === keepDateRange.endDate
        );
        if (!existingRange) {
          freshRanges.push({
            ...keepDateRange,
            loadedAt: now,
            staleAt: now + 5 * 60 * 1000,
          });
        }
      }

      // Remove appointments not in any fresh range
      const appointmentsToKeep = new Map<string, Appointment>();
      for (const [id, appointment] of state.appointments) {
        if (
          freshRanges.some((range) =>
            isDateInRange(appointment.date, range.startDate, range.endDate)
          )
        ) {
          appointmentsToKeep.set(id, appointment);
        }
      }

      return {
        ...state,
        appointments: appointmentsToKeep,
        loadedRanges: freshRanges,
        errors: new Map(), // Clear old errors
      };
    }

    default:
      return state;
  }
}
