/**
 * Hemsy Typography System - Single Source of Truth
 *
 * A consistent type scale for all text in the application.
 * These sizes should be used throughout the app via the theme system.
 *
 * All font sizes should be defined here and imported where needed.
 */

/**
 * Font Size Scale
 * Using rem units for accessibility (respects user browser settings)
 * Base: 16px (browser default)
 */
export const fontSizes = {
	// Display & Large Headings
	display: '3rem', // 48px - Hero text, landing pages
	h1: '2.5rem', // 40px - Page titles
	h2: '2rem', // 32px - Section headings
	h3: '1.5rem', // 24px - Subsection headings
	h4: '1.25rem', // 20px - Card titles, important labels
	h5: '1.125rem', // 18px - Emphasized content (original h6 size)
	h6: '1.125rem', // 18px - Standard heading (matches original)

	// Body Text
	body: '1rem', // 16px - Default body text
	bodyLarge: '1.125rem', // 18px - Emphasized body text
	bodySmall: '1rem', // 16px - Secondary body text (matches original body2)

	// UI Text
	label: '1rem', // 16px - Form labels (increased from 14px for readability)
	caption: '0.875rem', // 14px - Captions, helper text (increased from 12px)
	overline: '0.75rem', // 12px - Overline text (small uppercase labels)

	// Interactive Elements
	button: '1rem', // 16px - Button text
	buttonSmall: '0.875rem', // 14px - Small button text
	buttonLarge: '1.125rem', // 18px - Large button text

	// Specialized
	input: '1rem', // 16px - Input field text (important for mobile: prevents zoom)
	link: '1rem', // 16px - Link text
	code: '0.875rem', // 14px - Code snippets
} as const;

/**
 * Font Weights
 * Using numeric values for flexibility with variable fonts
 */
export const fontWeights = {
	light: 300,
	regular: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
	extrabold: 800,
} as const;

/**
 * Line Heights
 * Relative values for better text readability
 */
export const lineHeights = {
	tight: 1.2, // Headings, compact UI
	normal: 1.5, // Body text, default
	relaxed: 1.75, // Long-form content
	loose: 2, // Very spacious text
} as const;

/**
 * Letter Spacing
 * Subtle adjustments for better readability
 */
export const letterSpacing = {
	tighter: '-0.05em',
	tight: '-0.025em',
	normal: '0',
	wide: '0.025em',
	wider: '0.05em',
	widest: '0.1em',
} as const;

/**
 * Typography Presets
 * Common combinations of size, weight, and line height
 */
export const typography = {
	// Display
	display: {
		fontSize: fontSizes.display,
		fontWeight: fontWeights.bold,
		lineHeight: lineHeights.tight,
		letterSpacing: letterSpacing.tight,
	},

	// Headings
	h1: {
		fontSize: fontSizes.h1,
		fontWeight: fontWeights.bold,
		lineHeight: lineHeights.tight,
		letterSpacing: letterSpacing.tight,
	},
	h2: {
		fontSize: fontSizes.h2,
		fontWeight: fontWeights.bold,
		lineHeight: lineHeights.tight,
		letterSpacing: letterSpacing.tight,
	},
	h3: {
		fontSize: fontSizes.h3,
		fontWeight: fontWeights.semibold,
		lineHeight: lineHeights.tight,
	},
	h4: {
		fontSize: fontSizes.h4,
		fontWeight: fontWeights.semibold,
		lineHeight: lineHeights.normal,
	},
	h5: {
		fontSize: fontSizes.h5,
		fontWeight: fontWeights.semibold,
		lineHeight: lineHeights.normal,
	},
	h6: {
		fontSize: fontSizes.h6, // 18px - matches original
		fontWeight: fontWeights.bold, // 700 - matches original
		lineHeight: lineHeights.normal,
	},

	// Subtitles
	subtitle1: {
		fontSize: fontSizes.h5,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
	},
	subtitle2: {
		fontSize: fontSizes.body,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
	},

	// Body
	body1: {
		fontSize: fontSizes.body, // 16px
		fontWeight: fontWeights.semibold, // 600 - matches original
		lineHeight: lineHeights.normal,
	},
	body2: {
		fontSize: fontSizes.bodySmall, // 16px - matches original
		fontWeight: fontWeights.regular, // 400
		lineHeight: lineHeights.normal,
	},
	bodyLarge: {
		fontSize: fontSizes.bodyLarge,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.relaxed,
	},

	// Captions and Labels
	caption: {
		fontSize: fontSizes.caption, // 14px - increased for readability
		fontWeight: fontWeights.semibold, // 600 - matches original
		lineHeight: lineHeights.normal,
	},
	overline: {
		fontSize: fontSizes.overline,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
		textTransform: 'uppercase' as const,
		letterSpacing: letterSpacing.wider,
	},
	label: {
		fontSize: fontSizes.label, // 16px - readable form labels
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
	},

	// Interactive
	button: {
		fontSize: fontSizes.button,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
		textTransform: 'none' as const,
	},
	buttonSmall: {
		fontSize: fontSizes.buttonSmall,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
		textTransform: 'none' as const,
	},
	buttonLarge: {
		fontSize: fontSizes.buttonLarge,
		fontWeight: fontWeights.medium,
		lineHeight: lineHeights.normal,
		textTransform: 'none' as const,
	},

	// Specialized
	input: {
		fontSize: fontSizes.input,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.normal,
	},
	link: {
		fontSize: fontSizes.link,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.normal,
		textDecoration: 'underline' as const,
	},
	code: {
		fontSize: fontSizes.code,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.relaxed,
		fontFamily: 'monospace',
	},
} as const;

// Export types for TypeScript support
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type LineHeight = keyof typeof lineHeights;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyPreset = keyof typeof typography;
