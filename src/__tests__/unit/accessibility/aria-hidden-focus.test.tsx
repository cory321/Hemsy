/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccessibleIcon, RemixIcon } from '@/components/ui/AccessibleIcon';
import { validateAriaHiddenElement } from '@/lib/utils/accessibility';

describe('ARIA Hidden Focus Accessibility', () => {
  describe('AccessibleIcon', () => {
    it('should have aria-hidden="true" for decorative icons', () => {
      const { container } = render(
        <AccessibleIcon className="ri ri-home-line" isDecorative={true} />
      );

      const icon = container.querySelector('i[aria-hidden="true"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('aria-label');
      expect(icon).toHaveClass('ri ri-home-line');
    });

    it('should have proper aria-label for non-decorative icons', () => {
      render(
        <AccessibleIcon
          className="ri ri-home-line"
          isDecorative={false}
          ariaLabel="Home"
        />
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label', 'Home');
      expect(icon).not.toHaveAttribute('aria-hidden');
    });

    it('should warn when non-decorative icon lacks aria-label', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      render(
        <AccessibleIcon className="ri ri-home-line" isDecorative={false} />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'AccessibleIcon: Non-decorative icon requires ariaLabel prop'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('RemixIcon', () => {
    it('should be decorative by default', () => {
      const { container } = render(<RemixIcon name="home-line" />);

      const icon = container.querySelector('i[aria-hidden="true"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveClass('ri ri-home-line');
    });

    it('should support non-decorative usage', () => {
      render(
        <RemixIcon
          name="home-line"
          isDecorative={false}
          ariaLabel="Navigate to home"
        />
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label', 'Navigate to home');
      expect(icon).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('validateAriaHiddenElement utility', () => {
    it('should pass for element without aria-hidden', () => {
      const div = document.createElement('div');
      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass for aria-hidden element without focusable content', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<span>Some text</span><i class="ri ri-home-line"></i>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail for aria-hidden element with focusable button', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<button>Click me</button>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(
        'Contains 1 focusable elements matching "button:not([disabled])"'
      );
    });

    it('should fail for aria-hidden element with focusable input', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<input type="text" />';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(
        'Contains 1 focusable elements matching "input:not([disabled])"'
      );
    });

    it('should pass for aria-hidden element with disabled button', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<button disabled>Click me</button>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail for aria-hidden element with link', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<a href="/test">Link</a>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(
        'Contains 1 focusable elements matching "a[href]"'
      );
    });

    it('should fail for aria-hidden element with positive tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<span tabindex="0">Focusable span</span>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(
        'Contains 1 focusable elements matching "[tabindex]:not([tabindex="-1"])"'
      );
    });

    it('should pass for aria-hidden element with negative tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      div.innerHTML = '<span tabindex="-1">Non-focusable span</span>';

      const result = validateAriaHiddenElement(div);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle Material UI icon buttons correctly', () => {
      // Simulate a Material UI IconButton with decorative icon
      const { container } = render(
        <button aria-label="Close dialog">
          <i className="ri ri-close-line" aria-hidden="true" />
        </button>
      );

      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();

      const icon = container.querySelector('i[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();

      // The button is focusable but the icon inside is properly hidden
      expect(button).not.toHaveAttribute('aria-hidden');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle decorative containers correctly', () => {
      // Simulate a decorative container (like spacing or visual elements)
      const { container } = render(
        <div>
          <button>Interactive content</button>
          <div aria-hidden="true" style={{ height: 0, overflow: 'hidden' }}>
            {/* Empty spacing container */}
          </div>
        </div>
      );

      const spacingDiv = container.querySelector('div[aria-hidden="true"]');
      expect(spacingDiv).toBeInTheDocument();

      const result = validateAriaHiddenElement(spacingDiv as HTMLElement);
      expect(result.isValid).toBe(true);
    });
  });
});
