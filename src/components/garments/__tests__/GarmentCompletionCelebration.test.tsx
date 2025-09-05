import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock ConfettiCelebration to a simple marker element so we can assert rendering
jest.mock('@/components/celebration/ConfettiCelebration', () => ({
  __esModule: true,
  default: () => <div data-testid="confetti" />,
}));

// We'll swap the garment payload per test via this variable
let mockGarment: any = {};

jest.mock('@/contexts/GarmentContext', () => ({
  __esModule: true,
  useGarment: () => ({ garment: mockGarment }),
}));

import GarmentCompletionCelebration from '../GarmentCompletionCelebration';

describe('GarmentCompletionCelebration', () => {
  it('does not render confetti on initial mount even if already completed', () => {
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: true, is_removed: false },
      ],
    };

    render(<GarmentCompletionCelebration />);
    expect(screen.queryByTestId('confetti')).toBeNull();
  });

  it('does not render confetti when any active service is not done', () => {
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
      ],
    };

    render(<GarmentCompletionCelebration />);
    expect(screen.queryByTestId('confetti')).toBeNull();
  });

  it('ignores removed services when evaluating completion and triggers on transition', () => {
    // Start incomplete due to an active not-done service
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
      ],
    };

    const { rerender } = render(<GarmentCompletionCelebration />);
    expect(screen.queryByTestId('confetti')).toBeNull();

    // Transition to completed; second service becomes removed (ignored)
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: true },
      ],
    };
    rerender(<GarmentCompletionCelebration />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
  });

  it('re-triggers when toggling a service to incomplete then complete', () => {
    // Start incomplete
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
      ],
    };
    const { rerender } = render(<GarmentCompletionCelebration />);
    expect(screen.queryByTestId('confetti')).toBeNull();

    // Complete -> should trigger first time
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: true, is_removed: false },
      ],
    };
    rerender(<GarmentCompletionCelebration />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();

    // Toggle back to incomplete
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
      ],
    };
    rerender(<GarmentCompletionCelebration />);
    expect(screen.queryByTestId('confetti')).toBeNull();

    // And back to complete -> should trigger again
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: true, is_removed: false },
      ],
    };
    rerender(<GarmentCompletionCelebration />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
  });
});
