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
  it('renders confetti when all non-removed services are done', () => {
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: true, is_removed: false },
      ],
    };

    render(<GarmentCompletionCelebration />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
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

  it('ignores removed services when evaluating completion', () => {
    mockGarment = {
      garment_services: [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: true },
      ],
    };

    render(<GarmentCompletionCelebration />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
  });
});
