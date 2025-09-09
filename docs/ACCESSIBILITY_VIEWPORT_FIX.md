# Viewport Accessibility Fix

## Overview

Fixed critical accessibility violations in the viewport meta tag configuration to comply with WCAG 2.1 AA standards and axe-core rules.

## Issue

The original viewport configuration violated accessibility guidelines:

```typescript
// ❌ BEFORE - Accessibility violations
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // ❌ Limits zoom to 100%
  userScalable: false, // ❌ Disables user scaling completely
  themeColor: '#605143',
};
```

### Violations

1. **WCAG 2.1 Success Criterion 1.4.4 (Resize text)**: Users must be able to zoom up to 200% without loss of functionality
2. **axe-core rule `meta-viewport`**:
   - `user-scalable="no"` disables zooming (critical impact)
   - `maximum-scale` less than 2 prevents required 200% zoom

## Solution

Updated viewport configuration to support accessibility:

```typescript
// ✅ AFTER - WCAG compliant
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // ✅ Allows up to 500% zoom
  userScalable: true, // ✅ Enables user scaling
  themeColor: '#605143',
};
```

### Benefits

- **Users with low vision** can zoom up to 500% for better readability
- **Mobile users** can use pinch-to-zoom gestures
- **Compliance** with WCAG 2.1 AA and axe-core accessibility standards
- **Better UX** for users who need magnification

## Files Changed

- `src/app/layout.tsx` - Main layout viewport configuration
- `src/app/layout.backup.tsx` - Backup layout file (consistency)

## Testing

### Unit Tests

- `src/__tests__/unit/accessibility/viewport.test.ts`
- Validates viewport configuration meets WCAG requirements
- Ensures axe-core meta-viewport rule compliance

### E2E Tests

- `src/__tests__/e2e/accessibility/viewport-zoom.spec.ts`
- Tests actual zoom functionality in browser
- Verifies mobile pinch-to-zoom support
- Confirms functionality at high zoom levels

### Run Tests

```bash
# Unit tests
npm test -- src/__tests__/unit/accessibility/viewport.test.ts

# E2E tests
npm run test:e2e -- src/__tests__/e2e/accessibility/viewport-zoom.spec.ts
```

## Standards Compliance

### WCAG 2.1 (AA)

- ✅ **1.4.4 Resize text**: Content can be resized up to 200% without loss of functionality

### axe-core Rules

- ✅ **meta-viewport**: Zooming and scaling must not be disabled

### EN 301 549

- ✅ Compliant with European accessibility standards

## Impact on Users

### Low Vision Users

- Can zoom content up to 500% for better readability
- Screen magnifiers work properly with the page
- Text scaling in browsers is fully supported

### Mobile Users

- Pinch-to-zoom gestures work as expected
- Can zoom in on specific content areas
- Better control over content presentation

### All Users

- Improved flexibility in content consumption
- Better user experience across devices
- Maintains responsive design principles

## References

- [WCAG 2.1 Success Criterion 1.4.4](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [axe-core meta-viewport rule](https://dequeuniversity.com/rules/axe/4.9/meta-viewport)
- [MDN Viewport Meta Tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)

## Verification

To verify the fix is working:

1. Open the app in a browser
2. Use Ctrl/Cmd + Plus to zoom in
3. Verify content remains functional at 200%+ zoom
4. On mobile, test pinch-to-zoom gestures
5. Run accessibility audits with axe DevTools

The viewport meta tag should now show:

```html
<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes"
/>
```
