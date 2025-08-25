import { useState, useCallback } from 'react';
import { AsYouType, CountryCode } from 'libphonenumber-js';
import {
  formatPhoneNumber,
  isPhoneNumberValid,
  parsePhoneCharacter,
} from '@/lib/utils/phone';

interface UsePhoneInputOptions {
  defaultCountry?: CountryCode;
  initialValue?: string;
  onChange?: (value: string, isValid: boolean) => void;
}

interface UsePhoneInputReturn {
  value: string;
  formattedValue: string;
  isValid: boolean;
  isPossible: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInput: (inputValue: string) => void;
  setValue: (value: string) => void;
  reset: () => void;
}

/**
 * Custom hook for handling phone number input with real-time formatting
 */
export function usePhoneInput({
  defaultCountry = 'US' as CountryCode,
  initialValue = '',
  onChange,
}: UsePhoneInputOptions = {}): UsePhoneInputReturn {
  const [value, setValue] = useState(initialValue);
  const [formatter] = useState(() => new AsYouType(defaultCountry));

  // Format the current value
  const formattedValue = formatPhoneNumber(value, defaultCountry);

  // Validation states
  const isValid = isPhoneNumberValid(value, defaultCountry);
  const isPossible =
    value.length > 0 && (isValid || value.replace(/\D/g, '').length >= 10);

  const handleInput = useCallback(
    (inputValue: string) => {
      // Store the clean digits only
      const cleanValue = inputValue.replace(/\D/g, '');
      setValue(cleanValue);

      // Call onChange callback if provided
      if (onChange) {
        onChange(cleanValue, isPhoneNumberValid(cleanValue, defaultCountry));
      }
    },
    [defaultCountry, onChange]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      handleInput(inputValue);
    },
    [handleInput]
  );

  const setPhoneValue = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue, isPhoneNumberValid(newValue, defaultCountry));
      }
    },
    [defaultCountry, onChange]
  );

  const reset = useCallback(() => {
    setValue('');
    if (onChange) {
      onChange('', false);
    }
  }, [onChange]);

  return {
    value,
    formattedValue,
    isValid,
    isPossible,
    handleChange,
    handleInput,
    setValue: setPhoneValue,
    reset,
  };
}
