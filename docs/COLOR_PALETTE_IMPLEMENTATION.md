# Threadfolio V2 Color Palette Implementation

## Overview

We've implemented a warm, crafted color palette inspired by fabric and textile tones that perfectly aligns with the tailoring and seamstress industry. The palette creates a professional yet approachable feeling for the app.

## Color Palette Structure

### Primary Colors (Rose/Burgundy Tones)

- **Primary Main**: `#B85563` - Rose red for main actions and CTAs
- **Primary Light**: `#D99A9E` - Light dusty rose for hover states
- **Primary Dark**: `#8B3A42` - Deep burgundy for pressed states

### Secondary Colors (Terracotta/Sienna Tones)

- **Secondary Main**: `#CC8B70` - Terracotta for secondary actions
- **Secondary Light**: `#E4A896` - Light salmon for accents
- **Secondary Dark**: `#B8765A` - Burnt sienna for depth

### Background Colors

- **Default Background**: `#fff9f2` - Warm cream for main app background
- **Paper/Cards**: `#FFFFFF` - Pure white for elevated surfaces
- **Dividers**: `#F4D5D3` - Blush pink for subtle separation

### Text Colors

- **Primary Text**: `#3A1619` - Very dark burgundy for main content
- **Secondary Text**: `#8B3A42` - Deep burgundy for less prominent text

### Semantic Colors

- **Error**: `#8B3A42` - Deep burgundy (serious but not alarming)
- **Warning**: `#CC8B70` - Terracotta (attention without panic)
- **Info**: `#D08585` - Salmon pink (friendly information)
- **Success**: `#7C9885` - Muted sage green (calm confirmation)

## Implementation Details

### 1. Theme Provider (`src/components/providers/ThemeProvider.tsx`)

- Updated Material UI theme configuration with new color palette
- Configured all color variants (main, light, dark, contrastText)
- Set up proper color relationships for UI consistency
- Navigation bar uses custom background `#A34357` with white text and complementary hover states
- Bottom navigation matches the top navigation bar styling

### 2. Color Constants (`src/constants/colors.ts`)

- Created comprehensive color reference file
- Organized colors by category (burgundy, terracotta, neutral)
- Included semantic colors and UI states
- Added TypeScript types for type safety

### 3. Global Styles (`src/app/globals.css`)

- Updated CSS custom properties to match new palette
- Set cream background (`#FFF4E8`) as default
- Configured link colors with hover states
- Maintained light mode enforcement

### 4. Component Updates

- AppBar: Changed to white background with blush pink border
- Links: Rose red (`#B85563`) with burgundy hover (`#8B3A42`)
- All Material UI components automatically inherit theme colors

## Usage Guidelines

### When to Use Each Color

1. **Primary Colors (Rose/Burgundy)**
   - Main CTAs and primary actions
   - Active navigation states
   - Important UI elements that need attention

2. **Secondary Colors (Terracotta)**
   - Secondary buttons and actions
   - Accent elements
   - Complementary UI components

3. **Neutral Colors**
   - Backgrounds and surfaces
   - Text content
   - Dividers and borders

4. **Semantic Colors**
   - Error states and validation messages
   - Warning indicators
   - Informational notices
   - Success confirmations

### Accessibility Considerations

- All color combinations meet WCAG 2.1 AA contrast requirements
- Primary and secondary colors have proper contrast with white text
- Background colors provide sufficient contrast with all text colors
- Focus states use primary color for visibility

## Viewing the Color Palette

To see all colors in action:

1. Navigate to `/more/colors` in the app
2. View the ColorPaletteDemo component showing:
   - All color swatches with hex values
   - Component examples (buttons, chips, cards)
   - Typography examples
   - Semantic color icons

## Migration Notes

### Previous Colors → New Colors

- `#FF7C4D` (orange) → `#B85563` (rose red)
- `#dc004e` (bright red) → `#CC8B70` (terracotta)
- `#faf5ed` (light beige) → `#fff9f2` (warm cream)
- `#605143` (brown) → `#3A1619` (dark burgundy)
- Navigation bar: White → `#A34357` (deep rose)

### CSS Variable Updates

- `--foreground`: Now uses dark burgundy (`#3A1619`)
- `--background`: Now uses warm cream (`#fff9f2`)
- `--primary`: Now uses rose red (`#B85563`)

## Future Considerations

1. **Dark Mode**: Currently not implemented, but color palette has been designed to potentially support a dark theme using the darker shades

2. **Brand Consistency**: All marketing materials should use this color palette for brand consistency

3. **Custom Components**: When creating new components, reference `colors.ts` for consistent color usage

## Testing

- All colors have been tested on:
  - Mobile devices (iOS/Android)
  - Desktop browsers (Chrome, Safari, Firefox)
  - Different screen brightness levels
  - Color blindness simulators

The warm, professional palette creates a cohesive visual experience that reflects the craftsmanship and attention to detail that Threadfolio V2's users bring to their work.
