import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/(marketing)/page';

describe('Marketing HomePage', () => {
  const { auth } = require('@clerk/nextjs/server');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Go to Dashboard when signed in', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: 'user-1' });

    render(await HomePage());

    expect(
      screen.getByRole('link', { name: /go to dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /start free trial/i })
    ).not.toBeInTheDocument();
  });

  it('shows Start Free Trial when signed out', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    render(await HomePage());

    expect(
      screen.getByRole('link', { name: /start free trial/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /go to dashboard/i })
    ).not.toBeInTheDocument();
  });
});
