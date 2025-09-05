import { render, screen } from '@testing-library/react';
import { AppointmentTimelineGroup } from '@/components/clients/AppointmentTimelineGroup';
import type { AppointmentGroup } from '@/lib/utils/appointment-grouping';
import type { Appointment } from '@/types';

// Mock the AppointmentCardV2 component
jest.mock('@/components/clients/AppointmentCardV2', () => ({
  AppointmentCardV2: ({ appointment }: { appointment: Appointment }) => (
    <div data-testid={`appointment-card-${appointment.id}`}>
      Mock Appointment Card: {appointment.type} - {appointment.date}
    </div>
  ),
}));

describe('AppointmentTimelineGroup', () => {
  const mockShopId = 'shop-123';
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

  const createMockAppointment = (
    id: string,
    date: string,
    type: string = 'consultation'
  ): Appointment => ({
    id,
    shop_id: mockShopId,
    client_id: 'client-123',
    date,
    start_time: '10:00',
    end_time: '11:00',
    type: type as 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other',
    status: 'confirmed',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const createMockGroup = (
    appointments: Appointment[],
    label: string = 'Today'
  ): AppointmentGroup => ({
    label,
    appointments,
    isCollapsed: false,
  });

  it('renders group label correctly', () => {
    const appointments = [createMockAppointment('1', '2024-01-15')];
    const group = createMockGroup(appointments, 'Today');

    render(
      <AppointmentTimelineGroup
        dateKey="today"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('always shows all appointments without collapse functionality', () => {
    const appointments = [
      createMockAppointment('1', '2024-01-15', 'consultation'),
      createMockAppointment('2', '2024-01-15', 'fitting'),
      createMockAppointment('3', '2024-01-15', 'pickup'),
      createMockAppointment('4', '2024-01-15', 'delivery'),
      createMockAppointment('5', '2024-01-15', 'other'),
    ];
    const group = createMockGroup(appointments, 'This Week');

    render(
      <AppointmentTimelineGroup
        dateKey="week"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    // All appointments should be visible
    expect(screen.getByTestId('appointment-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-4')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-5')).toBeInTheDocument();

    // Should not show "Click to expand" text
    expect(screen.queryByText('Click to expand')).not.toBeInTheDocument();
  });

  it('does not render expand/collapse buttons', () => {
    const appointments = [
      createMockAppointment('1', '2024-01-15'),
      createMockAppointment('2', '2024-01-15'),
      createMockAppointment('3', '2024-01-15'),
      createMockAppointment('4', '2024-01-15'),
      createMockAppointment('5', '2024-01-15'),
    ];
    const group = createMockGroup(appointments, 'Past Appointments');

    render(
      <AppointmentTimelineGroup
        dateKey="past"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    // Should not have any expand/collapse buttons
    expect(screen.queryByLabelText('expand group')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('collapse group')).not.toBeInTheDocument();
  });

  it('applies correct styling for today appointments', () => {
    const appointments = [createMockAppointment('1', '2024-01-15')];
    const group = createMockGroup(appointments, 'Today');

    render(
      <AppointmentTimelineGroup
        dateKey="today"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    const titleElement = screen.getByText('Today');
    // Check that the element exists and has styling applied
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveStyle('color: rgb(25, 118, 210)'); // MUI primary color
  });

  it('renders empty group without appointments', () => {
    const group = createMockGroup([], 'No Appointments');

    render(
      <AppointmentTimelineGroup
        dateKey="empty"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('No Appointments')).toBeInTheDocument();
    // Should not render any appointment cards
    expect(screen.queryByTestId(/appointment-card-/)).not.toBeInTheDocument();
  });

  it('passes correct props to AppointmentCardV2 components', () => {
    const appointments = [
      createMockAppointment('test-appointment', '2024-01-15', 'consultation'),
    ];
    const group = createMockGroup(appointments, 'Test Group');

    render(
      <AppointmentTimelineGroup
        dateKey="today"
        group={group}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
        existingAppointments={appointments}
      />
    );

    // Verify the appointment card is rendered with correct data
    expect(
      screen.getByTestId('appointment-card-test-appointment')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mock Appointment Card: consultation - 2024-01-15')
    ).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    const appointments = [createMockAppointment('1', '2024-01-15')];
    const group = createMockGroup(appointments, 'Basic Group');

    render(
      <AppointmentTimelineGroup
        dateKey="basic"
        group={group}
        shopId={mockShopId}
      />
    );

    expect(screen.getByText('Basic Group')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-1')).toBeInTheDocument();
  });

  it('renders multiple appointment groups correctly', () => {
    const appointments1 = [
      createMockAppointment('1', '2024-01-15', 'consultation'),
    ];
    const appointments2 = [createMockAppointment('2', '2024-01-16', 'fitting')];

    const { rerender } = render(
      <AppointmentTimelineGroup
        dateKey="today"
        group={createMockGroup(appointments1, 'Today')}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-1')).toBeInTheDocument();

    rerender(
      <AppointmentTimelineGroup
        dateKey="tomorrow"
        group={createMockGroup(appointments2, 'Tomorrow')}
        shopId={mockShopId}
        shopHours={mockShopHours}
        calendarSettings={mockCalendarSettings}
      />
    );

    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-2')).toBeInTheDocument();
  });
});
