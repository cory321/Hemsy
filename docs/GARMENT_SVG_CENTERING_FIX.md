# Garment SVG Centering Fix

## Issue

The garment SVG elements in the garments/[id] detail page were not properly centered within their containers. The SVG wrapper had incorrect positioning that prevented proper centering.

## Root Cause

The `InlinePresetSvg` component creates a wrapper `div` with `position: relative` and dimensions based on passed styles. When this component was given styles like `height: '88%', width: 'auto'`, it wasn't being centered within its parent container despite the parent having centering styles.

## Solution

The fix involved adding an intermediate wrapper Box component between the main container and the InlinePresetSvg component:

1. **Main Container Box**: Uses flexbox with `alignItems: 'center'` and `justifyContent: 'center'`
2. **Intermediate Wrapper Box**: Fixed dimensions of 88% × 88% that also uses flexbox centering
3. **InlinePresetSvg**: Now gets 100% × 100% dimensions to fill its wrapper

### Files Modified

1. **`src/app/(app)/garments/[id]/GarmentImageSection.tsx`**
   - Changed from grid-based centering to flexbox
   - Added intermediate wrapper with 88% × 88% dimensions
   - Updated InlinePresetSvg to use 100% dimensions

2. **`src/components/garments/GarmentCard.tsx`**
   - Applied same centering pattern for consistency
   - Ensures garment cards show centered SVGs

### Code Changes

**Before:**

```tsx
<Box sx={{ display: 'grid', placeItems: 'center', ... }}>
  <InlinePresetSvg style={{ height: '88%', width: 'auto', maxWidth: '100%' }} />
</Box>
```

**After:**

```tsx
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ... }}>
  <Box sx={{ height: '88%', width: '88%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <InlinePresetSvg style={{ height: '100%', width: '100%', maxWidth: '100%' }} />
  </Box>
</Box>
```

## Testing

### Visual Test Page

Created `/test-garment-centering` page to visually verify centering with debug borders:

- Gray box: outer container
- Red border: 88% × 88% centering wrapper
- Blue border: InlinePresetSvg component

### E2E Test

Created `src/__tests__/e2e/garment-svg-centering.test.ts` to verify:

- SVGs are properly centered in their containers
- Centering is maintained across different viewport sizes
- Proper flexbox styles are applied

## Verification Steps

1. Navigate to any garment detail page with a preset icon
2. Verify the SVG appears centered both horizontally and vertically
3. Resize the browser window - centering should be maintained
4. Check garment cards on the garments list page - SVGs should also be centered

## Related Components

- `InlinePresetSvg`: Renders SVG content with customizable colors
- `GarmentImageSection`: Displays garment images/SVGs in detail view
- `GarmentCard`: Shows garment preview cards with images/SVGs
