export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)';
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string;
          created_at: string | null;
          date: string;
          end_time: string;
          id: string;
          notes: string | null;
          order_id: string | null;
          reminder_sent: boolean | null;
          shop_id: string;
          start_time: string;
          status: Database['public']['Enums']['appointment_status'];
          type: string;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          date: string;
          end_time: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          reminder_sent?: boolean | null;
          shop_id: string;
          start_time: string;
          status?: Database['public']['Enums']['appointment_status'];
          type: string;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          date?: string;
          end_time?: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          reminder_sent?: boolean | null;
          shop_id?: string;
          start_time?: string;
          status?: Database['public']['Enums']['appointment_status'];
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_settings: {
        Row: {
          buffer_time_minutes: number | null;
          created_at: string | null;
          default_appointment_duration: number | null;
          id: string;
          reminder_hours_before: number | null;
          send_reminders: boolean | null;
          shop_id: string;
          updated_at: string | null;
        };
        Insert: {
          buffer_time_minutes?: number | null;
          created_at?: string | null;
          default_appointment_duration?: number | null;
          id?: string;
          reminder_hours_before?: number | null;
          send_reminders?: boolean | null;
          shop_id: string;
          updated_at?: string | null;
        };
        Update: {
          buffer_time_minutes?: number | null;
          created_at?: string | null;
          default_appointment_duration?: number | null;
          id?: string;
          reminder_hours_before?: number | null;
          send_reminders?: boolean | null;
          shop_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_settings_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: true;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      clients: {
        Row: {
          accept_email: boolean | null;
          accept_sms: boolean | null;
          created_at: string | null;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          mailing_address: string | null;
          notes: string | null;
          phone_number: string;
          shop_id: string;
          updated_at: string | null;
        };
        Insert: {
          accept_email?: boolean | null;
          accept_sms?: boolean | null;
          created_at?: string | null;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          mailing_address?: string | null;
          notes?: string | null;
          phone_number: string;
          shop_id: string;
          updated_at?: string | null;
        };
        Update: {
          accept_email?: boolean | null;
          accept_sms?: boolean | null;
          created_at?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          mailing_address?: string | null;
          notes?: string | null;
          phone_number?: string;
          shop_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      confirmation_tokens: {
        Row: {
          appointment_id: string;
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          token: string;
          used_at: string | null;
        };
        Insert: {
          appointment_id: string;
          created_at?: string;
          created_by: string;
          expires_at: string;
          id?: string;
          token: string;
          used_at?: string | null;
        };
        Update: {
          appointment_id?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          token?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'confirmation_tokens_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'confirmation_tokens_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      email_logs: {
        Row: {
          attempts: number;
          body: string;
          created_at: string;
          created_by: string;
          email_type: string;
          id: string;
          last_error: string | null;
          metadata: Json;
          recipient_email: string;
          recipient_name: string;
          resend_id: string | null;
          sent_at: string | null;
          status: string;
          subject: string;
        };
        Insert: {
          attempts?: number;
          body: string;
          created_at?: string;
          created_by: string;
          email_type: string;
          id?: string;
          last_error?: string | null;
          metadata?: Json;
          recipient_email: string;
          recipient_name: string;
          resend_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject: string;
        };
        Update: {
          attempts?: number;
          body?: string;
          created_at?: string;
          created_by?: string;
          email_type?: string;
          id?: string;
          last_error?: string | null;
          metadata?: Json;
          recipient_email?: string;
          recipient_name?: string;
          resend_id?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_logs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      email_templates: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          email_type: string;
          id: string;
          is_default: boolean;
          subject: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by: string;
          email_type: string;
          id?: string;
          is_default?: boolean;
          subject: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          email_type?: string;
          id?: string;
          is_default?: boolean;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      garment_services: {
        Row: {
          created_at: string | null;
          description: string | null;
          garment_id: string;
          id: string;
          is_done: boolean;
          line_total_cents: number | null;
          name: string;
          quantity: number;
          service_id: string | null;
          unit: string;
          unit_price_cents: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          garment_id: string;
          id?: string;
          is_done?: boolean;
          line_total_cents?: number | null;
          name: string;
          quantity: number;
          service_id?: string | null;
          unit: string;
          unit_price_cents: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          garment_id?: string;
          id?: string;
          is_done?: boolean;
          line_total_cents?: number | null;
          name?: string;
          quantity?: number;
          service_id?: string | null;
          unit?: string;
          unit_price_cents?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garment_services_garment_id_fkey';
            columns: ['garment_id'];
            isOneToOne: false;
            referencedRelation: 'garments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_services_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      garment_stage_templates: {
        Row: {
          created_at: string | null;
          display_order: number;
          id: string;
          is_system_default: boolean;
          name: string;
          shop_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number;
          id?: string;
          is_system_default?: boolean;
          name: string;
          shop_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_order?: number;
          id?: string;
          is_system_default?: boolean;
          name?: string;
          shop_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garment_stage_templates_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      garment_stages: {
        Row: {
          color: string | null;
          created_at: string | null;
          id: string;
          name: string;
          position: number;
          shop_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          position: number;
          shop_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          position?: number;
          shop_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garment_stages_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      garments: {
        Row: {
          created_at: string | null;
          due_date: string | null;
          event_date: string | null;
          id: string;
          image_cloud_id: string | null;
          is_done: boolean;
          name: string;
          notes: string | null;
          order_id: string;
          photo_url: string | null;
          preset_icon_key: string | null;
          shop_id: string | null;
          stage: string;
          stage_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          due_date?: string | null;
          event_date?: string | null;
          id?: string;
          image_cloud_id?: string | null;
          is_done?: boolean;
          name: string;
          notes?: string | null;
          order_id: string;
          photo_url?: string | null;
          preset_icon_key?: string | null;
          shop_id?: string | null;
          stage?: string;
          stage_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          due_date?: string | null;
          event_date?: string | null;
          id?: string;
          image_cloud_id?: string | null;
          is_done?: boolean;
          name?: string;
          notes?: string | null;
          order_id?: string;
          photo_url?: string | null;
          preset_icon_key?: string | null;
          shop_id?: string | null;
          stage?: string;
          stage_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garments_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garments_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'garment_stages';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          discount_cents: number;
          id: string;
          is_paid: boolean;
          notes: string | null;
          order_due_date: string | null;
          order_number: string;
          paid_at: string | null;
          shop_id: string;
          status: string | null;
          subtotal_cents: number;
          tax_cents: number;
          total_cents: number;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          discount_cents?: number;
          id?: string;
          is_paid?: boolean;
          notes?: string | null;
          order_due_date?: string | null;
          order_number: string;
          paid_at?: string | null;
          shop_id: string;
          status?: string | null;
          subtotal_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          discount_cents?: number;
          id?: string;
          is_paid?: boolean;
          notes?: string | null;
          order_due_date?: string | null;
          order_number?: string;
          paid_at?: string | null;
          shop_id?: string;
          status?: string | null;
          subtotal_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          created_at: string | null;
          default_qty: number;
          default_unit: string;
          default_unit_price_cents: number;
          description: string | null;
          frequently_used: boolean;
          frequently_used_position: number | null;
          id: string;
          name: string;
          shop_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_qty?: number;
          default_unit?: string;
          default_unit_price_cents?: number;
          description?: string | null;
          frequently_used?: boolean;
          frequently_used_position?: number | null;
          id?: string;
          name: string;
          shop_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_qty?: number;
          default_unit?: string;
          default_unit_price_cents?: number;
          description?: string | null;
          frequently_used?: boolean;
          frequently_used_position?: number | null;
          id?: string;
          name?: string;
          shop_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'services_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_hours: {
        Row: {
          close_time: string | null;
          created_at: string | null;
          day_of_week: number;
          id: string;
          is_closed: boolean | null;
          open_time: string | null;
          shop_id: string;
          updated_at: string | null;
        };
        Insert: {
          close_time?: string | null;
          created_at?: string | null;
          day_of_week: number;
          id?: string;
          is_closed?: boolean | null;
          open_time?: string | null;
          shop_id: string;
          updated_at?: string | null;
        };
        Update: {
          close_time?: string | null;
          created_at?: string | null;
          day_of_week?: number;
          id?: string;
          is_closed?: boolean | null;
          open_time?: string | null;
          shop_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_hours_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shops: {
        Row: {
          buffer_time_minutes: number | null;
          business_name: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          location_type: string | null;
          mailing_address: string | null;
          name: string;
          owner_user_id: string;
          payment_preference: string | null;
          phone_number: string | null;
          tax_percent: number;
          trial_countdown_enabled: boolean | null;
          trial_end_date: string | null;
          updated_at: string | null;
          working_hours: Json | null;
        };
        Insert: {
          buffer_time_minutes?: number | null;
          business_name?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          location_type?: string | null;
          mailing_address?: string | null;
          name: string;
          owner_user_id: string;
          payment_preference?: string | null;
          phone_number?: string | null;
          tax_percent?: number;
          trial_countdown_enabled?: boolean | null;
          trial_end_date?: string | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Update: {
          buffer_time_minutes?: number | null;
          business_name?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          location_type?: string | null;
          mailing_address?: string | null;
          name?: string;
          owner_user_id?: string;
          payment_preference?: string | null;
          phone_number?: string | null;
          tax_percent?: number;
          trial_countdown_enabled?: boolean | null;
          trial_end_date?: string | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_owner_user_id_fkey';
            columns: ['owner_user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_email_settings: {
        Row: {
          email_signature: string | null;
          receive_appointment_notifications: boolean;
          reply_to_email: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          email_signature?: string | null;
          receive_appointment_notifications?: boolean;
          reply_to_email?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          email_signature?: string | null;
          receive_appointment_notifications?: boolean;
          reply_to_email?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_email_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          clerk_user_id: string;
          created_at: string | null;
          email: string;
          id: string;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          clerk_user_id: string;
          created_at?: string | null;
          email: string;
          id?: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          clerk_user_id?: string;
          created_at?: string | null;
          email?: string;
          id?: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_appointment_conflict: {
        Args: {
          p_shop_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_appointment_id?: string;
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
      compute_order_totals: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      create_appointment_atomic: {
        Args: {
          p_shop_id: string;
          p_client_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_type: string;
          p_notes?: string;
        };
        Returns: {
          client_id: string;
          created_at: string | null;
          date: string;
          end_time: string;
          id: string;
          notes: string | null;
          order_id: string | null;
          reminder_sent: boolean | null;
          shop_id: string;
          start_time: string;
          status: Database['public']['Enums']['appointment_status'];
          type: string;
          updated_at: string | null;
        };
      };
      generate_order_number: {
        Args: { p_shop_id: string };
        Returns: string;
      };
      get_appointment_counts_by_date: {
        Args: { p_shop_id: string; p_start_date: string; p_end_date: string };
        Returns: {
          date: string;
          total_count: number;
          scheduled_count: number;
          confirmed_count: number;
        }[];
      };
      get_appointments_time_range: {
        Args: {
          p_shop_id: string;
          p_start_date: string;
          p_end_date: string;
          p_include_cancelled?: boolean;
        };
        Returns: {
          id: string;
          shop_id: string;
          client_id: string;
          order_id: string;
          date: string;
          start_time: string;
          end_time: string;
          type: string;
          status: string;
          notes: string;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
          client_first_name: string;
          client_last_name: string;
          client_email: string;
          client_phone_number: string;
        }[];
      };
      get_default_email_templates: {
        Args: Record<PropertyKey, never>;
        Returns: {
          email_type: string;
          subject: string;
          body: string;
        }[];
      };
      initialize_default_email_templates: {
        Args: { user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      appointment_status:
        | 'pending'
        | 'declined'
        | 'confirmed'
        | 'canceled'
        | 'no_show';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        'pending',
        'declined',
        'confirmed',
        'canceled',
        'no_show',
      ],
    },
  },
} as const;
