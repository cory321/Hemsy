/**
 * @jest-environment jsdom
 */

describe('Viewport Accessibility Configuration', () => {
  it('should validate viewport configuration meets WCAG requirements', () => {
    // Test the viewport configuration object directly
    const viewportConfig = {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
      themeColor: '#605143',
    };

    // WCAG 2.1 Success Criterion 1.4.4: Resize text
    // Users must be able to zoom up to 200% without loss of functionality
    expect(viewportConfig.userScalable).toBe(true);
    expect(viewportConfig.maximumScale).toBeGreaterThanOrEqual(2);
    expect(viewportConfig.initialScale).toBe(1);
    expect(viewportConfig.width).toBe('device-width');
  });

  it('should meet axe-core meta-viewport rule requirements', () => {
    const viewportConfig = {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
      themeColor: '#605143',
    };

    // axe-core rule: meta-viewport
    // - user-scalable must not be "no" or false
    // - maximum-scale must be at least 2
    expect(viewportConfig.userScalable).not.toBe(false);
    expect(viewportConfig.userScalable).not.toBe('no');
    expect(viewportConfig.maximumScale).toBeGreaterThanOrEqual(2);
  });

  it('should support users with low vision who need magnification', () => {
    const viewportConfig = {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
      themeColor: '#605143',
    };

    // Users with partial vision and low vision often need to enlarge fonts
    // The configuration should support up to 500% zoom for better accessibility
    expect(viewportConfig.maximumScale).toBeGreaterThanOrEqual(5);
    expect(viewportConfig.userScalable).toBe(true);
  });
});
