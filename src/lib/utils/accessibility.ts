/**
 * Accessibility utilities for ensuring proper aria-hidden usage
 */

/**
 * Check if an element should have aria-hidden="true"
 * Used for decorative elements that shouldn't be announced by screen readers
 */
export function shouldHaveAriaHidden(element: {
  role?: string;
  isDecorative?: boolean;
  hasInteractiveContent?: boolean;
  hasTextContent?: boolean;
}): boolean {
  const { role, isDecorative, hasInteractiveContent, hasTextContent } = element;

  // Never hide interactive content
  if (hasInteractiveContent) {
    return false;
  }

  // Hide decorative elements
  if (isDecorative) {
    return true;
  }

  // Hide elements with presentation role that have no text content
  if (role === 'presentation' && !hasTextContent) {
    return true;
  }

  return false;
}

/**
 * Validate that aria-hidden elements don't contain focusable content
 */
export function validateAriaHiddenElement(element: HTMLElement): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (element.getAttribute('aria-hidden') !== 'true') {
    return { isValid: true, violations: [] };
  }

  // Check for focusable elements
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    'summary',
    'details[open] summary',
  ];

  for (const selector of focusableSelectors) {
    const focusableElements = element.querySelectorAll(selector);
    if (focusableElements.length > 0) {
      violations.push(
        `Contains ${focusableElements.length} focusable elements matching "${selector}"`
      );
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Fix aria-hidden violations by making contained elements unfocusable
 */
export function fixAriaHiddenViolations(element: HTMLElement): void {
  if (element.getAttribute('aria-hidden') !== 'true') {
    return;
  }

  // Make all focusable elements unfocusable
  const focusableElements = element.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"]), summary'
  );

  focusableElements.forEach((el) => {
    const htmlEl = el as HTMLElement;

    // Set tabindex="-1" to make unfocusable
    htmlEl.setAttribute('tabindex', '-1');

    // For buttons and inputs, also set disabled if appropriate
    if (
      el.tagName === 'BUTTON' ||
      el.tagName === 'INPUT' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'TEXTAREA'
    ) {
      (el as HTMLButtonElement | HTMLInputElement).disabled = true;
    }
  });
}

/**
 * Component prop helper for ensuring proper aria-hidden usage
 */
export interface AriaHiddenProps {
  'aria-hidden'?: boolean | 'true' | 'false';
  tabIndex?: number;
}

/**
 * Create proper aria-hidden props for decorative elements
 */
export function createAriaHiddenProps(
  isDecorative: boolean = true
): AriaHiddenProps {
  if (isDecorative) {
    return {
      'aria-hidden': true,
      tabIndex: -1,
    };
  }

  return {};
}

/**
 * Validate aria-hidden usage in development
 */
export function validateAriaHiddenUsage(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only run in browser environment
  if (typeof document === 'undefined') {
    return;
  }

  const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]');

  ariaHiddenElements.forEach((element) => {
    const validation = validateAriaHiddenElement(element as HTMLElement);

    if (!validation.isValid) {
      console.warn('ARIA Hidden Accessibility Violation:', {
        element,
        violations: validation.violations,
        fix: 'Add tabindex="-1" to focusable elements or remove aria-hidden="true"',
      });
    }
  });
}
