import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import GarmentImageSection from '../GarmentImageSection';
import { GarmentProvider } from '@/contexts/GarmentContext';

// Mock the appointment dialog
jest.mock('@/components/appointments/AppointmentDialog', () => ({
  AppointmentDialog: ({ open, onClose, prefilledClient, onCreate }: any) => (
    <div
      data-testid="appointment-dialog"
      style={{ display: open ? 'block' : 'none' }}
    >
      <div data-testid="prefilled-client-name">
        {prefilledClient
          ? `${prefilledClient.first_name} ${prefilledClient.last_name}`
          : 'No client'}
      </div>
      <button
        onClick={() =>
          onCreate({
            clientId: 'test-client-id',
            date: '2024-01-15',
            startTime: '10:00',
            endTime: '11:00',
            type: 'consultation',
            notes: 'Test appointment',
            sendEmail: true,
          })
        }
      >
        Create Appointment
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock the appointment actions
jest.mock('@/lib/actions/appointments', () => ({
  createAppointment: jest.fn(),
}));

// Mock toast from sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the image components
jest.mock('@/components/ui/SafeCldImage', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => (
    <img alt={alt} data-testid="safe-cld-image" />
  ),
}));

jest.mock('@/components/ui/InlinePresetSvg', () => ({
  __esModule: true,
  default: ({ style }: { style: any }) => (
    <div data-testid="inline-preset-svg" style={style} />
  ),
}));

// Mock the image hover overlay
jest.mock('../GarmentImageHoverOverlay', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  stage: 'In Progress',
  preset_icon_key: 'test-icon',
  preset_fill_color: '#000000',
  preset_outline_color: '#ffffff',
  image_cloud_id: null,
  photo_url: null,
  due_date: null,
  event_date: null,
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  order_id: 'test-order-id',
  shop_id: 'test-shop-id',
  garment_services: [],
  totalPriceCents: 0,
  order: {
    id: 'test-order-id',
    order_number: 'ORD-001',
    shop_id: 'test-shop-id',
    client: {
      id: 'test-client-id',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '+1234567890',
    },
  },
};

const mockShopHours = [
  {
    day_of_week: 1,
    open_time: '09:00',
    close_time: '17:00',
    is_closed: false,
  },
];

const mockCalendarSettings = {
  buffer_time_minutes: 15,
  default_appointment_duration: 60,
};

const renderWithGarmentProvider = (
  component: React.ReactElement,
  garment = mockGarment
) => {
  return render(
    <GarmentProvider initialGarment={garment}>{component}</GarmentProvider>
  );
};

describe('GarmentImageSection - Schedule Appointment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Schedule Appointment button inside client information when client and shopId are provided', () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Client Information')).toBeInTheDocument();
  });

  it('should not render Schedule Appointment button when shopId is not provided', () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId={undefined}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.queryByText('Schedule Appointment')).not.toBeInTheDocument();
  });

  it('should not render Schedule Appointment button when client is not available', () => {
    const garmentWithoutClient = {
      ...mockGarment,
      order: {
        ...mockGarment.order,
        client: null,
      },
    } as any;

    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />,
      garmentWithoutClient
    );

    expect(screen.queryByText('Schedule Appointment')).not.toBeInTheDocument();
    expect(screen.queryByText('Client Information')).not.toBeInTheDocument();
  });

  it('should open appointment dialog when Schedule Appointment button is clicked', async () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
    });
  });

  it('should prefill appointment dialog with client data from garment', async () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('prefilled-client-name')).toHaveTextContent(
        'John Doe'
      );
    });
  });

  it('should call createAppointment when appointment is created', async () => {
    const { createAppointment } = require('@/lib/actions/appointments');
    createAppointment.mockResolvedValue({ id: 'new-appointment-id' });

    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
    });

    const createButton = screen.getByText('Create Appointment');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        shopId: 'test-shop-id',
        clientId: 'test-client-id',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
        type: 'consultation',
        notes: 'Test appointment',
        sendEmail: true,
      });
    });
  });

  it('should close dialog and show success toast after successful appointment creation', async () => {
    const { createAppointment } = require('@/lib/actions/appointments');
    const { toast } = require('sonner');
    createAppointment.mockResolvedValue({ id: 'new-appointment-id' });

    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
    });

    const createButton = screen.getByText('Create Appointment');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Appointment scheduled successfully'),
        expect.objectContaining({
          description: expect.stringContaining('John Doe'),
          duration: 5000,
        })
      );
    });
  });

  it('should handle appointment creation errors gracefully', async () => {
    const { createAppointment } = require('@/lib/actions/appointments');
    const { toast } = require('sonner');
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    createAppointment.mockRejectedValue(
      new Error('Failed to create appointment')
    );

    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
    });

    const createButton = screen.getByText('Create Appointment');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create appointment:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to schedule appointment',
        expect.objectContaining({
          description:
            'Please try again or contact support if the problem persists.',
          duration: 5000,
        })
      );
    });

    consoleSpy.mockRestore();
  });

  it('should close appointment dialog when close button is clicked', async () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const scheduleButton = screen.getByText('Schedule Appointment');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).toBeVisible();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('appointment-dialog')).not.toBeVisible();
    });
  });

  it('should render client information card', () => {
    renderWithGarmentProvider(
      <GarmentImageSection
        clientName="John Doe"
        shopId="test-shop-id"
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });
});
