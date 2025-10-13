'use client';

import {
	createTheme,
	ThemeProvider as MUIThemeProvider,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ReactNode } from 'react';
import { colors } from '@/constants/colors';
import { fontSizes, fontWeights, typography } from '@/constants/typography';

// Mobile-first theme configuration with warm, crafted color palette
// All colors are defined in @/constants/colors.ts (single source of truth)
// All typography is defined in @/constants/typography.ts (single source of truth)
const theme = createTheme({
	palette: {
		mode: 'light',
		primary: colors.primary,
		secondary: colors.secondary,
		error: colors.error,
		warning: colors.warning,
		info: colors.info,
		success: colors.success,
		background: colors.background,
		grey: colors.grey,
		text: colors.text,
	},
	typography: {
		fontFamily: [
			'ui-rounded',
			'"SF Pro Rounded"',
			'var(--font-sans-rounded)',
			'system-ui',
			'-apple-system',
			'"Segoe UI"',
			'Roboto',
			'"Helvetica Neue"',
			'Arial',
			'"Noto Sans"',
			'sans-serif',
		].join(', '),
		fontSize: 16, // Base font size in px (for rem calculations)
		// All headings
		h1: typography.h1,
		h2: typography.h2,
		h3: typography.h3,
		h4: typography.h4,
		h5: typography.h5,
		h6: typography.h6,
		// Subtitles
		subtitle1: typography.subtitle1,
		subtitle2: typography.subtitle2,
		// Body text
		body1: typography.body1,
		body2: typography.body2,
		// Small text
		caption: typography.caption,
		overline: typography.overline,
		// Button text
		button: typography.button,
	},
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
			md: 900,
			lg: 1200,
			xl: 1536,
		},
	},
	shape: {
		borderRadius: 8,
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					minHeight: 44, // Minimum touch target size
					borderRadius: 8,
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiInputBase-root': {
						minHeight: 44, // Minimum touch target size
					},
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					backgroundColor: colors.background.default,
					color: colors.text.primary,
					borderBottom: 'none',
					'& .MuiToolbar-root': {
						backgroundColor: 'transparent',
					},
					'& .MuiButton-root': {
						color: colors.text.primary,
						'&:hover': {
							backgroundColor: 'rgba(0, 0, 0, 0.06)',
						},
					},
					'& .MuiIconButton-root': {
						color: colors.text.primary,
						'&:hover': {
							backgroundColor: 'rgba(0, 0, 0, 0.06)',
						},
					},
					'& .MuiTypography-root': {
						color: colors.text.primary,
					},
				},
			},
		},
		MuiBottomNavigation: {
			styleOverrides: {
				root: {
					height: 64, // Larger for mobile
					boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
					backgroundColor: colors.primary.main,
					'& .MuiBottomNavigationAction-root': {
						color: 'rgba(255, 255, 255, 0.7)',
						'&.Mui-selected': {
							color: colors.primary.contrastText,
						},
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.08)',
						},
					},
				},
			},
		},
	},
});

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	return (
		<AppRouterCacheProvider>
			<MUIThemeProvider theme={theme}>
				<CssBaseline enableColorScheme={false} />
				{children}
			</MUIThemeProvider>
		</AppRouterCacheProvider>
	);
}
