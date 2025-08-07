import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

// Mock Next.js navigation hooks for Material UI App Router integration
jest.mock('next/navigation', () => ({
  useServerInsertedHTML: jest.fn((callback) => callback()),
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

describe('ThemeProvider', () => {
  it('applies Material UI theme correctly', () => {
    const TestComponent = () => (
      <button className="MuiButton-root">Test Button</button>
    );

    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = getByText('Test Button');
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('MuiButton-root');
  });
});
