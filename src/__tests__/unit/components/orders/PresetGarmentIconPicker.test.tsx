import { render, screen, fireEvent } from '@testing-library/react';
import PresetGarmentIconPicker from '@/components/orders/PresetGarmentIconPicker';

describe('PresetGarmentIconPicker', () => {
  it('renders categories and items, and calls onChange when selecting', () => {
    const onChange = jest.fn();
    render(<PresetGarmentIconPicker value={undefined} onChange={onChange} />);

    // Basic smoke checks for a couple of labels
    expect(screen.getByText('Tops')).toBeInTheDocument();
    expect(screen.getByText('Bottoms')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();
    expect(screen.getByText('Non-Wearable')).toBeInTheDocument();

    // Pick an item
    const tshirt = screen.getByText('T-Shirt');
    fireEvent.click(tshirt);
    expect(onChange).toHaveBeenCalled();
  });

  it('shows Selected chip and allows clearing selection', () => {
    const onChange = jest.fn();
    render(
      <PresetGarmentIconPicker value={'tops.t_shirt'} onChange={onChange} />
    );

    expect(screen.getByText('Selected')).toBeInTheDocument();

    // Trigger deletion via keyboard on the chip button
    const chipButton = screen.getByRole('button', { name: 'Selected' });
    chipButton.focus();
    fireEvent.keyDown(chipButton, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
