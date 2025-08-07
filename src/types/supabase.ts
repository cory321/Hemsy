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
          status: string;
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
          status?: string;
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
          status?: string;
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
      orders: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          id: string;
          order_number: string;
          shop_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          id?: string;
          order_number: string;
          shop_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          id?: string;
          order_number?: string;
          shop_id?: string;
          status?: string | null;
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
          created_at: string | null;
          id: string;
          name: string;
          owner_user_id: string;
          trial_countdown_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          owner_user_id: string;
          trial_countdown_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          owner_user_id?: string;
          trial_countdown_enabled?: boolean | null;
          updated_at?: string | null;
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
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
