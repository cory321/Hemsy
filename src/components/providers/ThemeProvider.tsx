'use client';

import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ReactNode } from 'react';

// Mobile-first theme configuration with warm, crafted color palette
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#B85563', // Rose red - main actions
      light: '#D99A9E', // Light dusty rose
      dark: '#8B3A42', // Deep burgundy
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#CC8B70', // Terracotta - secondary actions
      light: '#E4A896', // Light salmon
      dark: '#B8765A', // Burnt sienna
      contrastText: '#ffffff',
    },
    error: {
      main: '#8B3A42', // Deep burgundy for errors
      light: '#BC6B6B',
      dark: '#5C252A',
    },
    warning: {
      main: '#CC8B70', // Terracotta for warnings
      light: '#FFDCC4',
      dark: '#B8765A',
    },
    info: {
      main: '#D08585', // Salmon pink for info
      light: '#F2BCA6',
      dark: '#BC6B6B',
    },
    success: {
      main: '#5A7061', // Muted sage green for success
      light: '#A3B5AA',
      dark: '#5A7061',
    },
    background: {
      default: '#fffefc', // Warm cream background
      paper: '#FFFFFF', // White for cards/surfaces
    },
    grey: {
      50: '#fafafa', // Very light grey
      100: '#f5f5f5', // Light grey
      200: '#eeeeee', // Light grey
      300: '#e0e0e0', // Medium light grey
      400: '#bdbdbd', // Medium grey
      500: '#9e9e9e', // Medium grey
      600: '#757575', // Medium dark grey
      700: '#616161', // Dark grey
      800: '#424242', // Very dark grey
      900: '#212121', // Almost black grey
    },
    text: {
      primary: '#3A1619', // Very dark burgundy for main text
      secondary: '#8B3A42', // Deep burgundy for secondary text
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backgroundColor: '#fffefc',
          color: '#3A1619',
          borderBottom: 'none',
          '& .MuiToolbar-root': {
            backgroundColor: 'transparent',
          },
          '& .MuiButton-root': {
            color: '#3A1619',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
            },
          },
          '& .MuiIconButton-root': {
            color: '#3A1619',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
            },
          },
          '& .MuiTypography-root': {
            color: '#3A1619',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64, // Larger for mobile
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
          backgroundColor: '#A34357',
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#FFFFFF',
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
