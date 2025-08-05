import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@mui/material';
import { ThemeProvider } from '../providers/ThemeProvider';

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

// Example test component
const TestButton = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <ThemeProvider>
    <Button onClick={onClick}>{children}</Button>
  </ThemeProvider>
);

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<TestButton>Click me</TestButton>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<TestButton onClick={handleClick}>Click me</TestButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has minimum touch target size', () => {
    render(<TestButton>Click me</TestButton>);
    const button = screen.getByRole('button', { name: 'Click me' });

    // MUI Button should have minimum 44px height as per our theme
    expect(button).toHaveStyle('min-height: 44px');
  });
});
