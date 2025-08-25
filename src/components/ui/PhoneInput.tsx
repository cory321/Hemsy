'use client';

import React, { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import {
  formatIncompletePhone,
  isPhoneNumberValid,
  getCleanPhoneNumber,
} from '@/lib/utils/phone';

import { CountryCode } from 'libphonenumber-js';

interface PhoneInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string, isValid: boolean) => void;
  defaultCountry?: CountryCode;
  showValidation?: boolean;
}

/**
 * Phone input component with real-time formatting and validation
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value: externalValue = '',
      onChange,
      defaultCountry = 'US' as CountryCode,
      showValidation = true,
      error: externalError,
      helperText: externalHelperText,
      ...textFieldProps
    },
    ref
  ) => {
    // Store the formatted display value
    const [displayValue, setDisplayValue] = React.useState(() => {
      const initial = formatIncompletePhone(externalValue, defaultCountry);
      return initial || externalValue || '';
    });

    // Get clean value for validation and callbacks (only if displayValue has content)
    const cleanValue = React.useMemo(() => {
      if (!displayValue) return '';
      // Don't process very short inputs to avoid validation warnings
      const digitsOnly = displayValue.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        return digitsOnly;
      }
      try {
        return getCleanPhoneNumber(displayValue, defaultCountry);
      } catch (error) {
        // Return digits only as fallback
        return displayValue.replace(/\D/g, '');
      }
    }, [displayValue, defaultCountry]);

    // Validation states
    const isValid = React.useMemo(() => {
      if (!cleanValue) return false;
      try {
        return isPhoneNumberValid(cleanValue, defaultCountry);
      } catch (error) {
        return false;
      }
    }, [cleanValue, defaultCountry]);

    const isPossible = React.useMemo(() => {
      if (displayValue.length === 0) return false;
      if (isValid) return true;
      // Consider it possible if we have at least 10 digits
      const digitsOnly = displayValue.replace(/\D/g, '');
      return digitsOnly.length >= 10;
    }, [displayValue, isValid]);

    // Sync external value changes
    React.useEffect(() => {
      const formattedExternal = formatIncompletePhone(
        externalValue,
        defaultCountry
      );
      const next = formattedExternal || externalValue || '';
      if (next !== displayValue) {
        setDisplayValue(next);
      }
      // Intentionally exclude displayValue from deps to avoid overriding user typing
      // when externalValue hasn't changed.
    }, [externalValue, defaultCountry]);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        // Format the input as user types
        let formatted = '';
        try {
          formatted = formatIncompletePhone(inputValue, defaultCountry);
        } catch (error) {
          // Fallback to input value if formatting fails
          formatted = inputValue;
        }

        // If formatting returns empty for a non-empty input, fall back to raw input
        if (!formatted && inputValue) {
          formatted = inputValue;
        }

        setDisplayValue(formatted);

        // Get clean value for callback
        let clean = '';
        if (formatted) {
          const digitsOnly = formatted.replace(/\D/g, '');
          if (digitsOnly.length < 7) {
            clean = digitsOnly;
          } else {
            try {
              clean = getCleanPhoneNumber(formatted, defaultCountry);
            } catch (error) {
              // Fallback to digits only
              clean = formatted.replace(/\D/g, '');
            }
          }
        }

        // Call external onChange if provided
        if (onChange) {
          let isValidNumber = false;
          try {
            isValidNumber = clean
              ? isPhoneNumberValid(clean, defaultCountry)
              : false;
          } catch (error) {
            isValidNumber = false;
          }
          onChange(clean, isValidNumber);
        }
      },
      [onChange, defaultCountry]
    );

    // Determine validation state
    const hasError =
      externalError ||
      (showValidation && displayValue.length > 0 && !isPossible);
    const validationHelperText =
      showValidation && displayValue.length > 0 && !isPossible
        ? 'Please enter a valid phone number'
        : '';

    return (
      <TextField
        {...textFieldProps}
        inputRef={ref}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        error={hasError}
        helperText={externalHelperText || validationHelperText}
        inputProps={{
          ...textFieldProps.inputProps,
          'aria-label': 'Phone number',
          autoComplete: 'tel',
          inputMode: 'tel',
          pattern: '[0-9\\s\\(\\)\\-\\+]*',
          placeholder: '(555) 123-4567',
        }}
        FormHelperTextProps={{
          ...textFieldProps.FormHelperTextProps,
          'aria-live': 'polite',
        }}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
