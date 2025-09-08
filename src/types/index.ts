// Core domain types based on architecture.md

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  role: 'owner' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_user_id: string;
  name: string;
  business_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  location_type?: 'home_based' | 'shop_location' | 'mobile_service' | null;
  mailing_address?: string | null;
  working_hours?: Record<
    string,
    { start: string; end: string; closed: boolean }
  > | null;
  buffer_time_minutes?: number | null;
  tax_percent: number;
  trial_countdown_enabled?: boolean | null;
  trial_end_date?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Client {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  accept_email: boolean;
  accept_sms: boolean;
  notes?: string | null;
  mailing_address?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Order {
  id: string;
  shop_id: string;
  client_id?: string | null;
  order_number: string;
  status?: string | null;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  is_paid: boolean;
  paid_at?: string | null;
  notes?: string | null;
  order_due_date?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Garment {
  id: string;
  order_id: string;
  title: string;
  description?: string;
  photo_url?: string;
  due_date?: string;
  event_date?: string;
  stage: GarmentStage;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  default_qty: number;
  default_unit: string;
  default_unit_price_cents: number;
  description?: string | null;
  frequently_used: boolean;
  frequently_used_position?: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GarmentService {
  garment_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  order_id: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  stripe_link?: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  method: 'cash' | 'card' | 'stripe' | 'other';
  amount: number;
  stripe_txn_id?: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  shop_id: string;
  client_id: string;
  order_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other' | string;
  status: 'pending' | 'declined' | 'confirmed' | 'canceled' | 'no_show';
  notes?: string | null;
  reminder_sent?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  client?: Client;
}

// Additional types for better compatibility

export interface OrderWithGarmentCount extends Order {
  garment_count?: number;
  garments?: Garment[];
  total?: number;
  client?: Client | null;
}

// UI/UX types
export type GarmentStage = 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';
export type OrderStatus =
  | 'new'
  | 'in_progress'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';
export type InvoiceStatus = Invoice['status'];
export type AppointmentType = Appointment['type'];
export type AppointmentStatus = Appointment['status'];

// Shop Hours type
export interface ShopHours {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

// Email system types
export * from './email';
