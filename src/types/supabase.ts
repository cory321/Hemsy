export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
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
      };
    };
    Views: {
      // eslint-disable-next-line no-unused-vars
      [_ in never]: never;
    };
    Functions: {
      // eslint-disable-next-line no-unused-vars
      [_ in never]: never;
    };
    Enums: {
      // eslint-disable-next-line no-unused-vars
      [_ in never]: never;
    };
    CompositeTypes: {
      // eslint-disable-next-line no-unused-vars
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
