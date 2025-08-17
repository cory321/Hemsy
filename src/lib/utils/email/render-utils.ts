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
      if (!varName || !/^[a-zA-Z_]\w*$/.test(varName)) {
        return {
          valid: false,
          error: `Invalid variable name: ${varName || 'undefined'}`,
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
