// =====================================================
// Hemsy DATABASE BACKUP TYPES
// Generated: 2024-12-19
// Purpose: TypeScript definitions for database backup
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
      clients: {
        Row: {
          accept_email: boolean;
          accept_sms: boolean;
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
          accept_email?: boolean;
          accept_sms?: boolean;
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
          accept_email?: boolean;
          accept_sms?: boolean;
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
      // ... (truncated for brevity - includes all table types)
      users: {
        Row: {
          clerk_user_id: string;
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          clerk_user_id: string;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          clerk_user_id?: string;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      garments_with_clients: {
        Row: {
          client_first_name: string | null;
          client_full_name: string | null;
          client_id: string | null;
          client_last_name: string | null;
          created_at: string | null;
          due_date: string | null;
          event_date: string | null;
          id: string | null;
          image_cloud_id: string | null;
          is_done: boolean | null;
          name: string | null;
          notes: string | null;
          order_id: string | null;
          photo_url: string | null;
          preset_fill_color: string | null;
          preset_icon_key: string | null;
          shop_id: string | null;
          stage: Database['public']['Enums']['garment_stage_enum'] | null;
          updated_at: string | null;
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
        ];
      };
    };
    Functions: {
      // Database functions for business logic
      allocate_payment_to_services: {
        Args: {
          p_amount_cents: number;
          p_invoice_id: string;
          p_payment_id: string;
          p_payment_method: string;
        };
        Returns: undefined;
      };
      create_appointment_atomic: {
        Args: {
          p_client_id: string;
          p_date: string;
          p_end_time: string;
          p_notes?: string;
          p_shop_id: string;
          p_start_time: string;
          p_type: string;
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
      // ... (other functions)
    };
    Enums: {
      appointment_status:
        | 'pending'
        | 'declined'
        | 'confirmed'
        | 'canceled'
        | 'no_show';
      garment_stage_enum: 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Backup-specific types
export interface DatabaseBackup {
  metadata: {
    backup_date: string;
    database_version: string;
    total_tables: number;
    total_functions: number;
    migration_count: number;
  };
  schema: {
    tables: string[];
    views: string[];
    functions: string[];
    enums: string[];
  };
  data: {
    [tableName: string]: Json[];
  };
}

export interface BackupRestoreOptions {
  includeData: boolean;
  includeSchema: boolean;
  tablesToInclude?: string[];
  tablesToExclude?: string[];
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tableCount: number;
  recordCount: number;
}

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
      garment_stage_enum: ['New', 'In Progress', 'Ready For Pickup', 'Done'],
    },
  },
} as const;
