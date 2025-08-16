'use client';

import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ReactNode } from 'react';

// Mobile-first theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF7C4D',
      light: '#FDC5AF',
      dark: '#9e472a',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#faf5ed',
      paper: '#ffffff',
    },
    text: {
      primary: '#605143',
    },
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
    allVariants: {
      lineHeight: 1.5,
    },
    // UI Heading
    h6: {
      fontSize: '1.125rem', // 17px
      fontWeight: 700,
    },
    // Title
    subtitle1: {
      fontSize: '1.125rem', // 17px
      fontWeight: 500,
    },
    // Body text
    body1: {
      fontSize: '1rem', // 15px
      fontWeight: 600,
    },
    body2: {
      fontSize: '1rem', // 15px
      fontWeight: 400,
    },
    // Captions
    caption: {
      fontSize: '0.86rem', // 13px
      fontWeight: 600,
    },
    overline: {
      fontSize: '0.86rem', // 13px
      fontWeight: 400,
      textTransform: 'none',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '1rem',
    },
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          backgroundColor: '#615244',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64, // Larger for mobile
          boxShadow: '0 -1px 3px rgba(0,0,0,0.12)',
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
