/**
 * Hemsy Color Palette - Single Source of Truth
 *
 * A warm, crafted color palette inspired by fabric and textile tones.
 * These colors evoke the feeling of a professional tailoring studio.
 *
 * All theme colors should be defined here and imported where needed.
 */

export const colors = {
	// Primary Colors
	primary: {
		main: '#c96442', // Terracotta
		light: '#e09a7a', // Light terracotta
		dark: '#b05730', // Dark terracotta
		contrastText: '#ffffff',
	},

	// Secondary Colors
	secondary: {
		main: '#7c7861', // Medium warm grey
		light: '#ede9de', // Lighter warm grey
		dark: '#535146', // Darkwarm grey
		contrastText: '#535146',
	},

	// Background Colors
	background: {
		default: '#faf9f5', // Warm off-white
		paper: '#ffffff', // White
	},

	// Text Colors
	text: {
		primary: '#3d3929', // Dark warm grey
		secondary: '#535146', // Medium dark grey
		disabled: 'rgba(61, 57, 41, 0.38)',
	},

	// Grey Scale (for Material UI compatibility)
	grey: {
		50: '#faf9f5',
		100: '#f5f4ee',
		200: '#ede9de',
		300: '#e9e6dc',
		400: '#dad9d4',
		500: '#b4b2a7',
		600: '#83827d',
		700: '#535146',
		800: '#3d3929',
		900: '#28261b',
	},

	// Semantic Colors
	error: {
		main: '#141413', // Almost black
		light: '#83827d',
		dark: '#000000',
		contrastText: '#ffffff',
	},

	warning: {
		main: '#b05730', // Warm orange
		light: '#e09a7a',
		dark: '#b4552d',
		contrastText: '#ffffff',
	},

	info: {
		main: '#9c87f5', // Purple
		light: '#dbd3f0',
		dark: '#7d5fd3',
		contrastText: '#ffffff',
	},

	success: {
		main: '#7C9885', // Muted sage green
		light: '#A3B5AA',
		dark: '#5A7061',
		contrastText: '#ffffff',
	},

	// UI Component Colors
	ui: {
		border: '#dad9d4',
		input: '#b4b2a7',
		ring: '#c96442',
		muted: '#ede9de',
		mutedForeground: '#83827d',
		accent: '#e9e6dc',
		accentForeground: '#28261b',
		card: '#faf9f5',
		cardForeground: '#141413',
		popover: '#ffffff',
		popoverForeground: '#28261b',
		divider: '#dad9d4',
	},

	// UI States
	states: {
		hover: 'rgba(201, 100, 66, 0.08)',
		pressed: 'rgba(201, 100, 66, 0.12)',
		selected: 'rgba(201, 100, 66, 0.16)',
		backdrop: 'rgba(20, 20, 19, 0.5)',
	},

	// Chart Colors
	chart: {
		1: '#b05730',
		2: '#9c87f5',
		3: '#ded8c4',
		4: '#dbd3f0',
		5: '#b4552d',
	},

	// Sidebar Colors
	sidebar: {
		background: '#f5f4ee',
		foreground: '#3d3d3a',
		primary: '#c96442',
		primaryForeground: '#fbfbfb',
		accent: '#e9e6dc',
		accentForeground: '#343434',
		border: '#ebebeb',
		ring: '#b5b5b5',
	},
};

// Export type for TypeScript support
export type ColorPalette = typeof colors;
