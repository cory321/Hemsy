import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the OrderFlow context to control state and capture updates
jest.mock('@/contexts/OrderFlowContext', () => {
  const actual = jest.requireActual('@/contexts/OrderFlowContext');
  return {
    ...actual,
    useOrderFlow: jest.fn(),
  };
});

// Mock the PresetGarmentIconModal to immediately call onSave when rendered
jest.mock('@/components/orders/PresetGarmentIconModal', () => {
  return function MockPresetGarmentIconModal(props: any) {
    // Immediately simulate saving a selection when opened
    if (props.open && typeof props.onSave === 'function') {
      props.onSave({
        presetIconKey: 'tops.tshirt',
        presetFillColor: '#ffcccc',
      });
      if (typeof props.onClose === 'function') props.onClose();
    }
    return null;
  };
});

// Mock GarmentImageUpload to avoid Cloudinary dependency in tests
jest.mock('@/components/orders/GarmentImageUpload', () => {
  return function MockGarmentImageUpload() {
    return null;
  };
});

import { useOrderFlow } from '@/contexts/OrderFlowContext';
import Step2GarmentDetails from '@/components/orders/steps/Step2GarmentDetails';

describe('Step2GarmentDetails - preset icon autofill name behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupContext(
    overrides?: Partial<ReturnType<typeof buildContextValue>>
  ) {
    const value = buildContextValue(overrides);
    (useOrderFlow as jest.Mock).mockReturnValue(value);
    return value;
  }

  function buildContextValue(overrides?: Partial<any>) {
    const updateGarment = jest.fn();
    return {
      currentStep: 0,
      setCurrentStep: jest.fn(),
      orderDraft: {
        clientId: '',
        client: undefined,
        garments: [
          {
            id: 'g1',
            name: '',
            notes: '',
            dueDate: undefined,
            eventDate: undefined,
            specialEvent: false,
            services: [],
          },
        ],
        discountCents: 0,
        notes: '',
      },
      updateOrderDraft: jest.fn(),
      addGarment: jest.fn(),
      updateGarment,
      removeGarment: jest.fn(),
      addServiceToGarment: jest.fn(),
      updateServiceInGarment: jest.fn(),
      removeServiceFromGarment: jest.fn(),
      updateGarmentImage: jest.fn(),
      removeGarmentImage: jest.fn(),
      resetOrder: jest.fn(),
      calculateSubtotal: jest.fn(() => 0),
      calculateTotal: jest.fn(() => 0),
      ...overrides,
    };
  }

  it('auto-fills garment name with preset label when empty', async () => {
    const ctx = setupContext();

    render(<Step2GarmentDetails />);

    // Open the preset icon picker by clicking the prompt
    const chooseText = await screen.findByText(/Choose Garment Icon/i);
    fireEvent.click(chooseText);

    // Modal mock will auto-save on open

    // The save should update garment with name label
    expect(ctx.updateGarment).toHaveBeenCalled();
    const lastCall = (ctx.updateGarment as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('g1');
    expect(lastCall?.[1]).toEqual(
      expect.objectContaining({
        presetIconKey: 'tops.tshirt',
        presetFillColor: '#ffcccc',
        name: 'T-Shirt',
      })
    );
  });

  it("doesn't override garment name if already provided", async () => {
    const ctx = setupContext({
      orderDraft: {
        clientId: '',
        client: undefined,
        garments: [
          {
            id: 'g1',
            name: 'Custom Name',
            notes: '',
            dueDate: undefined,
            eventDate: undefined,
            specialEvent: false,
            services: [],
          },
        ],
        discountCents: 0,
        notes: '',
      },
    });

    render(<Step2GarmentDetails />);

    const chooseText = await screen.findByText(/Choose Garment Icon/i);
    fireEvent.click(chooseText);
    // Modal mock will auto-save on open

    expect(ctx.updateGarment).toHaveBeenCalled();
    const lastCall = (ctx.updateGarment as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('g1');
    expect(lastCall?.[1]).toEqual(
      expect.objectContaining({
        presetIconKey: 'tops.tshirt',
        presetFillColor: '#ffcccc',
      })
    );
    // Ensure name is not part of the patch
    expect(lastCall?.[1]).not.toHaveProperty('name');
  });

  it('overrides name if not user-edited even when already set', async () => {
    const ctx = setupContext({
      orderDraft: {
        clientId: '',
        client: undefined,
        garments: [
          {
            id: 'g1',
            name: 'Blouse',
            isNameUserEdited: false,
            notes: '',
            dueDate: undefined,
            eventDate: undefined,
            specialEvent: false,
            services: [],
          },
        ],
        discountCents: 0,
        notes: '',
      },
    });

    render(<Step2GarmentDetails />);

    const chooseText = await screen.findByText(/Choose Garment Icon/i);
    fireEvent.click(chooseText);
    // Modal mock auto-saves selection on open

    expect(ctx.updateGarment).toHaveBeenCalled();
    const lastCall = (ctx.updateGarment as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('g1');
    expect(lastCall?.[1]).toEqual(
      expect.objectContaining({
        presetIconKey: 'tops.tshirt',
        presetFillColor: '#ffcccc',
        name: 'T-Shirt',
      })
    );
  });

  it('typing name marks isNameUserEdited=true', async () => {
    const ctx = setupContext();

    render(<Step2GarmentDetails />);

    // Find the name input and type
    const nameInput = await screen.findByLabelText(
      /Garment Name \(Optional\)/i
    );
    fireEvent.change(nameInput, { target: { value: 'Custom Dress' } });
    expect(ctx.updateGarment).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        name: 'Custom Dress',
        isNameUserEdited: true,
      })
    );
  });
});
