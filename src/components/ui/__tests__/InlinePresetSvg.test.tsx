import React from 'react';
import { render, screen } from '@testing-library/react';
import InlinePresetSvg from '../InlinePresetSvg';

// Mock fetch for SVG loading
global.fetch = jest.fn();

const mockSvgContent = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="#ff0000" />
</svg>
`;

describe('InlinePresetSvg', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      text: () => Promise.resolve(mockSvgContent),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with proper centering styles and width constraints', async () => {
    render(<InlinePresetSvg src="/test.svg" data-testid="svg-component" />);

    // Wait for the SVG to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgWrapper = screen.getByTestId('svg-component');

    // Check that the wrapper has centering styles and width constraints
    const styles = window.getComputedStyle(svgWrapper);
    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
    expect(styles.justifyContent).toBe('center');
    expect(styles.position).toBe('relative');
    expect(styles.width).toBe('100%');
    expect(styles.height).toBe('100%');
    expect(styles.maxWidth).toBe('100%');
    expect(styles.maxHeight).toBe('100%');
    expect(styles.overflow).toBe('hidden');
  });

  it('should apply custom styles while maintaining centering', async () => {
    render(
      <InlinePresetSvg
        src="/test.svg"
        style={{ backgroundColor: 'red', padding: '10px' }}
        data-testid="svg-component"
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgWrapper = screen.getByTestId('svg-component');
    const styles = window.getComputedStyle(svgWrapper);

    // Custom styles should be applied
    expect(styles.backgroundColor).toBe('red');
    expect(styles.padding).toBe('10px');

    // But centering styles should still be present
    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
    expect(styles.justifyContent).toBe('center');
  });

  it('should handle fill and outline colors', async () => {
    render(
      <InlinePresetSvg
        src="/test.svg"
        fillColor="#00ff00"
        outlineColor="#0000ff"
        data-testid="svg-component"
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgWrapper = screen.getByTestId('svg-component');

    // Check that CSS variables are set
    expect(svgWrapper.style.getPropertyValue('--garment-fill')).toBe('#00ff00');
    expect(svgWrapper.style.getPropertyValue('--garment-outline')).toBe(
      '#0000ff'
    );
  });

  it('should process SVG with proper attributes for centering', async () => {
    render(<InlinePresetSvg src="/test.svg" data-testid="svg-component" />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgWrapper = screen.getByTestId('svg-component');

    // Check that the SVG content has been processed
    const svgElement = svgWrapper.querySelector('svg');
    expect(svgElement).toBeTruthy();

    if (svgElement) {
      expect(svgElement.getAttribute('width')).toBe('100%');
      expect(svgElement.getAttribute('height')).toBe('100%');
      expect(svgElement.getAttribute('preserveAspectRatio')).toBe(
        'xMidYMid meet'
      );
      expect(svgElement.style.display).toBe('block');
      expect(svgElement.style.maxWidth).toBe('100%');
      expect(svgElement.style.maxHeight).toBe('100%');
    }
  });

  it('should constrain SVG to fit within parent container', async () => {
    const { container } = render(
      <div style={{ width: '200px', height: '200px' }}>
        <InlinePresetSvg src="/test.svg" data-testid="svg-component" />
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgWrapper = screen.getByTestId('svg-component');
    const parentDiv = container.firstChild as HTMLElement;

    // The SVG wrapper should not exceed parent dimensions
    const wrapperRect = svgWrapper.getBoundingClientRect();
    const parentRect = parentDiv.getBoundingClientRect();

    expect(wrapperRect.width).toBeLessThanOrEqual(parentRect.width);
    expect(wrapperRect.height).toBeLessThanOrEqual(parentRect.height);
  });
});
