import {
  convertServiceForForm,
  convertServiceForDatabase,
  calculateTotalPrice,
  Service,
  ServiceFormData,
} from '@/lib/utils/serviceUtils';

describe('serviceUtils', () => {
  describe('convertServiceForForm', () => {
    it('should include frequently_used fields when converting service to form data', () => {
      const service: Service = {
        id: '123',
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 2500,
        frequently_used: true,
        frequently_used_position: 1,
      };

      const formData = convertServiceForForm(service);

      expect(formData).toEqual({
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        qty: 1,
        unit: 'flat_rate',
        unit_price: 25,
        frequently_used: true,
        frequently_used_position: 1,
      });
    });

    it('should handle undefined frequently_used fields', () => {
      const service: Service = {
        id: '123',
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 2500,
      };

      const formData = convertServiceForForm(service);

      expect(formData.frequently_used).toBeUndefined();
      expect(formData.frequently_used_position).toBeUndefined();
    });
  });

  describe('convertServiceForDatabase', () => {
    it('should include frequently_used fields when converting form data to database format', () => {
      const formData: ServiceFormData = {
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        qty: 1,
        unit: 'flat_rate',
        unit_price: 25,
        frequently_used: true,
        frequently_used_position: 1,
      };

      const dbData = convertServiceForDatabase(formData);

      expect(dbData).toEqual({
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 2500,
        frequently_used: true,
        frequently_used_position: 1,
      });
    });

    it('should handle false frequently_used value', () => {
      const formData: ServiceFormData = {
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        qty: 1,
        unit: 'flat_rate',
        unit_price: 25,
        frequently_used: false,
        frequently_used_position: null,
      };

      const dbData = convertServiceForDatabase(formData);

      expect(dbData.frequently_used).toBe(false);
      expect(dbData.frequently_used_position).toBeNull();
    });

    it('should handle undefined frequently_used fields', () => {
      const formData: ServiceFormData = {
        name: 'Hem Pants',
        description: 'Basic hem alteration',
        qty: 1,
        unit: 'flat_rate',
        unit_price: 25,
      };

      const dbData = convertServiceForDatabase(formData);

      expect(dbData.frequently_used).toBeUndefined();
      expect(dbData.frequently_used_position).toBeUndefined();
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total for form data with quantity = 1', () => {
      const service = {
        qty: 1,
        unit_price: 50,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$50.00');
    });

    it('should calculate total for form data with quantity > 1', () => {
      const service = {
        qty: 3,
        unit_price: 25.5,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$76.50');
    });

    it('should handle numeric quantity in form data', () => {
      const service = {
        qty: 5,
        unit_price: 20,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$100.00');
    });

    it('should calculate total for database service with quantity = 1', () => {
      const service = {
        default_qty: 1,
        default_unit_price_cents: 5000,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$50.00');
    });

    it('should calculate total for database service with quantity > 1', () => {
      const service = {
        default_qty: 4,
        default_unit_price_cents: 2500,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$100.00');
    });

    it('should handle zero quantity', () => {
      const service = {
        qty: 0,
        unit_price: 50,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$0.00');
    });

    it('should handle missing values', () => {
      const service = {};

      const total = calculateTotalPrice(service);
      expect(total).toBe('$0.00');
    });

    it('should handle zero quantity', () => {
      const service = {
        qty: 0,
        unit_price: 50,
      };

      const total = calculateTotalPrice(service);
      expect(total).toBe('$0.00');
    });
  });
});
