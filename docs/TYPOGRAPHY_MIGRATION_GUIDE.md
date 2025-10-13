# Typography Migration Guide

This guide helps you migrate from inline font sizes to the standardized typography system.

## Quick Reference: Font Size Mapping

Here's how to map common inline font sizes to proper variants:

| Old Inline Size        | New Typography Variant        | Use Case                          |
| ---------------------- | ----------------------------- | --------------------------------- |
| `'3rem'`, `'48px'`     | `variant="h1"` or `display`   | Hero text                         |
| `'2.5rem'`, `'40px'`   | `variant="h1"`                | Page titles                       |
| `'2rem'`, `'32px'`     | `variant="h2"`                | Section headings                  |
| `'1.75rem'`, `'28px'`  | `variant="h2"`                | Large headings                    |
| `'1.5rem'`, `'24px'`   | `variant="h3"`                | Subsection headings               |
| `'1.25rem'`, `'20px'`  | `variant="h4"`                | Card titles, important labels     |
| `'1.125rem'`, `'18px'` | `variant="h5"` or `subtitle1` | Emphasized content, subtitles     |
| `'1rem'`, `'16px'`     | `variant="body1"` or `h6`     | Default body text, small headings |
| `'0.95rem'`, `'15px'`  | `variant="body1"`             | Body text (standardize to 16px)   |
| `'0.875rem'`, `'14px'` | `variant="body2"`             | Secondary body text, labels       |
| `'0.86rem'`, `'13px'`  | `variant="caption"`           | Helper text (standardize to 12px) |
| `'0.8rem'`, `'12px'`   | `variant="caption"`           | Captions, small text              |
| `'0.75rem'`, `'12px'`  | `variant="caption"`           | Captions, helper text             |

## Migration Patterns

### Pattern 1: Simple Typography Component

**Before:**

```tsx
<Typography
	variant="body2"
	color="text.secondary"
	sx={{
		fontSize: '0.8rem',
		fontWeight: 500,
		letterSpacing: '0.02em',
		textTransform: 'uppercase',
	}}
>
	Active Orders
</Typography>
```

**After:**

```tsx
<Typography
	variant="overline"
	color="text.secondary"
	sx={{
		letterSpacing: '0.02em',
	}}
>
	Active Orders
</Typography>
```

### Pattern 2: Conditional Font Sizes

**Before:**

```tsx
<Typography
	variant="h5"
	sx={{
		fontSize: stat.format === 'text' ? '0.95rem' : '1.75rem',
		fontWeight: 700,
		lineHeight: 1.2,
	}}
>
	{formatValue(stat.value, stat.format)}
</Typography>
```

**After:**

```tsx
<Typography
	variant={stat.format === 'text' ? 'body1' : 'h2'}
	sx={{
		fontWeight: 700,
		lineHeight: 1.2,
	}}
>
	{formatValue(stat.value, stat.format)}
</Typography>
```

### Pattern 3: Using Theme Typography

**Before:**

```tsx
<Box
	sx={{
		fontSize: '1rem',
		fontWeight: 600,
		color: 'text.primary',
	}}
>
	Custom content
</Box>
```

**After (Option A - Direct theme reference):**

```tsx
<Box
	sx={{
		...theme.typography.body1,
		fontWeight: 600,
		color: 'text.primary',
	}}
>
	Custom content
</Box>
```

**After (Option B - Function syntax):**

```tsx
<Box
	sx={(theme) => ({
		fontSize: theme.typography.body1.fontSize,
		fontWeight: theme.typography.body1.fontWeight,
		color: 'text.primary',
	})}
>
	Custom content
</Box>
```

### Pattern 4: Non-MUI Components

**Before:**

```tsx
import React from 'react';

export function CustomCard() {
	return <div style={{ fontSize: '14px', fontWeight: 500 }}>Card content</div>;
}
```

**After:**

```tsx
import React from 'react';
import { fontSizes, fontWeights } from '@/constants/typography';

export function CustomCard() {
	return (
		<div
			style={{
				fontSize: fontSizes.bodySmall,
				fontWeight: fontWeights.medium,
			}}
		>
			Card content
		</div>
	);
}
```

### Pattern 5: Responsive Font Sizes

**Before:**

```tsx
<Typography
	variant="h4"
	sx={{
		fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
	}}
>
	Responsive Heading
</Typography>
```

**After:**

```tsx
<Typography
	variant="h4"
	sx={{
		fontSize: {
			xs: (theme) => theme.typography.h3.fontSize,
			sm: (theme) => theme.typography.h2.fontSize,
			md: (theme) => theme.typography.h1.fontSize,
		},
	}}
>
	Responsive Heading
</Typography>
```

## Common Component Migrations

### Card Titles

**Before:**

```tsx
<Typography variant="caption" sx={{ fontSize: '1rem', fontWeight: 600 }}>
	Card Title
</Typography>
```

**After:**

```tsx
<Typography variant="h6" sx={{ fontWeight: 600 }}>
	Card Title
</Typography>
```

### Stat Cards

**Before:**

```tsx
<Typography variant="h5" sx={{ fontSize: '1.75rem', fontWeight: 700 }}>
	$123.45
</Typography>
```

**After:**

```tsx
<Typography variant="h2" sx={{ fontWeight: 700 }}>
	$123.45
</Typography>
```

### Small Labels

**Before:**

```tsx
<Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
	Label Text
</Typography>
```

**After:**

```tsx
<Typography variant="body2" sx={{ fontWeight: 500 }}>
	Label Text
</Typography>
```

### Uppercase Labels

**Before:**

```tsx
<Typography
	sx={{
		fontSize: '0.8rem',
		fontWeight: 500,
		textTransform: 'uppercase',
	}}
>
	Status
</Typography>
```

**After:**

```tsx
<Typography variant="overline">Status</Typography>
```

## ⚠️ Important Exceptions

### Email Templates - DO NOT MIGRATE

**Email templates (`src/components/emails/`) should keep inline fontSize values.**

Why?

- Email clients (Gmail, Outlook, etc.) require inline styles
- They don't support external CSS or theme systems
- React Email compiles to HTML with inline styles for email compatibility
- Changing these would break email rendering

**Files to skip:**

- `src/components/emails/templates/*` - All email templates
- `src/components/emails/components/*` - Email layout components
- Any file using `@react-email/components`

## Migration Checklist

- [ ] Replace all inline `fontSize` with appropriate variants (EXCEPT emails)
- [ ] Use `variant` prop for Typography components
- [ ] Import from `@/constants/typography` for non-MUI components
- [ ] Use theme function syntax for dynamic values
- [ ] Test on multiple screen sizes (especially mobile)
- [ ] Verify text is readable and meets accessibility standards
- [ ] Remove unused fontWeight overrides where possible
- [ ] Skip email template files (they need inline styles)

## Testing After Migration

```tsx
// Test that your component uses theme values
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

test('uses standard typography', () => {
	const { container } = render(
		<ThemeProvider>
			<YourComponent />
		</ThemeProvider>
	);

	// Check that no inline font sizes are present
	const elements = container.querySelectorAll('[style*="font-size"]');
	expect(elements.length).toBe(0);
});
```

## Finding Components to Migrate

Use this grep command to find components with inline font sizes:

```bash
# Find all components with inline fontSize
grep -r "fontSize:\s*['\"]" src/components --include="*.tsx" -l

# Count total occurrences
grep -r "fontSize:\s*['\"]" src/components --include="*.tsx" | wc -l
```

## Benefits of Migration

1. **Consistency**: All text follows the same size scale
2. **Maintainability**: Change all headings by updating one place
3. **Accessibility**: Sizes respect user browser settings (rem units)
4. **Responsive**: Easy to adjust sizes for different screen sizes
5. **Developer Experience**: Clear semantic meaning (h1, body1, etc.)
6. **Performance**: Reduced style recalculation
7. **Testing**: Easier to verify correct typography usage

## Need Help?

If you're unsure which variant to use:

1. Check the variant reference table in `/src/constants/README.md`
2. Look at similar components in the codebase
3. Ask: "What's the semantic meaning of this text?" (heading, body, label, caption?)
4. When in doubt, use `body1` for regular text and `caption` for small text
