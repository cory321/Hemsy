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
            foreignKeyName: 'appointments_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'garments_with_clients';
            referencedColumns: ['client_id'];
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
      garment_history: {
        Row: {
          change_type: string;
          changed_at: string;
          changed_by: string;
          field_name: string;
          garment_id: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
          related_service_id: string | null;
        };
        Insert: {
          change_type: string;
          changed_at?: string;
          changed_by: string;
          field_name: string;
          garment_id: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          related_service_id?: string | null;
        };
        Update: {
          change_type?: string;
          changed_at?: string;
          changed_by?: string;
          field_name?: string;
          garment_id?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          related_service_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garment_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_history_garment_id_fkey';
            columns: ['garment_id'];
            isOneToOne: false;
            referencedRelation: 'garments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_history_garment_id_fkey';
            columns: ['garment_id'];
            isOneToOne: false;
            referencedRelation: 'garments_with_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_history_related_service_id_fkey';
            columns: ['related_service_id'];
            isOneToOne: false;
            referencedRelation: 'garment_services';
            referencedColumns: ['id'];
          },
        ];
      };
      garment_service_time_entries: {
        Row: {
          created_by: string | null;
          id: string;
          logged_at: string;
          minutes: number;
          service_id: string;
        };
        Insert: {
          created_by?: string | null;
          id?: string;
          logged_at?: string;
          minutes: number;
          service_id: string;
        };
        Update: {
          created_by?: string | null;
          id?: string;
          logged_at?: string;
          minutes?: number;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'garment_service_time_entries_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_service_time_entries_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'garment_services';
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
          invoice_id: string | null;
          is_done: boolean;
          is_locked: boolean | null;
          is_removed: boolean | null;
          line_total_cents: number | null;
          locked_at: string | null;
          name: string;
          paid_amount_cents: number | null;
          payment_status: string | null;
          quantity: number;
          refund_notes: string | null;
          refunded_amount_cents: number | null;
          refunded_at: string | null;
          refunded_by: string | null;
          removal_reason: string | null;
          removed_at: string | null;
          removed_by: string | null;
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
          invoice_id?: string | null;
          is_done?: boolean;
          is_locked?: boolean | null;
          is_removed?: boolean | null;
          line_total_cents?: number | null;
          locked_at?: string | null;
          name: string;
          paid_amount_cents?: number | null;
          payment_status?: string | null;
          quantity: number;
          refund_notes?: string | null;
          refunded_amount_cents?: number | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
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
          invoice_id?: string | null;
          is_done?: boolean;
          is_locked?: boolean | null;
          is_removed?: boolean | null;
          line_total_cents?: number | null;
          locked_at?: string | null;
          name?: string;
          paid_amount_cents?: number | null;
          payment_status?: string | null;
          quantity?: number;
          refund_notes?: string | null;
          refunded_amount_cents?: number | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
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
            foreignKeyName: 'garment_services_garment_id_fkey';
            columns: ['garment_id'];
            isOneToOne: false;
            referencedRelation: 'garments_with_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_services_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_services_refunded_by_fkey';
            columns: ['refunded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'garment_services_removed_by_fkey';
            columns: ['removed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
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
          preset_fill_color: string | null;
          preset_icon_key: string | null;
          shop_id: string | null;
          stage: Database['public']['Enums']['garment_stage_enum'] | null;
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
          preset_fill_color?: string | null;
          preset_icon_key?: string | null;
          shop_id?: string | null;
          stage?: Database['public']['Enums']['garment_stage_enum'] | null;
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
          preset_fill_color?: string | null;
          preset_icon_key?: string | null;
          shop_id?: string | null;
          stage?: Database['public']['Enums']['garment_stage_enum'] | null;
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
        ];
      };
      invoice_email_templates: {
        Row: {
          body_html: string;
          body_text: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          shop_id: string;
          subject: string;
          template_type: string;
          updated_at: string | null;
          variables_used: Json | null;
        };
        Insert: {
          body_html: string;
          body_text: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          shop_id: string;
          subject: string;
          template_type: string;
          updated_at?: string | null;
          variables_used?: Json | null;
        };
        Update: {
          body_html?: string;
          body_text?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          shop_id?: string;
          subject?: string;
          template_type?: string;
          updated_at?: string | null;
          variables_used?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_email_templates_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_status_history: {
        Row: {
          changed_by: string;
          created_at: string | null;
          id: string;
          invoice_id: string;
          metadata: Json | null;
          new_status: string;
          previous_status: string | null;
          reason: string | null;
        };
        Insert: {
          changed_by: string;
          created_at?: string | null;
          id?: string;
          invoice_id: string;
          metadata?: Json | null;
          new_status: string;
          previous_status?: string | null;
          reason?: string | null;
        };
        Update: {
          changed_by?: string;
          created_at?: string | null;
          id?: string;
          invoice_id?: string;
          metadata?: Json | null;
          new_status?: string;
          previous_status?: string | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_status_history_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          amount_cents: number;
          client_id: string;
          created_at: string | null;
          deposit_amount_cents: number | null;
          description: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          invoice_type: string | null;
          line_items: Json;
          metadata: Json | null;
          order_id: string;
          shop_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          amount_cents: number;
          client_id: string;
          created_at?: string | null;
          deposit_amount_cents?: number | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          invoice_type?: string | null;
          line_items?: Json;
          metadata?: Json | null;
          order_id: string;
          shop_id: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          amount_cents?: number;
          client_id?: string;
          created_at?: string | null;
          deposit_amount_cents?: number | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          invoice_type?: string | null;
          line_items?: Json;
          metadata?: Json | null;
          order_id?: string;
          shop_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'garments_with_clients';
            referencedColumns: ['client_id'];
          },
          {
            foreignKeyName: 'invoices_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_shop_id_fkey';
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
          deposit_amount_cents: number | null;
          discount_cents: number;
          id: string;
          is_paid: boolean;
          notes: string | null;
          order_due_date: string | null;
          order_number: string;
          paid_amount_cents: number | null;
          paid_at: string | null;
          payment_status: string | null;
          shop_id: string;
          status: Database['public']['Enums']['order_status'];
          subtotal_cents: number;
          tax_cents: number;
          total_cents: number;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          deposit_amount_cents?: number | null;
          discount_cents?: number;
          id?: string;
          is_paid?: boolean;
          notes?: string | null;
          order_due_date?: string | null;
          order_number: string;
          paid_amount_cents?: number | null;
          paid_at?: string | null;
          payment_status?: string | null;
          shop_id: string;
          status?: Database['public']['Enums']['order_status'];
          subtotal_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          deposit_amount_cents?: number | null;
          discount_cents?: number;
          id?: string;
          is_paid?: boolean;
          notes?: string | null;
          order_due_date?: string | null;
          order_number?: string;
          paid_amount_cents?: number | null;
          paid_at?: string | null;
          payment_status?: string | null;
          shop_id?: string;
          status?: Database['public']['Enums']['order_status'];
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
            foreignKeyName: 'orders_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'garments_with_clients';
            referencedColumns: ['client_id'];
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
      payment_audit_log: {
        Row: {
          action: string;
          amount_cents: number;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          payment_id: string | null;
          performed_by: string | null;
          reason: string | null;
        };
        Insert: {
          action: string;
          amount_cents: number;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          performed_by?: string | null;
          reason?: string | null;
        };
        Update: {
          action?: string;
          amount_cents?: number;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          performed_by?: string | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_audit_log_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_audit_log_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json;
          id: string;
          ip_address: unknown | null;
          payment_id: string;
          timestamp: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json;
          id?: string;
          ip_address?: unknown | null;
          payment_id: string;
          timestamp?: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json;
          id?: string;
          ip_address?: unknown | null;
          payment_id?: string;
          timestamp?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_audit_logs_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_links: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          invoice_id: string;
          status: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_link_id: string | null;
          token: string;
          url: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          invoice_id: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_link_id?: string | null;
          token?: string;
          url: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          invoice_id?: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_link_id?: string | null;
          token?: string;
          url?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_links_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string | null;
          external_reference: string | null;
          id: string;
          invoice_id: string;
          notes: string | null;
          payment_method: string;
          payment_type: string;
          processed_at: string | null;
          refund_id: string | null;
          refund_reason: string | null;
          refunded_amount_cents: number | null;
          refunded_at: string | null;
          refunded_by: string | null;
          status: string;
          stripe_metadata: Json | null;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string | null;
          external_reference?: string | null;
          id?: string;
          invoice_id: string;
          notes?: string | null;
          payment_method: string;
          payment_type?: string;
          processed_at?: string | null;
          refund_id?: string | null;
          refund_reason?: string | null;
          refunded_amount_cents?: number | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          status?: string;
          stripe_metadata?: Json | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string | null;
          external_reference?: string | null;
          id?: string;
          invoice_id?: string;
          notes?: string | null;
          payment_method?: string;
          payment_type?: string;
          processed_at?: string | null;
          refund_id?: string | null;
          refund_reason?: string | null;
          refunded_amount_cents?: number | null;
          refunded_at?: string | null;
          refunded_by?: string | null;
          status?: string;
          stripe_metadata?: Json | null;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_refunded_by_fkey';
            columns: ['refunded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      refunds: {
        Row: {
          amount_cents: number;
          created_at: string | null;
          id: string;
          initiated_by: string | null;
          merchant_notes: string | null;
          payment_id: string;
          processed_at: string | null;
          reason: string | null;
          refund_type: string;
          status: string;
          stripe_metadata: Json | null;
          stripe_refund_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string | null;
          id?: string;
          initiated_by?: string | null;
          merchant_notes?: string | null;
          payment_id: string;
          processed_at?: string | null;
          reason?: string | null;
          refund_type: string;
          status?: string;
          stripe_metadata?: Json | null;
          stripe_refund_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string | null;
          id?: string;
          initiated_by?: string | null;
          merchant_notes?: string | null;
          payment_id?: string;
          processed_at?: string | null;
          reason?: string | null;
          refund_type?: string;
          status?: string;
          stripe_metadata?: Json | null;
          stripe_refund_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'refunds_initiated_by_fkey';
            columns: ['initiated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
        ];
      };
      service_payment_allocations: {
        Row: {
          allocated_amount_cents: number;
          created_at: string | null;
          garment_service_id: string | null;
          id: string;
          invoice_id: string | null;
          last_refunded_at: string | null;
          payment_id: string | null;
          payment_method: string;
          refunded_amount_cents: number | null;
        };
        Insert: {
          allocated_amount_cents: number;
          created_at?: string | null;
          garment_service_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          last_refunded_at?: string | null;
          payment_id?: string | null;
          payment_method: string;
          refunded_amount_cents?: number | null;
        };
        Update: {
          allocated_amount_cents?: number;
          created_at?: string | null;
          garment_service_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          last_refunded_at?: string | null;
          payment_id?: string | null;
          payment_method?: string;
          refunded_amount_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_payment_allocations_garment_service_id_fkey';
            columns: ['garment_service_id'];
            isOneToOne: false;
            referencedRelation: 'garment_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_payment_allocations_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_payment_allocations_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
        ];
      };
      service_refund_history: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          external_reference: string | null;
          garment_service_id: string | null;
          id: string;
          payment_id: string | null;
          refund_amount_cents: number;
          refund_reason: string;
          refund_type: string | null;
          stripe_refund_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          external_reference?: string | null;
          garment_service_id?: string | null;
          id?: string;
          payment_id?: string | null;
          refund_amount_cents: number;
          refund_reason: string;
          refund_type?: string | null;
          stripe_refund_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          external_reference?: string | null;
          garment_service_id?: string | null;
          id?: string;
          payment_id?: string | null;
          refund_amount_cents?: number;
          refund_reason?: string;
          refund_type?: string | null;
          stripe_refund_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_refund_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_refund_history_garment_service_id_fkey';
            columns: ['garment_service_id'];
            isOneToOne: false;
            referencedRelation: 'garment_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_refund_history_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
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
      shop_settings: {
        Row: {
          cash_enabled: boolean | null;
          created_at: string | null;
          external_pos_enabled: boolean | null;
          id: string;
          invoice_prefix: string | null;
          last_invoice_number: number | null;
          payment_settings: Json | null;
          shop_id: string;
          stripe_connect_account_id: string | null;
          stripe_connect_capabilities: Json | null;
          stripe_connect_charges_enabled: boolean | null;
          stripe_connect_onboarded_at: string | null;
          stripe_connect_payouts_enabled: boolean | null;
          stripe_connect_requirements: Json | null;
          stripe_connect_status: string | null;
          stripe_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          cash_enabled?: boolean | null;
          created_at?: string | null;
          external_pos_enabled?: boolean | null;
          id?: string;
          invoice_prefix?: string | null;
          last_invoice_number?: number | null;
          payment_settings?: Json | null;
          shop_id: string;
          stripe_connect_account_id?: string | null;
          stripe_connect_capabilities?: Json | null;
          stripe_connect_charges_enabled?: boolean | null;
          stripe_connect_onboarded_at?: string | null;
          stripe_connect_payouts_enabled?: boolean | null;
          stripe_connect_requirements?: Json | null;
          stripe_connect_status?: string | null;
          stripe_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          cash_enabled?: boolean | null;
          created_at?: string | null;
          external_pos_enabled?: boolean | null;
          id?: string;
          invoice_prefix?: string | null;
          last_invoice_number?: number | null;
          payment_settings?: Json | null;
          shop_id?: string;
          stripe_connect_account_id?: string | null;
          stripe_connect_capabilities?: Json | null;
          stripe_connect_charges_enabled?: boolean | null;
          stripe_connect_onboarded_at?: string | null;
          stripe_connect_payouts_enabled?: boolean | null;
          stripe_connect_requirements?: Json | null;
          stripe_connect_status?: string | null;
          stripe_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_settings_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: true;
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
          onboarding_completed: boolean | null;
          owner_user_id: string;
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
          onboarding_completed?: boolean | null;
          owner_user_id: string;
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
          onboarding_completed?: boolean | null;
          owner_user_id?: string;
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
      stripe_webhook_events: {
        Row: {
          event_id: string;
          event_type: string;
          id: string;
          processed_at: string | null;
        };
        Insert: {
          event_id: string;
          event_type: string;
          id?: string;
          processed_at?: string | null;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          id?: string;
          processed_at?: string | null;
        };
        Relationships: [];
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
      calculate_order_status: {
        Args: { p_order_id: string };
        Returns: Database['public']['Enums']['order_status'];
      };
      check_appointment_conflict: {
        Args: {
          p_appointment_id?: string;
          p_date: string;
          p_end_time: string;
          p_shop_id: string;
          p_start_time: string;
        };
        Returns: boolean;
      };
      check_within_working_hours: {
        Args: {
          p_date: string;
          p_end_time: string;
          p_shop_id: string;
          p_start_time: string;
        };
        Returns: boolean;
      };
      cleanup_abandoned_pending_payments: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      compute_order_totals: {
        Args: { p_order_id: string };
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
      create_invoice_with_number: {
        Args: {
          p_amount_cents: number;
          p_client_id: string;
          p_deposit_amount_cents?: number;
          p_description?: string;
          p_line_items?: Json;
          p_order_id: string;
          p_shop_id: string;
        };
        Returns: {
          amount_cents: number;
          client_id: string;
          created_at: string | null;
          deposit_amount_cents: number | null;
          description: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          invoice_type: string | null;
          line_items: Json;
          metadata: Json | null;
          order_id: string;
          shop_id: string;
          status: string;
          updated_at: string | null;
        };
      };
      create_order_with_payment_transaction: {
        Args: {
          p_order_data: Json;
          p_payment_intent: Json;
          p_shop_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      generate_order_number: {
        Args: { p_shop_id: string };
        Returns: string;
      };
      get_appointment_counts_by_date: {
        Args: { p_end_date: string; p_shop_id: string; p_start_date: string };
        Returns: {
          confirmed_count: number;
          date: string;
          scheduled_count: number;
          total_count: number;
        }[];
      };
      get_appointments_time_range: {
        Args: {
          p_end_date: string;
          p_include_cancelled?: boolean;
          p_shop_id: string;
          p_start_date: string;
        };
        Returns: {
          client_email: string;
          client_first_name: string;
          client_id: string;
          client_last_name: string;
          client_phone_number: string;
          created_at: string;
          date: string;
          end_time: string;
          id: string;
          notes: string;
          order_id: string;
          reminder_sent: boolean;
          shop_id: string;
          start_time: string;
          status: string;
          type: string;
          updated_at: string;
        }[];
      };
      get_default_email_templates: {
        Args: Record<PropertyKey, never>;
        Returns: {
          body: string;
          email_type: string;
          subject: string;
        }[];
      };
      gtrgm_compress: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { '': unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      initialize_default_email_templates: {
        Args: { user_id: string };
        Returns: undefined;
      };
      mark_garment_picked_up: {
        Args: { p_garment_id: string };
        Returns: undefined;
      };
      process_manual_payment: {
        Args: {
          p_amount_cents: number;
          p_external_reference?: string;
          p_invoice_id: string;
          p_notes?: string;
          p_payment_method: string;
          p_payment_type: string;
          p_user_id?: string;
        };
        Returns: undefined;
      };
      process_refund_completion: {
        Args: { p_refund_id: string; p_stripe_refund_data: Json };
        Returns: undefined;
      };
      set_current_user_id: {
        Args: { user_id: string };
        Returns: undefined;
      };
      set_limit: {
        Args: { '': number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { '': string };
        Returns: string[];
      };
      update_order_payment_status: {
        Args: { p_order_id: string };
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
      garment_stage_enum: 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';
      order_status: 'new' | 'active' | 'ready' | 'completed' | 'cancelled';
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
      garment_stage_enum: ['New', 'In Progress', 'Ready For Pickup', 'Done'],
      order_status: ['new', 'active', 'ready', 'completed', 'cancelled'],
    },
  },
} as const;
