# Phase 2.2: Template Renderer

## Overview

Build the template rendering system that handles variable substitution and preview generation.

## Prerequisites

- [ ] Email service core implemented (Phase 2.1)
- [ ] Types defined (Phase 1.3)

## Steps

### 1. Create Template Renderer

Create `src/lib/services/email/template-renderer.ts`:

```typescript
import { EmailTemplate, EmailType } from '@/types/email';
import { EMAIL_VARIABLES } from '@/lib/utils/email/constants';

export interface RenderedEmail {
  subject: string;
  body: string;
}

export interface RenderOptions {
  escapeHtml?: boolean;
  validateVariables?: boolean;
}

export class TemplateRenderer {
  /**
   * Render a template with provided data
   */
  render(
    template: EmailTemplate | { subject: string; body: string },
    data: Record<string, any>,
    options: RenderOptions = {}
  ): RenderedEmail {
    const { validateVariables = true } = options;

    // Validate variables if requested
    if (validateVariables && 'email_type' in template) {
      this.validateTemplateVariables(template as EmailTemplate, data);
    }

    // Render subject and body
    return {
      subject: this.renderString(template.subject, data, options),
      body: this.renderString(template.body, data, options),
    };
  }

  /**
   * Render a template with sample data for preview
   */
  renderPreview(
    template: EmailTemplate | { subject: string; body: string },
    emailType: EmailType
  ): RenderedEmail {
    const sampleData = this.getSampleData(emailType);
    return this.render(template, sampleData, { validateVariables: false });
  }

  /**
   * Extract variables from a template string
   */
  extractVariables(template: string): string[] {
    const regex = /\{(\w+)\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Validate that a template uses only allowed variables
   */
  validateTemplate(
    template: { subject: string; body: string },
    emailType: EmailType
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedVariables = this.getAllowedVariables(emailType);

    // Extract variables from subject and body
    const usedVariables = [
      ...this.extractVariables(template.subject),
      ...this.extractVariables(template.body),
    ];

    // Check for unknown variables
    const unknownVariables = usedVariables.filter(
      (v) => !allowedVariables.includes(v)
    );

    if (unknownVariables.length > 0) {
      errors.push(
        `Unknown variables: ${unknownVariables.join(', ')}. ` +
          `Allowed variables: ${allowedVariables.join(', ')}`
      );
    }

    // Check for required variables (future enhancement)
    // Could define required variables per email type

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get list of allowed variables for an email type
   */
  getAllowedVariables(emailType: EmailType): string[] {
    const config = EMAIL_VARIABLES.find((v) => v.email_type === emailType);
    return config ? config.variables.map((v) => v.key) : [];
  }

  /**
   * Get sample data for an email type
   */
  getSampleData(emailType: EmailType): Record<string, string> {
    const config = EMAIL_VARIABLES.find((v) => v.email_type === emailType);
    return config ? config.sample_data : {};
  }

  /**
   * Get variable descriptions for UI help
   */
  getVariableHelp(emailType: EmailType): Array<{
    key: string;
    description: string;
    example: string;
  }> {
    const config = EMAIL_VARIABLES.find((v) => v.email_type === emailType);
    return config ? config.variables : [];
  }

  // Private methods

  private renderString(
    template: string,
    data: Record<string, any>,
    options: RenderOptions
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = data[key];

      // If value is undefined, leave the placeholder
      if (value === undefined) {
        return match;
      }

      // Convert to string
      const stringValue = String(value);

      // Escape HTML if requested (for future HTML emails)
      if (options.escapeHtml) {
        return this.escapeHtml(stringValue);
      }

      return stringValue;
    });
  }

  private validateTemplateVariables(
    template: EmailTemplate,
    data: Record<string, any>
  ): void {
    const allowedVariables = this.getAllowedVariables(template.email_type);
    const providedKeys = Object.keys(data);

    // Check for unknown variables in data
    const unknownKeys = providedKeys.filter(
      (key) => !allowedVariables.includes(key)
    );

    if (unknownKeys.length > 0) {
      console.warn(
        `Warning: Unknown variables provided for ${template.email_type}: ${unknownKeys.join(', ')}`
      );
    }

    // Check for missing required variables
    const usedVariables = [
      ...this.extractVariables(template.subject),
      ...this.extractVariables(template.body),
    ];

    const missingVariables = usedVariables.filter((v) => !(v in data));

    if (missingVariables.length > 0) {
      console.warn(
        `Warning: Missing variables for ${template.email_type}: ${missingVariables.join(', ')}`
      );
    }
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();
```

### 2. Create Render Utilities

Create `src/lib/utils/email/render-utils.ts`:

```typescript
import { format, parseISO } from 'date-fns';

/**
 * Format appointment time for emails
 */
export function formatAppointmentTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, 'EEEE, MMMM d at h:mm a');
  } catch (error) {
    console.error('Invalid date string:', isoString);
    return isoString; // Return original if parsing fails
  }
}

/**
 * Format currency for emails
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a preview of email body for logs
 */
export function createEmailPreview(
  body: string,
  maxLength: number = 100
): string {
  // Remove extra whitespace and newlines
  const cleaned = body.replace(/\s+/g, ' ').trim();
  return truncate(cleaned, maxLength);
}

/**
 * Validate email template syntax
 */
export function validateTemplateSyntax(template: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Check for balanced braces
    let braceCount = 0;
    let inVariable = false;

    for (let i = 0; i < template.length; i++) {
      const char = template[i];

      if (char === '{') {
        if (inVariable) {
          return {
            valid: false,
            error: `Nested variable at position ${i}`,
          };
        }
        inVariable = true;
        braceCount++;
      } else if (char === '}') {
        if (!inVariable) {
          return {
            valid: false,
            error: `Unmatched closing brace at position ${i}`,
          };
        }
        inVariable = false;
        braceCount--;
      }
    }

    if (braceCount !== 0) {
      return {
        valid: false,
        error: 'Unmatched braces in template',
      };
    }

    // Check variable names
    const variableRegex = /\{(\w+)\}/g;
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
      const varName = match[1];
      if (!/^[a-zA-Z_]\w*$/.test(varName)) {
        return {
          valid: false,
          error: `Invalid variable name: ${varName}`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate template syntax',
    };
  }
}
```

### 3. Create Preview Component Helper

Create `src/lib/services/email/preview-helper.ts`:

```typescript
import { EmailType, EmailTemplate } from '@/types/email';
import { templateRenderer } from './template-renderer';
import { EMAIL_FOOTER } from '@/lib/utils/email/constants';

export interface PreviewOptions {
  includeFooter?: boolean;
  customData?: Record<string, string>;
}

export class PreviewHelper {
  /**
   * Generate a preview of an email template
   */
  static generatePreview(
    template: { subject: string; body: string },
    emailType: EmailType,
    options: PreviewOptions = {}
  ): { subject: string; body: string; variables: string[] } {
    const { includeFooter = true, customData } = options;

    // Get sample data
    const sampleData = templateRenderer.getSampleData(emailType);
    const data = { ...sampleData, ...customData };

    // Render template
    const rendered = templateRenderer.render(template, data);

    // Add footer if requested
    if (includeFooter) {
      rendered.body += EMAIL_FOOTER;
    }

    // Extract variables for display
    const variables = [
      ...templateRenderer.extractVariables(template.subject),
      ...templateRenderer.extractVariables(template.body),
    ];

    return {
      ...rendered,
      variables: Array.from(new Set(variables)),
    };
  }

  /**
   * Generate side-by-side comparison
   */
  static generateComparison(
    original: EmailTemplate,
    modified: { subject: string; body: string },
    emailType: EmailType
  ): {
    original: { subject: string; body: string };
    modified: { subject: string; body: string };
    hasChanges: boolean;
  } {
    const originalRendered = templateRenderer.renderPreview(
      original,
      emailType
    );
    const modifiedRendered = templateRenderer.renderPreview(
      modified,
      emailType
    );

    return {
      original: originalRendered,
      modified: modifiedRendered,
      hasChanges:
        original.subject !== modified.subject ||
        original.body !== modified.body,
    };
  }

  /**
   * Validate template before saving
   */
  static validateTemplate(
    template: { subject: string; body: string },
    emailType: EmailType
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check template syntax
    const subjectValidation = validateTemplateSyntax(template.subject);
    if (!subjectValidation.valid) {
      errors.push(`Subject: ${subjectValidation.error}`);
    }

    const bodyValidation = validateTemplateSyntax(template.body);
    if (!bodyValidation.valid) {
      errors.push(`Body: ${bodyValidation.error}`);
    }

    // Check variables
    const variableValidation = templateRenderer.validateTemplate(
      template,
      emailType
    );
    errors.push(...variableValidation.errors);

    // Check length constraints
    if (template.subject.length > EMAIL_CONSTRAINTS.subjectMaxLength) {
      errors.push(
        `Subject exceeds maximum length of ${EMAIL_CONSTRAINTS.subjectMaxLength} characters`
      );
    }

    if (template.body.length > EMAIL_CONSTRAINTS.bodyMaxLength) {
      errors.push(
        `Body exceeds maximum length of ${EMAIL_CONSTRAINTS.bodyMaxLength} characters`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### 4. Create Template Renderer Tests

Create `src/__tests__/unit/services/email/template-renderer.test.ts`:

```typescript
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
  });
});
```

## Testing the Renderer

1. **Unit tests**:

   ```bash
   npm test template-renderer.test.ts
   ```

2. **Integration test**:

   ```typescript
   // Test with actual email service
   const template = await repository.getTemplate('appointment_scheduled');
   const rendered = renderer.render(template, {
     client_name: 'Test Client',
     appointment_time: 'Tomorrow at 2pm',
     shop_name: 'Test Shop',
   });
   console.log('Rendered:', rendered);
   ```

3. **Preview test**:
   ```typescript
   // Test preview generation
   const preview = PreviewHelper.generatePreview(
     { subject: 'Test {var}', body: 'Body {var}' },
     'appointment_scheduled'
   );
   console.log('Preview:', preview);
   ```

## Common Issues

| Issue                      | Solution                                  |
| -------------------------- | ----------------------------------------- |
| Variables not replaced     | Check variable names match exactly        |
| Invalid template syntax    | Use validateTemplateSyntax before saving  |
| Missing sample data        | Update EMAIL_VARIABLES constant           |
| Preview shows placeholders | Ensure sample data includes all variables |

## Next Steps

Proceed to [Server Actions](./6-server-actions.md)
