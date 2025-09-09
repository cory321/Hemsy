import React from 'react';

/**
 * Props for AccessibleIcon component
 */
interface AccessibleIconProps {
  /** The icon class name (e.g., "ri-home-line") */
  className: string;
  /** Icon size in pixels */
  size?: number;
  /** Icon color */
  color?: string;
  /** Additional styles */
  style?: React.CSSProperties;
  /** Whether the icon is purely decorative (default: true) */
  isDecorative?: boolean;
  /** Accessible label for non-decorative icons */
  ariaLabel?: string;
  /** Additional CSS classes */
  additionalClasses?: string;
}

/**
 * Accessible icon component that properly handles aria-hidden for decorative icons
 *
 * Based on axe-core rule: aria-hidden-focus
 * - Decorative icons should have aria-hidden="true"
 * - Non-decorative icons should have proper aria-label
 * - Never apply aria-hidden to focusable elements
 */
export function AccessibleIcon({
  className,
  size = 22,
  color = 'currentColor',
  style = {},
  isDecorative = true,
  ariaLabel,
  additionalClasses = '',
}: AccessibleIconProps) {
  const iconStyle: React.CSSProperties = {
    fontSize: size,
    color,
    ...style,
  };

  const iconClassName = `${className} ${additionalClasses}`.trim();

  // For decorative icons, add aria-hidden
  if (isDecorative) {
    return <i className={iconClassName} style={iconStyle} aria-hidden="true" />;
  }

  // For meaningful icons, require aria-label
  if (!ariaLabel) {
    console.warn('AccessibleIcon: Non-decorative icon requires ariaLabel prop');
  }

  return (
    <i
      className={iconClassName}
      style={iconStyle}
      aria-label={ariaLabel}
      role="img"
    />
  );
}

/**
 * Remix Icon component with accessibility built-in
 */
interface RemixIconProps {
  /** Remix icon name (e.g., "home-line") */
  name: string;
  /** Icon size in pixels */
  size?: number;
  /** Icon color */
  color?: string;
  /** Whether the icon is purely decorative (default: true) */
  isDecorative?: boolean;
  /** Accessible label for non-decorative icons */
  ariaLabel?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Remix Icon wrapper with proper accessibility
 */
export function RemixIcon({
  name,
  size = 22,
  color = 'currentColor',
  isDecorative = true,
  ariaLabel,
  style = {},
}: RemixIconProps) {
  return (
    <AccessibleIcon
      className={`ri ri-${name}`}
      size={size}
      color={color}
      style={style}
      isDecorative={isDecorative}
      {...(ariaLabel && { ariaLabel })}
    />
  );
}

/**
 * Hook to validate aria-hidden usage in development
 */
export function useAriaHiddenValidation() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const validateAriaHidden = () => {
      const ariaHiddenElements = document.querySelectorAll(
        '[aria-hidden="true"]'
      );

      ariaHiddenElements.forEach((element) => {
        const focusableElements = element.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), summary'
        );

        if (focusableElements.length > 0) {
          console.warn('ARIA Hidden Accessibility Violation:', {
            element,
            focusableElements: focusableElements.length,
            message: 'aria-hidden="true" element contains focusable elements',
            fix: 'Remove aria-hidden or add tabindex="-1" to focusable elements',
          });
        }
      });
    };

    // Run validation after component mounts and DOM updates
    const timeoutId = setTimeout(validateAriaHidden, 100);

    return () => clearTimeout(timeoutId);
  }, []);
}
