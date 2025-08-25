import {
  formatPhoneNumber,
  formatPhoneNumberInternational,
  formatIncompletePhone,
  createPhoneFormatter,
  parsePhoneCharacter,
  isPhoneNumberPossible,
  isPhoneNumberValid,
  getCleanPhoneNumber,
  getPhoneNumberURI,
  usePhoneInput,
} from '../phone';

describe('Phone Number Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('should format valid US phone numbers', () => {
      expect(formatPhoneNumber('2133734253')).toBe('(213) 373-4253');
      expect(formatPhoneNumber('(213) 373-4253')).toBe('(213) 373-4253');
      expect(formatPhoneNumber('+12133734253')).toBe('(213) 373-4253');
      expect(formatPhoneNumber('213-373-4253')).toBe('(213) 373-4253');
    });

    it('should handle different country codes', () => {
      expect(formatPhoneNumber('+447911123456', 'GB')).toContain(
        '07911 123456'
      );
      expect(formatPhoneNumber('07911123456', 'GB')).toContain('07911 123456');
    });

    it('should handle invalid phone numbers gracefully', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('invalid')).toBe('invalid');
    });

    it('should fallback to basic US formatting for invalid but digit-containing numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should handle null and undefined inputs', () => {
      expect(formatPhoneNumber(null as any)).toBe('');
      expect(formatPhoneNumber(undefined as any)).toBe('');
    });
  });

  describe('formatPhoneNumberInternational', () => {
    it('should format phone numbers internationally', () => {
      expect(formatPhoneNumberInternational('2133734253')).toBe(
        '+1 213 373 4253'
      );
      expect(formatPhoneNumberInternational('+12133734253')).toBe(
        '+1 213 373 4253'
      );
    });

    it('should handle different countries', () => {
      expect(formatPhoneNumberInternational('+447911123456', 'GB')).toContain(
        '+44'
      );
    });

    it('should fallback to national format for invalid numbers', () => {
      expect(formatPhoneNumberInternational('invalid')).toBe('invalid');
    });
  });

  describe('formatIncompletePhone', () => {
    it('should format incomplete phone numbers as user types', () => {
      expect(formatIncompletePhone('2')).toBe('2');
      expect(formatIncompletePhone('21')).toBe('21');
      expect(formatIncompletePhone('213')).toBe('(213)');
      expect(formatIncompletePhone('2133')).toBe('(213) 3');
      expect(formatIncompletePhone('21337')).toBe('(213) 37');
      expect(formatIncompletePhone('2133734')).toBe('(213) 373-4');
    });

    it('should handle international numbers', () => {
      expect(formatIncompletePhone('+1213')).toBe('+1 213');
      expect(formatIncompletePhone('+12133')).toBe('+1 213 3');
    });

    it('should handle empty input', () => {
      expect(formatIncompletePhone('')).toBe('');
    });
  });

  describe('createPhoneFormatter', () => {
    it('should create AsYouType formatter', () => {
      const formatter = createPhoneFormatter();
      expect(formatter).toBeDefined();
      expect(typeof formatter.input).toBe('function');
    });

    it('should create formatter with specific country', () => {
      const formatter = createPhoneFormatter('GB');
      expect(formatter).toBeDefined();
    });
  });

  describe('parsePhoneCharacter', () => {
    it('should allow valid phone characters', () => {
      expect(parsePhoneCharacter('+', '')).toBe('+');
      expect(parsePhoneCharacter('1', '+')).toBe('1');
      expect(parsePhoneCharacter('2', '+1')).toBe('2');
    });

    it('should reject invalid characters', () => {
      expect(parsePhoneCharacter('a', '+1')).toBeUndefined();
      expect(parsePhoneCharacter(' ', '+1')).toBeUndefined();
      expect(parsePhoneCharacter('(', '+1')).toBeUndefined();
    });

    it('should only allow + at the beginning', () => {
      expect(parsePhoneCharacter('+', '')).toBe('+');
      expect(parsePhoneCharacter('+', '123')).toBeUndefined();
    });
  });

  describe('isPhoneNumberPossible', () => {
    it('should validate possible phone numbers', () => {
      expect(isPhoneNumberPossible('2133734253')).toBe(true);
      expect(isPhoneNumberPossible('+12133734253')).toBe(true);
      expect(isPhoneNumberPossible('(213) 373-4253')).toBe(true);
    });

    it('should reject impossible phone numbers', () => {
      expect(isPhoneNumberPossible('123')).toBe(false);
      expect(isPhoneNumberPossible('')).toBe(false);
      expect(isPhoneNumberPossible('abcd')).toBe(false);
    });

    it('should handle different countries', () => {
      expect(isPhoneNumberPossible('07911123456', 'GB')).toBe(true);
      expect(isPhoneNumberPossible('+447911123456', 'GB')).toBe(true);
    });
  });

  describe('isPhoneNumberValid', () => {
    it('should validate valid phone numbers', () => {
      expect(isPhoneNumberValid('2133734253')).toBe(true);
      expect(isPhoneNumberValid('+12133734253')).toBe(true);
      expect(isPhoneNumberValid('(213) 373-4253')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isPhoneNumberValid('1111111111')).toBe(false); // Invalid US number
      expect(isPhoneNumberValid('123')).toBe(false);
      expect(isPhoneNumberValid('')).toBe(false);
    });

    it('should handle different countries', () => {
      expect(isPhoneNumberValid('07911123456', 'GB')).toBe(true);
      expect(isPhoneNumberValid('+447911123456', 'GB')).toBe(true);
    });
  });

  describe('getCleanPhoneNumber', () => {
    it('should return E.164 format for valid numbers', () => {
      expect(getCleanPhoneNumber('2133734253')).toBe('+12133734253');
      expect(getCleanPhoneNumber('(213) 373-4253')).toBe('+12133734253');
      expect(getCleanPhoneNumber('+1-213-373-4253')).toBe('+12133734253');
    });

    it('should fallback to digits only for invalid numbers', () => {
      expect(getCleanPhoneNumber('abc-123-def')).toBe('123');
      expect(getCleanPhoneNumber('(invalid)')).toBe('');
    });

    it('should handle empty input', () => {
      expect(getCleanPhoneNumber('')).toBe('');
    });
  });

  describe('getPhoneNumberURI', () => {
    it('should generate tel URIs for valid numbers', () => {
      expect(getPhoneNumberURI('2133734253')).toBe('tel:+12133734253');
      expect(getPhoneNumberURI('(213) 373-4253')).toBe('tel:+12133734253');
      expect(getPhoneNumberURI('+12133734253')).toBe('tel:+12133734253');
    });

    it('should handle different countries', () => {
      expect(getPhoneNumberURI('07911123456', 'GB')).toContain(
        'tel:+447911123456'
      );
    });

    it('should fallback for invalid numbers', () => {
      expect(getPhoneNumberURI('1234567890')).toBe('tel:+11234567890');
      expect(getPhoneNumberURI('')).toBe('');
    });
  });

  describe('usePhoneInput', () => {
    it('should provide phone input utilities', () => {
      const phoneInput = usePhoneInput('2133734253');

      expect(phoneInput.handleInput).toBeDefined();
      expect(phoneInput.getFormattedValue).toBeDefined();
      expect(phoneInput.isValid).toBeDefined();
      expect(typeof phoneInput.handleInput).toBe('function');
    });

    it('should handle input formatting', () => {
      const phoneInput = usePhoneInput();
      const formatted = phoneInput.handleInput('2133734253');

      expect(formatted).toContain('213');
    });

    it('should validate phone numbers', () => {
      const phoneInput = usePhoneInput('2133734253');
      expect(phoneInput.isValid()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed input gracefully', () => {
      expect(() => formatPhoneNumber('++123')).not.toThrow();
      expect(() => formatPhoneNumber('   ')).not.toThrow();
      expect(() => formatPhoneNumber('123abc456def789')).not.toThrow();
    });

    it('should handle very long numbers', () => {
      const longNumber = '1234567890123456789';
      expect(() => formatPhoneNumber(longNumber)).not.toThrow();
    });

    it('should handle numbers with extensions', () => {
      expect(formatPhoneNumber('2133734253 ext 123')).toContain('213');
    });

    it('should handle international prefixes', () => {
      expect(formatPhoneNumber('011-44-7911-123456', 'US')).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid calls efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        formatPhoneNumber('2133734253');
      }

      const end = Date.now();
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
