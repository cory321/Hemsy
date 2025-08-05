// Extended Supabase types including appointments tables
// This file extends the auto-generated types with manual additions

import { Database } from './supabase';

export type Tables<T extends keyof ExtendedDatabase['public']['Tables']> =
  ExtendedDatabase['public']['Tables'][T]['Row'];

export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      appointments: {
        Row: {
          id: string;
          shop_id: string;
          client_id: string;
          order_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
          status:
            | 'pending'
            | 'declined'
            | 'confirmed'
            | 'canceled'
            | 'no_show'
            | 'completed';
          notes: string | null;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
          // Joined data
          client?: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone_number: string;
            accept_email: boolean;
            accept_sms: boolean;
          };
        };
        Insert: {
          id?: string;
          shop_id: string;
          client_id: string;
          order_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
          status?:
            | 'pending'
            | 'declined'
            | 'confirmed'
            | 'canceled'
            | 'no_show'
            | 'completed';
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          client_id?: string | null;
          order_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          type?: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
          status?:
            | 'pending'
            | 'declined'
            | 'confirmed'
            | 'canceled'
            | 'no_show'
            | 'completed';
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shop_hours: {
        Row: {
          id: string;
          shop_id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          day_of_week?: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_settings: {
        Row: {
          id: string;
          shop_id: string;
          buffer_time_minutes: number;
          default_appointment_duration: number;

          send_reminders: boolean;
          reminder_hours_before: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          buffer_time_minutes?: number;
          default_appointment_duration?: number;

          send_reminders?: boolean;
          reminder_hours_before?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          buffer_time_minutes?: number;
          default_appointment_duration?: number;

          send_reminders?: boolean;
          reminder_hours_before?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: Database['public']['Functions'] & {
      check_appointment_conflict: {
        Args: {
          p_shop_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_appointment_id?: string | null;
        };
        Returns: boolean;
      };
      check_within_working_hours: {
        Args: {
          p_shop_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
        };
        Returns: boolean;
      };
    };
  };
}
