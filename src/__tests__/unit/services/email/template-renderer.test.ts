import { TemplateRenderer } from '@/lib/services/email/template-renderer';
import { EmailTemplate } from '@/types/email';

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer();

  describe('render', () => {
    it('substitutes variables correctly', () => {
      const template = {
        subject: 'Hello {name}',
        body: 'Your appointment is at {time} with {shop_name}.',
      };

      const data = {
        name: 'John Doe',
        time: '2:00 PM',
        shop_name: 'Best Tailors',
      };

      const result = renderer.render(template, data);

      expect(result.subject).toBe('Hello John Doe');
      expect(result.body).toBe(
        'Your appointment is at 2:00 PM with Best Tailors.'
      );
    });

    it('leaves unmatched variables as placeholders', () => {
      const template = {
        subject: 'Hello {name}',
        body: 'Your {item} is ready.',
      };

      const data = {
        name: 'John Doe',
        // 'item' is missing
      };

      const result = renderer.render(template, data);

      expect(result.subject).toBe('Hello John Doe');
      expect(result.body).toBe('Your {item} is ready.');
    });

    it('handles special characters in values', () => {
      const template = {
        subject: 'Order for {name}',
        body: 'Amount: {amount}',
      };

      const data = {
        name: "O'Brien & Sons",
        amount: '$100.00',
      };

      const result = renderer.render(template, data);

      expect(result.subject).toBe("Order for O'Brien & Sons");
      expect(result.body).toBe('Amount: $100.00');
    });

    it('escapes HTML when option is enabled', () => {
      const template = {
        subject: 'Order for {name}',
        body: 'Message: {message}',
      };

      const data = {
        name: 'John <script>alert("xss")</script>',
        message: 'Hello & welcome to "our" shop!',
      };

      const result = renderer.render(template, data, { escapeHtml: true });

      expect(result.subject).toBe(
        'Order for John &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(result.body).toBe(
        'Message: Hello &amp; welcome to &quot;our&quot; shop!'
      );
    });
  });

  describe('extractVariables', () => {
    it('extracts all unique variables', () => {
      const template =
        'Hello {name}, your {item} and {item} are ready at {shop_name}.';
      const variables = renderer.extractVariables(template);

      expect(variables).toEqual(['name', 'item', 'shop_name']);
    });

    it('handles templates with no variables', () => {
      const template = 'Hello, your order is ready.';
      const variables = renderer.extractVariables(template);

      expect(variables).toEqual([]);
    });

    it('extracts variables with underscores and numbers', () => {
      const template =
        'Hello {client_name}, your {item_1} and {item_2} are ready.';
      const variables = renderer.extractVariables(template);

      expect(variables).toEqual(['client_name', 'item_1', 'item_2']);
    });
  });

  describe('validateTemplate', () => {
    it('validates correct template', () => {
      const template = {
        subject: 'Appointment with {shop_name}',
        body: 'Hi {client_name}, see you at {appointment_time}.',
      };

      const result = renderer.validateTemplate(
        template,
        'appointment_scheduled'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('catches unknown variables', () => {
      const template = {
        subject: 'Appointment with {shop_name}',
        body: 'Hi {customer_name}, see you at {appointment_time}.', // wrong variable
      };

      const result = renderer.validateTemplate(
        template,
        'appointment_scheduled'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown variables: customer_name');
    });

    it('handles multiple unknown variables', () => {
      const template = {
        subject: 'Appointment with {business_name}',
        body: 'Hi {customer_name}, see you at {time}.', // multiple wrong variables
      };

      const result = renderer.validateTemplate(
        template,
        'appointment_scheduled'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('business_name, customer_name, time');
    });
  });

  describe('renderPreview', () => {
    it('renders with sample data', () => {
      const template: EmailTemplate = {
        id: '1',
        email_type: 'appointment_scheduled',
        subject: 'Appointment with {shop_name}',
        body: 'Hi {client_name}, see you at {appointment_time}.',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
      };

      const result = renderer.renderPreview(template, 'appointment_scheduled');

      expect(result.subject).toContain("Sarah's Alterations");
      expect(result.body).toContain('Jane Smith');
      expect(result.body).toContain('Monday, Jan 15 at 2:00 PM');
    });

    it('renders plain template object with sample data', () => {
      const template = {
        subject: 'Payment link for {client_name}',
        body: 'Amount: {amount}, Link: {payment_link}',
      };

      const result = renderer.renderPreview(template, 'payment_link');

      expect(result.subject).toContain('Jane Smith');
      expect(result.body).toContain('$125.00');
      expect(result.body).toContain('https://example.com/pay/sample-link');
    });
  });

  describe('getAllowedVariables', () => {
    it('returns allowed variables for appointment_scheduled', () => {
      const variables = renderer.getAllowedVariables('appointment_scheduled');

      expect(variables).toEqual([
        'client_name',
        'appointment_time',
        'shop_name',
        'seamstress_name',
        'confirmation_link',
        'cancel_link',
      ]);
    });

    it('returns allowed variables for payment_link', () => {
      const variables = renderer.getAllowedVariables('payment_link');

      expect(variables).toEqual([
        'client_name',
        'payment_link',
        'amount',
        'shop_name',
      ]);
    });

    it('returns empty array for unknown email type', () => {
      const variables = renderer.getAllowedVariables('unknown_type' as any);

      expect(variables).toEqual([]);
    });
  });

  describe('getSampleData', () => {
    it('returns sample data for appointment_scheduled', () => {
      const sampleData = renderer.getSampleData('appointment_scheduled');

      expect(sampleData).toEqual({
        client_name: 'Jane Smith',
        appointment_time: 'Monday, Jan 15 at 2:00 PM',
        shop_name: "Sarah's Alterations",
        seamstress_name: 'Sarah',
        confirmation_link: 'https://example.com/confirm/sample-token',
        cancel_link: 'https://example.com/decline/sample-token',
      });
    });

    it('returns empty object for unknown email type', () => {
      const sampleData = renderer.getSampleData('unknown_type' as any);

      expect(sampleData).toEqual({});
    });
  });

  describe('getVariableHelp', () => {
    it('returns variable help for appointment_scheduled', () => {
      const help = renderer.getVariableHelp('appointment_scheduled');

      expect(help).toHaveLength(6);
      expect(help[0]).toEqual({
        key: 'client_name',
        description: 'Client full name',
        example: 'Jane Smith',
      });
    });

    it('returns empty array for unknown email type', () => {
      const help = renderer.getVariableHelp('unknown_type' as any);

      expect(help).toEqual([]);
    });
  });

  describe('template validation with variable checking', () => {
    it('logs warnings for unknown variables in data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const template: EmailTemplate = {
        id: '1',
        email_type: 'appointment_scheduled',
        subject: 'Hello {client_name}',
        body: 'Your appointment is at {appointment_time}.',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
      };

      const data = {
        client_name: 'John',
        appointment_time: '2pm',
        unknown_var: 'value', // unknown variable
      };

      renderer.render(template, data);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Warning: Unknown variables provided for appointment_scheduled: unknown_var'
        )
      );

      consoleSpy.mockRestore();
    });

    it('logs warnings for missing required variables', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const template: EmailTemplate = {
        id: '1',
        email_type: 'appointment_scheduled',
        subject: 'Hello {client_name}',
        body: 'Your appointment is at {appointment_time}.',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
      };

      const data = {
        client_name: 'John',
        // missing appointment_time
      };

      renderer.render(template, data);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Warning: Missing variables for appointment_scheduled: appointment_time'
        )
      );

      consoleSpy.mockRestore();
    });
  });
});
