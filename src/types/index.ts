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
  business_name: string;
  email: string;
  phone_number: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  location_type: 'home_based' | 'shop_location' | 'mobile_service';
  mailing_address?: string;
  working_hours: Record<
    string,
    { start: string; end: string; closed: boolean }
  >;
  buffer_time_minutes: number;
  payment_preference: 'upfront' | 'after_service';
  trial_countdown_enabled: boolean;
  trial_end_date?: string;
  created_at: string;
  updated_at: string;
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
  notes?: string;
  mailing_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  client_id: string;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  notes?: string;
  order_due_date?: string | null;
  created_at: string;
  updated_at: string;
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
  unit_price: number;
  unit: 'per_item' | 'per_hour' | 'flat_rate';
  description?: string | null;
  created_at: string;
  updated_at: string;
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
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
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
  order_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
  status: 'pending' | 'declined' | 'confirmed' | 'canceled' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: Client;
}

// UI/UX types
export type GarmentStage = 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';
export type OrderStatus = Order['status'];
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
