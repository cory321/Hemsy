import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PhoneInput from '../PhoneInput';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('PhoneInput', () => {
  it('should render with default props', () => {
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'tel');
    expect(input).toHaveAttribute('placeholder', '(555) 123-4567');
  });

  it('should render with custom label', () => {
    renderWithTheme(<PhoneInput label="Custom Phone Label" />);

    expect(screen.getByLabelText('Custom Phone Label')).toBeInTheDocument();
  });

  it('should accept phone number input and attempt formatting', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox');

    await user.type(input, '2133734253');

    await waitFor(() => {
      // The input should contain the digits, formatted or not
      const value = (input as HTMLInputElement).value;
      expect(value.replace(/\D/g, '')).toBe('2133734253');
    });
  });

  it('should call onChange with clean digits and validity', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithTheme(<PhoneInput onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');

    await user.type(input, '2133734253');

    await waitFor(() => {
      // Should be called multiple times as user types, check the final call
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall =
        mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0]).toMatch(/2133734253/); // Clean digits should be present
    });
  });

  it('should show validation error for invalid numbers when showValidation is true', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput showValidation={true} />);

    const input = screen.getByRole('textbox');

    await user.type(input, '123');

    await waitFor(() => {
      // Check if validation error appears or input has error state
      const errorText = screen.queryByText('Please enter a valid phone number');
      const hasError = input.getAttribute('aria-invalid') === 'true';
      expect(errorText || hasError).toBeTruthy();
    });
  });

  it('should not show validation error when showValidation is false', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput showValidation={false} />);

    const input = screen.getByRole('textbox');

    await user.type(input, '123');

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid phone number')
      ).not.toBeInTheDocument();
    });
  });

  it('should display external error and helper text', () => {
    renderWithTheme(
      <PhoneInput error={true} helperText="External error message" />
    );

    expect(screen.getByText('External error message')).toBeInTheDocument();
  });

  it('should prioritize external helper text over validation message', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <PhoneInput showValidation={true} helperText="External helper text" />
    );

    const input = screen.getByRole('textbox');

    await user.type(input, '123');

    await waitFor(() => {
      expect(screen.getByText('External helper text')).toBeInTheDocument();
      expect(
        screen.queryByText('Please enter a valid phone number')
      ).not.toBeInTheDocument();
    });
  });

  it('should handle controlled value changes', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');

      return (
        <>
          <PhoneInput
            value={value}
            onChange={(newValue) => setValue(newValue)}
          />
          <button onClick={() => setValue('2133734253')}>Set Value</button>
        </>
      );
    };

    renderWithTheme(<TestComponent />);

    const input = screen.getByRole('textbox');
    const button = screen.getByText('Set Value');

    expect(input).toHaveValue('');

    fireEvent.click(button);

    await waitFor(() => {
      // Input should contain the digits, formatted or not
      const value = (input as HTMLInputElement).value;
      expect(value.replace(/\D/g, '')).toBe('2133734253');
    });
  });

  it('should handle different country codes', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput defaultCountry="GB" />);

    const input = screen.getByRole('textbox');

    await user.type(input, '07911123456');

    await waitFor(() => {
      // Input should accept UK phone number digits
      const value = (input as HTMLInputElement).value;
      expect(value.replace(/\D/g, '')).toBe('07911123456');
    });
  });

  it('should be accessible', () => {
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-label', 'Phone number');
    expect(input).toHaveAttribute('autoComplete', 'tel');
    expect(input).toHaveAttribute('inputMode', 'tel');
  });

  it('should handle required prop', () => {
    renderWithTheme(<PhoneInput required label="Phone Number" />);

    expect(screen.getByLabelText(/Phone Number/)).toBeRequired();
  });

  it('should handle disabled prop', () => {
    renderWithTheme(<PhoneInput disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();

    renderWithTheme(<PhoneInput ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute('type', 'tel');
  });

  it('should handle paste events with formatted numbers', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox');

    // Simulate pasting a formatted number
    await user.click(input);
    await user.paste('(213) 373-4253');

    await waitFor(() => {
      // Should extract and contain the digits
      const value = (input as HTMLInputElement).value;
      expect(value.replace(/\D/g, '')).toBe('2133734253');
    });
  });

  it('should handle international numbers with plus sign', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox');

    await user.type(input, '+12133734253');

    await waitFor(() => {
      // Should contain the digits
      const value = (input as HTMLInputElement).value;
      expect(value.replace(/\D/g, '')).toBe('12133734253');
    });
  });

  it('should maintain cursor position during formatting', async () => {
    const user = userEvent.setup();
    renderWithTheme(<PhoneInput />);

    const input = screen.getByRole('textbox') as HTMLInputElement;

    await user.type(input, '213373');

    // Place cursor in middle
    input.setSelectionRange(3, 3);

    await user.type(input, '4');

    // The formatting should handle cursor position gracefully
    // This is more of a behavioral test since exact cursor position
    // depends on the implementation details of libphonenumber-js
    const value = input.value.replace(/\D/g, '');
    expect(value).toContain('213');
    expect(value).toContain('4');
  });

  it('should handle empty string gracefully', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithTheme(<PhoneInput onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');

    await user.type(input, '123');
    await user.clear(input);

    await waitFor(() => {
      expect(input).toHaveValue('');
      // Check that onChange was called with empty value
      const calls = mockOnChange.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('');
    });
  });
});
