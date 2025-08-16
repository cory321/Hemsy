import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

// Mock modal to immediately trigger onSave
jest.mock('@/components/orders/PresetGarmentIconModal', () => {
  return function MockPresetGarmentIconModal(props: any) {
    if (props.open && typeof props.onSave === 'function') {
      props.onSave({
        presetIconKey: 'tops.tshirt',
        presetFillColor: '#abcdef',
      });
      if (typeof props.onClose === 'function') props.onClose();
    }
    return null;
  };
});

// Mock server action
jest.mock('@/lib/actions/garments', () => ({
  updateGarment: jest.fn(async () => ({ success: true })),
}));

import ChangeGarmentIconButton from '@/app/(app)/garments/[id]/ChangeGarmentIconButton';
import { updateGarment } from '@/lib/actions/garments';

describe('ChangeGarmentIconButton', () => {
  it('opens modal and updates garment on save', async () => {
    render(
      <ChangeGarmentIconButton
        garmentId="g-123"
        initialKey={null}
        initialFill={null}
      />
    );

    const btn = screen.getByRole('button', { name: /change garment icon/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(updateGarment).toHaveBeenCalledWith({
        garmentId: 'g-123',
        updates: {
          presetIconKey: 'tops.tshirt',
          presetFillColor: '#abcdef',
        },
      });
    });
  });
});
