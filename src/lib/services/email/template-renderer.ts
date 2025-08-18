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
      if (match[1]) {
        variables.add(match[1]);
      }
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
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();
