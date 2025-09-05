import { render } from '@testing-library/react';
import ConfettiCelebration from '../ConfettiCelebration';

jest.useFakeTimers();

describe('ConfettiCelebration', () => {
  it('skips animation when prefers-reduced-motion is reduce', async () => {
    const matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    (window as any).matchMedia = matchMedia;

    const confettiMock = jest.fn();
    jest.mock('canvas-confetti', () => ({
      __esModule: true,
      default: confettiMock,
    }));

    render(<ConfettiCelebration durationMs={500} particleCount={10} />);

    // No timers should run because animation is skipped
    jest.advanceTimersByTime(1000);
    expect(confettiMock).not.toHaveBeenCalled();
  });
});
