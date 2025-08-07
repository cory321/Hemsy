import { EmailType, EmailTemplate } from '@/types/email';
import { templateRenderer } from './template-renderer';
import { EMAIL_FOOTER, EMAIL_CONSTRAINTS } from '@/lib/utils/email/constants';
import { validateTemplateSyntax } from '@/lib/utils/email/render-utils';

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
