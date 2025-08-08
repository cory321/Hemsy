import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfirmAppointmentPage from '@/app/confirm/[token]/page';

jest.mock('@/lib/actions/emails/confirmation-tokens', () => ({
  confirmAppointment: jest.fn(),
}));

describe('ConfirmAppointmentPage', () => {
  const {
    confirmAppointment,
  } = require('@/lib/actions/emails/confirmation-tokens');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows success when confirmation succeeds', async () => {
    (confirmAppointment as jest.Mock).mockResolvedValueOnce({
      success: true,
      appointmentId: 'appt-1',
    });

    const params = Promise.resolve({ token: 'tok123' });
    render(await ConfirmAppointmentPage({ params } as any));

    expect(screen.getByTestId('confirmation-success')).toBeInTheDocument();
    expect(
      screen.getByText(/appointment has been confirmed/i)
    ).toBeInTheDocument();
  });

  it('shows error when confirmation fails', async () => {
    (confirmAppointment as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'This confirmation link has expired',
    });

    const params = Promise.resolve({ token: 'bad' });
    render(await ConfirmAppointmentPage({ params } as any));

    expect(screen.getByTestId('confirmation-error')).toBeInTheDocument();
    expect(
      screen.getByText(/confirmation link has expired/i)
    ).toBeInTheDocument();
  });
});
