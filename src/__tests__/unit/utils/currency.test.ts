import {
  formatAsCurrency,
  parseFloatFromCurrency,
  formatCurrency,
  dollarsToCents,
  centsToDollars,
  formatCentsAsCurrency,
} from '@/lib/utils/currency';

describe('currency utils', () => {
  describe('formatAsCurrency', () => {
    it('should format basic numbers correctly', () => {
      expect(formatAsCurrency('123')).toBe('123');
      expect(formatAsCurrency('1234')).toBe('1,234');
      expect(formatAsCurrency('1234567')).toBe('1,234,567');
    });

    it('should handle decimal values', () => {
      expect(formatAsCurrency('123.45')).toBe('123.45');
      expect(formatAsCurrency('1234.567')).toBe('1,234.56'); // Limits to 2 decimal places
      expect(formatAsCurrency('0.99')).toBe('0.99');
    });

    it('should remove non-numeric characters', () => {
      expect(formatAsCurrency('$123.45')).toBe('123.45');
      expect(formatAsCurrency('1,234.56')).toBe('1,234.56');
      expect(formatAsCurrency('abc123def')).toBe('123');
    });

    it('should handle multiple periods by keeping only the first', () => {
      expect(formatAsCurrency('123.45.67')).toBe('123.45');
      expect(formatAsCurrency('12.3.4.5')).toBe('12.34');
      expect(formatAsCurrency('...123.45')).toBe('0.12');
      expect(formatAsCurrency('123...45')).toBe('123.45');
    });

    it('should handle edge cases', () => {
      expect(formatAsCurrency('')).toBe('');
      expect(formatAsCurrency('.')).toBe('0.');
      expect(formatAsCurrency('.99')).toBe('0.99');
      expect(formatAsCurrency('0')).toBe('0');
    });
  });

  describe('parseFloatFromCurrency', () => {
    it('should parse basic numbers correctly', () => {
      expect(parseFloatFromCurrency('123')).toBe(123);
      expect(parseFloatFromCurrency('123.45')).toBe(123.45);
      expect(parseFloatFromCurrency('0.99')).toBe(0.99);
    });

    it('should handle formatted currency', () => {
      expect(parseFloatFromCurrency('$123.45')).toBe(123.45);
      expect(parseFloatFromCurrency('1,234.56')).toBe(1234.56);
      expect(parseFloatFromCurrency('$1,234,567.89')).toBe(1234567.89);
    });

    it('should handle multiple periods by keeping only the first', () => {
      expect(parseFloatFromCurrency('123.45.67')).toBe(123.4567);
      expect(parseFloatFromCurrency('12.3.4.5')).toBe(12.345);
      expect(parseFloatFromCurrency('...123.45')).toBe(0.12345);
    });

    it('should return 0 for invalid inputs', () => {
      expect(parseFloatFromCurrency('')).toBe(0);
      expect(parseFloatFromCurrency('abc')).toBe(0);
      expect(parseFloatFromCurrency('.')).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(dollarsToCents(1)).toBe(100);
      expect(dollarsToCents(123.45)).toBe(12345);
      expect(dollarsToCents(0.99)).toBe(99);
      expect(dollarsToCents(0.999)).toBe(100); // Rounds
      expect(dollarsToCents(0.994)).toBe(99); // Rounds
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars correctly', () => {
      expect(centsToDollars(100)).toBe(1);
      expect(centsToDollars(12345)).toBe(123.45);
      expect(centsToDollars(99)).toBe(0.99);
      expect(centsToDollars(0)).toBe(0);
    });
  });

  describe('formatCentsAsCurrency', () => {
    it('should format cents as currency correctly', () => {
      expect(formatCentsAsCurrency(100)).toBe('$1.00');
      expect(formatCentsAsCurrency(12345)).toBe('$123.45');
      expect(formatCentsAsCurrency(99)).toBe('$0.99');
      expect(formatCentsAsCurrency(0)).toBe('$0.00');
    });
  });
});
