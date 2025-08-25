import {
  parsePhoneNumber,
  AsYouType,
  formatIncompletePhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumberCharacter,
  CountryCode,
} from 'libphonenumber-js';

/**
 * Default country for phone number parsing (US-based business)
 */
const DEFAULT_COUNTRY: CountryCode = 'US';

/**
 * Format a phone number for display purposes
 * @param phone - The phone number string to format
 * @param defaultCountry - The default country code (defaults to US)
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!phone || typeof phone !== 'string') return '';

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatNational();
    }
  } catch (error) {
    // Fall back to simple formatting if parsing fails
    console.warn('Phone number parsing failed:', error);
  }

  // Fallback to basic US formatting for backwards compatibility
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Format a phone number for international display
 * @param phone - The phone number string to format
 * @param defaultCountry - The default country code (defaults to US)
 * @returns Internationally formatted phone number string
 */
export function formatPhoneNumberInternational(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!phone || typeof phone !== 'string') return '';

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
  } catch (error) {
    console.warn('Phone number international formatting failed:', error);
  }

  return formatPhoneNumber(phone, defaultCountry);
}

/**
 * Format an incomplete phone number as the user types
 * @param value - The current input value
 * @param defaultCountry - The default country code (defaults to US)
 * @returns Formatted partial phone number
 */
export function formatIncompletePhone(
  value: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!value || typeof value !== 'string') return '';

  try {
    const digitsOnly = value.replace(/\D/g, '');

    // Special handling for US numbers with 11 digits (country code + number)
    if (
      defaultCountry === 'US' &&
      digitsOnly.length === 11 &&
      digitsOnly.startsWith('1')
    ) {
      // Format as international: +1 (XXX) XXX-XXXX
      const match = digitsOnly.match(/^1(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
      }
    }

    // For partial 11-digit numbers starting with 1
    if (
      defaultCountry === 'US' &&
      digitsOnly.length > 10 &&
      digitsOnly.startsWith('1')
    ) {
      const withoutCountryCode = digitsOnly.substring(1);
      if (withoutCountryCode.length <= 10) {
        // Use AsYouType without country to get international formatting
        const formatter = new AsYouType();
        return formatter.input(digitsOnly);
      }
    }

    // Use AsYouType for standard formatting
    const formatter = new AsYouType(defaultCountry);
    const formatted = formatter.input(value);
    return formatted || value; // Fallback to original value if formatting returns empty
  } catch (error) {
    console.warn('Incomplete phone formatting failed:', error);
    // Fallback to basic US formatting for digits-only input
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && defaultCountry === 'US') {
      const match = digitsOnly.match(/^(\d{3})(\d{3})(\d{4})(.*)$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}${match[4] ? match[4] : ''}`;
      }
    }
    return value;
  }
}

/**
 * Create an AsYouType formatter for real-time phone number formatting
 * @param defaultCountry - The default country code (defaults to US)
 * @returns AsYouType formatter instance
 */
export function createPhoneFormatter(
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): AsYouType {
  return new AsYouType(defaultCountry);
}

/**
 * Parse a character for phone number input (filters invalid characters)
 * @param character - The character to parse
 * @param previousValue - The previous input value
 * @returns The character if valid, undefined if invalid
 */
export function parsePhoneCharacter(
  character: string,
  previousValue: string = ''
): string | undefined {
  // Only allow '+' at the very beginning and only once
  if (character === '+') {
    if (previousValue.length > 0 || previousValue.includes('+')) {
      return undefined;
    }
    return '+';
  }
  return parsePhoneNumberCharacter(character);
}

/**
 * Validate if a phone number is possible (correct length and format)
 * @param phone - The phone number to validate
 * @param defaultCountry - The default country code (defaults to US)
 * @returns True if the phone number is possible
 */
export function isPhoneNumberPossible(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): boolean {
  if (!phone || typeof phone !== 'string') return false;

  try {
    return isPossiblePhoneNumber(phone, defaultCountry);
  } catch (error) {
    console.warn('Phone number possibility check failed:', error);
    return false;
  }
}

/**
 * Validate if a phone number is valid (passes all validation checks)
 * @param phone - The phone number to validate
 * @param defaultCountry - The default country code (defaults to US)
 * @returns True if the phone number is valid
 */
export function isPhoneNumberValid(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): boolean {
  if (!phone || typeof phone !== 'string') return false;

  try {
    return isValidPhoneNumber(phone, defaultCountry);
  } catch (error) {
    console.warn('Phone number validation failed:', error);
    return false;
  }
}

/**
 * Get the clean/raw phone number (digits only with country code)
 * @param phone - The phone number to clean
 * @param defaultCountry - The default country code (defaults to US)
 * @returns Clean phone number in E.164 format or original if parsing fails
 */
export function getCleanPhoneNumber(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!phone || typeof phone !== 'string') return '';

  // Don't attempt to parse very short numbers to avoid warnings
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return digitsOnly;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format
    }
  } catch (error) {
    // Only log warnings in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Phone number cleaning failed:', error);
    }
  }

  // Fallback: return digits only
  return phone.replace(/\D/g, '');
}

/**
 * Get phone number URI for tel: links
 * @param phone - The phone number
 * @param defaultCountry - The default country code (defaults to US)
 * @returns URI string for tel: links
 */
export function getPhoneNumberURI(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!phone || typeof phone !== 'string') return '';

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.getURI();
    }
  } catch (error) {
    console.warn('Phone number URI generation failed:', error);
  }

  // Fallback: basic tel: format
  const cleaned = phone.replace(/\D/g, '');
  return cleaned ? `tel:+1${cleaned}` : '';
}

/**
 * Hook for handling phone input with real-time formatting
 * @param initialValue - Initial phone number value
 * @param defaultCountry - The default country code (defaults to US)
 * @returns Object with formatted value and input handler
 */
export function usePhoneInput(
  initialValue: string = '',
  defaultCountry: CountryCode = DEFAULT_COUNTRY
) {
  const formatter = createPhoneFormatter(defaultCountry);

  // Initialize with existing value if provided
  if (initialValue) {
    formatter.input(initialValue);
  }

  return {
    /**
     * Handle input changes with real-time formatting
     * @param inputValue - The new input value
     * @returns Formatted phone number
     */
    handleInput: (inputValue: string): string => {
      // Reset formatter for new input
      const newFormatter = createPhoneFormatter(defaultCountry);
      return newFormatter.input(inputValue);
    },

    /**
     * Get the current formatted value
     */
    getFormattedValue: (): string => {
      return formatter.input('');
    },

    /**
     * Validate the current phone number
     */
    isValid: (): boolean => {
      const number = formatter.getNumber();
      return number ? number.isValid() : false;
    },
  };
}
