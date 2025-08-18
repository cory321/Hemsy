import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

// Do not mock next/link because MUI Button uses it as component

describe('Global NotFound page', () => {
  it('renders heading and actions', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { name: /page not found/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('404')).toBeInTheDocument();

    const home = screen.getByRole('link', { name: /go home/i });
    const dash = screen.getByRole('link', { name: /go to dashboard/i });
    expect(home).toHaveAttribute('href', '/');
    expect(dash).toHaveAttribute('href', '/dashboard');
  });
});
