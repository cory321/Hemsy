import type {
  Appointment,
  Client,
  Shop,
  Order,
  Service,
  Garment,
  User,
  ShopHours,
  AppointmentType,
  AppointmentStatus,
  OrderStatus,
  GarmentStage,
} from '@/types';

// Base data generators
export const generateId = () => Math.random().toString(36).substring(2, 9);
export const generateDate = () => new Date().toISOString();
export const generateDateOnly = () => new Date().toISOString().split('T')[0];
export const generateTime = (hour: number, minute: number = 0) =>
  `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

// User factory
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: generateId(),
    clerk_user_id: `clerk_${generateId()}`,
    email: 'user@example.com',
    role: 'owner',
    created_at: generateDate(),
    updated_at: generateDate(),
    ...overrides,
  };
}

// Shop factory
export function createMockShop(overrides?: Partial<Shop>): Shop {
  return {
    id: generateId(),
    owner_user_id: generateId(),
    name: 'Test Shop',
    business_name: 'Test Business LLC',
    email: 'shop@example.com',
    phone_number: '555-0123',
    location_type: 'shop_location',
    mailing_address: '123 Main St, City, State 12345',
    working_hours: {
      '1': { start: '09:00', end: '17:00', closed: false },
      '2': { start: '09:00', end: '17:00', closed: false },
      '3': { start: '09:00', end: '17:00', closed: false },
      '4': { start: '09:00', end: '17:00', closed: false },
      '5': { start: '09:00', end: '17:00', closed: false },
      '6': { start: '10:00', end: '14:00', closed: false },
      '0': { start: '00:00', end: '00:00', closed: true },
    },
    buffer_time_minutes: 15,
    tax_percent: 8.25,
    trial_countdown_enabled: false,
    trial_end_date: null,
    created_at: generateDate(),
    updated_at: generateDate(),
    ...overrides,
  };
}

// Client factory
export function createMockClient(overrides?: Partial<Client>): Client {
  return {
    id: generateId(),
    shop_id: generateId(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '555-1234',
    accept_email: true,
    accept_sms: false,
    notes: null,
    mailing_address: null,
    created_at: generateDate(),
    updated_at: generateDate(),
    ...overrides,
  };
}

// Appointment factory
export function createMockAppointment(
  overrides?: Partial<Appointment>
): Appointment {
  const defaultDate = generateDateOnly();
  const defaultStartTime = generateTime(10, 0);
  const defaultEndTime = generateTime(11, 0);

  const baseAppointment = {
    id: generateId(),
    shop_id: generateId(),
    client_id: generateId(),
    order_id: null,
    type: 'consultation' as const,
    status: 'confirmed' as const,
    notes: null,
    reminder_sent: false,
    created_at: generateDate(),
    updated_at: generateDate(),
    date: defaultDate,
    start_time: defaultStartTime,
    end_time: defaultEndTime,
  };

  // Apply overrides, ensuring required fields remain defined
  const appointment: Appointment = {
    ...baseAppointment,
    ...overrides,
    // Override these fields last to ensure they're never undefined
    date: (overrides?.date !== undefined && overrides.date !== null
      ? overrides.date
      : defaultDate) as string,
    start_time: (overrides?.start_time !== undefined &&
    overrides.start_time !== null
      ? overrides.start_time
      : defaultStartTime) as string,
    end_time: (overrides?.end_time !== undefined && overrides.end_time !== null
      ? overrides.end_time
      : defaultEndTime) as string,
  };

  return appointment;
}

// Order factory
export function createMockOrder(overrides?: Partial<Order>): Order {
  return {
    id: generateId(),
    shop_id: generateId(),
    client_id: generateId(),
    order_number: `ORD-${Date.now()}`,
    status: 'pending',
    subtotal_cents: 10000,
    tax_cents: 825,
    discount_cents: 0,
    total_cents: 10825,
    is_paid: false,
    paid_at: null,
    notes: null,
    order_due_date: null,
    created_at: generateDate(),
    updated_at: generateDate(),
    ...overrides,
  };
}

// Service factory
export function createMockService(overrides?: Partial<Service>): Service {
  return {
    id: generateId(),
    shop_id: generateId(),
    name: 'Basic Hemming',
    default_qty: 1,
    default_unit: 'per_item',
    default_unit_price_cents: 2500,
    description: null,
    frequently_used: true,
    frequently_used_position: 1,
    created_at: generateDate(),
    updated_at: generateDate(),
    ...overrides,
  };
}

// Garment factory
export function createMockGarment(overrides?: Partial<Garment>): Garment {
  const garment: Garment = {
    id: generateId(),
    order_id: generateId(),
    title: 'Dress - Blue',
    stage: 'New',
    created_at: generateDate(),
    updated_at: generateDate(),
  };

  // Only add optional properties if they're not undefined
  if (overrides?.description !== undefined || !overrides) {
    garment.description = "Customer's blue dress for hemming";
  }

  return {
    ...garment,
    ...overrides,
  };
}

// ShopHours factory
export function createMockShopHours(overrides?: Partial<ShopHours>): ShopHours {
  return {
    day_of_week: 1,
    open_time: '09:00',
    close_time: '17:00',
    is_closed: false,
    ...overrides,
  };
}

// Array factory helpers
export function createMockShopHoursWeek(): ShopHours[] {
  return [
    createMockShopHours({
      day_of_week: 0,
      is_closed: true,
      open_time: null,
      close_time: null,
    }), // Sunday
    createMockShopHours({ day_of_week: 1 }), // Monday
    createMockShopHours({ day_of_week: 2 }), // Tuesday
    createMockShopHours({ day_of_week: 3 }), // Wednesday
    createMockShopHours({ day_of_week: 4 }), // Thursday
    createMockShopHours({ day_of_week: 5 }), // Friday
    createMockShopHours({
      day_of_week: 6,
      open_time: '10:00',
      close_time: '14:00',
    }), // Saturday
  ];
}

// Appointment with client factory
export function createMockAppointmentWithClient(
  appointmentOverrides?: Partial<Appointment>,
  clientOverrides?: Partial<Client>
): Appointment {
  const client = createMockClient(clientOverrides);
  return createMockAppointment({
    client_id: client.id,
    client,
    ...appointmentOverrides,
  });
}

// Batch creation helpers
export function createMockAppointments(
  count: number,
  overrides?: Partial<Appointment>[]
): Appointment[] {
  return Array.from({ length: count }, (_, i) =>
    createMockAppointment({
      ...overrides?.[i],
      start_time: generateTime(9 + i),
      end_time: generateTime(10 + i),
    })
  );
}

export function createMockClients(
  count: number,
  overrides?: Partial<Client>[]
): Client[] {
  return Array.from({ length: count }, (_, i) =>
    createMockClient({
      ...overrides?.[i],
      first_name: `Client${i + 1}`,
      email: `client${i + 1}@example.com`,
    })
  );
}

// Type-specific constants
export const APPOINTMENT_TYPES: AppointmentType[] = [
  'consultation',
  'fitting',
  'pickup',
  'delivery',
  'other',
];
export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'declined',
  'confirmed',
  'canceled',
  'no_show',
];
export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'active',
  'ready',
  'completed',
  'cancelled',
];
export const GARMENT_STAGES: GarmentStage[] = [
  'New',
  'In Progress',
  'Ready For Pickup',
  'Done',
];
