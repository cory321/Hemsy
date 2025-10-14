# Hemsy Design System Constants

This directory contains the **single source of truth** for design tokens used throughout the application.

## 🔘 Button Styles: `buttonStyles.ts`

Reusable button style configurations for consistency across action buttons.

### Available Styles

**`actionButtonStyle`** - Standard style for main action buttons

- Font size: 1.2rem (19.2px)
- White space: nowrap (prevents text wrapping)
- Alignment: center
- Gap: 1 (spacing between icon and text)

### Usage

```tsx
import { actionButtonStyle } from '@/constants/buttonStyles';

<Button
	variant="contained"
	sx={{
		display: { xs: 'none', sm: 'flex' },
		...actionButtonStyle,
	}}
>
	<RemixIcon name="ri-user-add-line" size={18} color="inherit" />
	<Box component="span">Add Client</Box>
</Button>;
```

### Currently Used In

- Add Client button (`/clients`)
- Create Order button (`/orders`)
- Schedule Appointment button (`/appointments`)
- Add Service button (`/services`)

## 📐 Typography System: `typography.ts`

All font sizes, weights, line heights, and letter spacing values are defined here. **Never use inline fontSize values.**

### Font Size Scale

```tsx
import { fontSizes } from '@/constants/typography';

// Available sizes (optimized for readability):
// - display: 3rem (48px) - Hero text
// - h1: 2.5rem (40px) - Page titles
// - h2: 2rem (32px) - Section headings
// - h3: 1.5rem (24px) - Subsection headings
// - h4: 1.25rem (20px) - Card titles
// - h5: 1.125rem (18px) - Emphasized content
// - h6: 1.125rem (18px) - Standard heading
// - body: 1rem (16px) - Default body text
// - bodyLarge: 1.125rem (18px) - Emphasized body
// - bodySmall: 1rem (16px) - Secondary body (comfortable size)
// - label: 1rem (16px) - Form labels (readable)
// - caption: 0.875rem (14px) - Helper text (comfortable)
// - button: 1rem (16px) - Button text
// - input: 1rem (16px) - Input fields
```

### Usage in Components

**✅ CORRECT - Use Material UI variants:**

```tsx
<Typography variant="h4">Card Title</Typography>
<Typography variant="body1">Default text</Typography>
<Typography variant="caption">Helper text</Typography>
```

**✅ CORRECT - Use theme via sx prop:**

```tsx
<Box sx={{ fontSize: (theme) => theme.typography.h4.fontSize }}>
	Custom element
</Box>
```

**✅ CORRECT - Direct import for non-MUI:**

```tsx
import { fontSizes, fontWeights } from '@/constants/typography';

<div style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}>
	Custom text
</div>;
```

**❌ WRONG - Never hardcode values:**

```tsx
// DON'T DO THIS!
<Typography sx={{ fontSize: '0.875rem' }}>Text</Typography>
<Box sx={{ fontSize: '14px' }}>Text</Box>
```

### Typography Variants Reference

| Variant     | Use Case            | Size | Weight             |
| ----------- | ------------------- | ---- | ------------------ |
| `h1`        | Page titles         | 40px | Bold               |
| `h2`        | Section headings    | 32px | Bold               |
| `h3`        | Subsection headings | 24px | Semibold           |
| `h4`        | Card titles         | 20px | Semibold           |
| `h5`        | Small headings      | 18px | Semibold           |
| `h6`        | Standard headings   | 18px | Bold               |
| `subtitle1` | Large subtitle      | 18px | Medium             |
| `subtitle2` | Standard subtitle   | 16px | Medium             |
| `body1`     | Primary body text   | 16px | Semibold (600)     |
| `body2`     | Secondary body text | 16px | Regular            |
| `caption`   | Helper/caption text | 14px | Semibold (600)     |
| `overline`  | Labels/tags         | 12px | Medium (uppercase) |
| `button`    | Button text         | 16px | Medium             |

## 🎨 Color System: `colors.ts`

All application colors are defined in `colors.ts` and imported where needed. **Never hardcode hex values elsewhere.**

## Organization

### 1. **Theme Colors** (Material UI palette)

- `primary` - Main brand color (terracotta)
- `secondary` - Supporting color (warm grey)
- `error`, `warning`, `info`, `success` - Semantic colors
- `background` - Page and surface backgrounds
- `text` - Text colors
- `grey` - Grey scale for borders, dividers, etc.

### 2. **UI Component Colors**

- `ui.*` - Specific component colors (border, input, card, popover, etc.)

### 3. **UI States**

- `states.*` - Interactive states (hover, pressed, selected, backdrop)

### 4. **Specialized Colors**

- `chart.*` - Data visualization colors
- `sidebar.*` - Sidebar-specific colors

## Usage

### In React Components (Material UI)

```tsx
import { useTheme } from '@mui/material/styles';

// Use theme palette values
<Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }} />;
```

### Direct Import (Non-MUI components)

```tsx
import { colors } from '@/constants/colors';

<div style={{ backgroundColor: colors.primary.main }} />;
```

### In ThemeProvider

The `ThemeProvider.tsx` imports from `colors.ts` - it should **never** have hardcoded hex values.

### In CSS

Global CSS variables in `globals.css` should match `colors.ts` values and be updated together when colors change.

## Adding New Colors

1. Add to `colors.ts` in the appropriate section
2. If it's a theme color, ensure it follows Material UI's palette structure (main, light, dark, contrastText)
3. Update CSS variables in `globals.css` if needed for global styles
4. Import and use - no hardcoding!

## Color Guidelines

- **Primary**: Main actions, CTAs, brand identity
- **Secondary**: Supporting elements, less prominent actions
- **Error**: Destructive actions, errors, alerts
- **Warning**: Cautionary information
- **Info**: Informational messages
- **Success**: Positive confirmations, success states
- **Grey scale**: Borders, dividers, disabled states
- **UI colors**: Specific component styling needs
