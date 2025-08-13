import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsClient } from '@/app/(app)/settings/SettingsClient';
import { pastelPalette } from '@/components/ui/PastelColorPicker';

jest.mock('@/lib/actions/shops', () => ({
  getShopBusinessInfo: jest.fn().mockResolvedValue({
    success: true,
    data: {
      business_name: 'Test Shop',
      email: 'shop@example.com',
      phone_number: '555-111-2222',
      mailing_address: '123 Main St',
      location_type: 'shop_location',
      payment_preference: 'after_service',
    },
  }),
  updateShopBusinessInfo: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('SettingsClient - PastelColorPicker demo', () => {
  it('renders the demo and updates selected color when a swatch is clicked', async () => {
    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByText('Business Information')).toBeInTheDocument();
    });

    const demoHeading = screen.getByText('Brand Color (Pastel Demo)');
    expect(demoHeading).toBeInTheDocument();

    // Initially shows no color selected
    expect(screen.getByText('No color selected')).toBeInTheDocument();

    const color = pastelPalette[0];
    const swatch = screen.getByTestId(`pastel-swatch-${color}`);
    fireEvent.click(swatch);

    expect(screen.getByText(color)).toBeInTheDocument();
  });
});
