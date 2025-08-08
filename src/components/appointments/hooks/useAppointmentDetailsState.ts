import { useEffect, useReducer } from 'react';
import type { Appointment, AppointmentType } from '@/types';

export interface CommunicationPreferences {
  sendEmail: boolean;
  sendSms: boolean;
}

interface AppointmentDetailsState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;

  // Notes editing state
  isEditingNotes: boolean;
  editedNotes: string;
  currentNotes: string | null;
  savingNotes: boolean;

  // Type editing state
  isEditingType: boolean;
  editedType: AppointmentType;
  currentType: AppointmentType;
  savingType: boolean;

  // Cancellation
  showCancelConfirm: boolean;
  cancelComms: CommunicationPreferences;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_EDITING_NOTES'; payload: boolean }
  | { type: 'SET_EDITED_NOTES'; payload: string }
  | { type: 'SET_CURRENT_NOTES'; payload: string | null }
  | { type: 'SET_SAVING_NOTES'; payload: boolean }
  | { type: 'SET_EDITING_TYPE'; payload: boolean }
  | { type: 'SET_EDITED_TYPE'; payload: AppointmentType }
  | { type: 'SET_CURRENT_TYPE'; payload: AppointmentType }
  | { type: 'SET_SAVING_TYPE'; payload: boolean }
  | { type: 'SET_SHOW_CANCEL_CONFIRM'; payload: boolean }
  | { type: 'SET_CANCEL_COMMS'; payload: CommunicationPreferences }
  | { type: 'RESET_MESSAGES' }
  | {
      type: 'SYNC_FROM_APPOINTMENT';
      payload: {
        notes: string | null;
        type: AppointmentType;
        clientPrefs: CommunicationPreferences;
      };
    };

function reducer(
  state: AppointmentDetailsState,
  action: Action
): AppointmentDetailsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, successMessage: action.payload };
    case 'SET_EDITING_NOTES':
      return { ...state, isEditingNotes: action.payload };
    case 'SET_EDITED_NOTES':
      return { ...state, editedNotes: action.payload };
    case 'SET_CURRENT_NOTES':
      return { ...state, currentNotes: action.payload };
    case 'SET_SAVING_NOTES':
      return { ...state, savingNotes: action.payload };
    case 'SET_EDITING_TYPE':
      return { ...state, isEditingType: action.payload };
    case 'SET_EDITED_TYPE':
      return { ...state, editedType: action.payload };
    case 'SET_CURRENT_TYPE':
      return { ...state, currentType: action.payload };
    case 'SET_SAVING_TYPE':
      return { ...state, savingType: action.payload };
    case 'SET_SHOW_CANCEL_CONFIRM':
      return { ...state, showCancelConfirm: action.payload };
    case 'SET_CANCEL_COMMS':
      return { ...state, cancelComms: action.payload };
    case 'RESET_MESSAGES':
      return { ...state, error: null, successMessage: null };
    case 'SYNC_FROM_APPOINTMENT': {
      const { notes, type, clientPrefs } = action.payload;
      return {
        ...state,
        currentNotes: notes,
        editedNotes: notes || '',
        currentType: type,
        editedType: type,
        cancelComms: clientPrefs,
      };
    }
    default:
      return state;
  }
}

export function useAppointmentDetailsState(appointment: Appointment) {
  const [state, dispatch] = useReducer(reducer, {
    loading: false,
    error: null,
    successMessage: null,
    isEditingNotes: false,
    editedNotes: appointment.notes || '',
    currentNotes: appointment.notes || null,
    savingNotes: false,
    isEditingType: false,
    editedType: appointment.type,
    currentType: appointment.type,
    savingType: false,
    showCancelConfirm: false,
    cancelComms: {
      sendEmail: appointment.client?.accept_email ?? true,
      sendSms: appointment.client?.accept_sms ?? false,
    },
  } as AppointmentDetailsState);

  // Keep state in sync when appointment changes
  useEffect(() => {
    dispatch({
      type: 'SYNC_FROM_APPOINTMENT',
      payload: {
        notes: appointment.notes || null,
        type: appointment.type,
        clientPrefs: {
          sendEmail: appointment.client?.accept_email ?? true,
          sendSms: appointment.client?.accept_sms ?? false,
        },
      },
    });
  }, [
    appointment.notes,
    appointment.type,
    appointment.client?.accept_email,
    appointment.client?.accept_sms,
  ]);

  return { state, dispatch };
}

export type { AppointmentDetailsState };
