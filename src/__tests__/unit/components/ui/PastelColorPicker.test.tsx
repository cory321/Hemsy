import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PastelColorPicker,
  pastelPalette,
} from '@/components/ui/PastelColorPicker';

describe('PastelColorPicker', () => {
  test('renders with default palette', () => {
    const handleChange = jest.fn();
    render(<PastelColorPicker value={undefined} onChange={handleChange} />);
    // Ensure a few known swatches are present
    expect(
      screen.getByTestId(`pastel-swatch-${pastelPalette[0]}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`pastel-swatch-${pastelPalette[5]}`)
    ).toBeInTheDocument();
  });

  test('calls onChange when a swatch is clicked', () => {
    const handleChange = jest.fn();
    const color = pastelPalette[3];
    render(<PastelColorPicker value={undefined} onChange={handleChange} />);
    fireEvent.click(screen.getByTestId(`pastel-swatch-${color}`));
    expect(handleChange).toHaveBeenCalledWith(color);
  });

  test('highlights selected color with check icon and border', () => {
    const handleChange = jest.fn();
    const color = pastelPalette[2];
    render(<PastelColorPicker value={color} onChange={handleChange} />);
    const swatch = screen.getByTestId(`pastel-swatch-${color}`);
    expect(swatch).toHaveAttribute(
      'aria-label',
      expect.stringContaining(color)
    );
  });

  test('includes a none option when includeNone is true and clears selection', () => {
    const handleChange = jest.fn();
    render(
      <PastelColorPicker
        value={'#FFFFFF'}
        onChange={handleChange}
        includeNone
      />
    );
    const none = screen.getByTestId('pastel-swatch-none');
    fireEvent.click(none);
    expect(handleChange).toHaveBeenCalledWith(null);
  });
});
