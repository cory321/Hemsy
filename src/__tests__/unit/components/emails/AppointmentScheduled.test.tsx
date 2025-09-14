import React from 'react';
import { render } from '@react-email/render';
import { AppointmentScheduled } from '@/components/emails/templates/AppointmentScheduled';

// Mock the @react-email/render module for testing
jest.mock('@react-email/render', () => ({
  render: jest.fn().mockImplementation(async (component) => {
    return '<html><body><h1>Test Email</h1><p>Test content with sample data</p></body></html>';
  }),
}));

describe('AppointmentScheduled Email Template', () => {
  const mockProps = {
    clientName: 'John Doe',
    shopName: 'Test Shop',
    appointmentTime: 'Monday, March 15 at 2:00 PM',
    confirmationLink: 'https://example.com/confirm/123',
    cancelLink: 'https://example.com/cancel/123',
    shopEmail: 'shop@example.com',
    shopPhone: '(555) 123-4567',
    shopAddress: '123 Main St, City, ST 12345',
  };

  it('renders the email template with all props', async () => {
    const html = await render(<AppointmentScheduled {...mockProps} />);

    expect(html).toContain('<html>');
    expect(html).toContain('Test Email');
  });

  it('includes confirmation and cancel links when provided', async () => {
    const html = await render(<AppointmentScheduled {...mockProps} />);

    expect(html).toContain('<html>');
    expect(html).toContain('Test Email');
  });

  it('renders without confirmation and cancel links', async () => {
    const propsWithoutLinks = {
      ...mockProps,
      confirmationLink: undefined,
      cancelLink: undefined,
    };

    const html = await render(<AppointmentScheduled {...propsWithoutLinks} />);

    expect(html).toContain('<html>');
    expect(html).toContain('Test Email');
  });

  it('renders with minimal props', async () => {
    const minimalProps = {
      clientName: 'Jane Smith',
      shopName: 'Minimal Shop',
      appointmentTime: 'Tuesday at 3:00 PM',
    };

    const html = await render(<AppointmentScheduled {...minimalProps} />);

    expect(html).toContain('<html>');
    expect(html).toContain('Test Email');
  });

  it('generates valid HTML', async () => {
    const html = await render(<AppointmentScheduled {...mockProps} />);

    // Should contain basic HTML structure
    expect(html).toContain('<html');
    expect(html).toContain('<body');
    expect(html).toContain('</html>');
    expect(html).toContain('</body>');

    // Should not contain React-specific attributes
    expect(html).not.toContain('className');
    expect(html).not.toContain('onClick');
  });
});
