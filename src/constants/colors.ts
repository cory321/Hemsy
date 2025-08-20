/**
 * Threadfolio V2 Color Palette
 *
 * A warm, crafted color palette inspired by fabric and textile tones.
 * These colors evoke the feeling of a professional tailoring studio.
 */

export const colors = {
  // Primary Palette - Rose/Burgundy tones
  burgundy: {
    900: '#1F0A0C', // Almost black
    800: '#3A1619', // Very dark
    700: '#5C252A', // Darker burgundy
    600: '#8B3A42', // Deep burgundy (primary dark)
    500: '#B85563', // Rose red (primary main)
    400: '#CC7A81', // Dusty rose
    300: '#D99A9E', // Light dusty rose (primary light)
    200: '#F4D5D3', // Blush pink
    100: '#FFF0ED', // Very light blush
  },

  // Secondary Palette - Terracotta/Sienna tones
  terracotta: {
    900: '#3A1F14', // Very dark sienna
    800: '#5C3223', // Dark sienna
    700: '#8B4F3B', // Darker terracotta
    600: '#B8765A', // Burnt sienna (secondary dark)
    500: '#CC8B70', // Terracotta (secondary main)
    400: '#D08585', // Salmon pink
    300: '#E4A896', // Light salmon (secondary light)
    200: '#F2BCA6', // Peach
    100: '#FFDCC4', // Light apricot
  },

  // Neutral Palette - Cream/Beige tones
  neutral: {
    900: '#1F0A0C', // Almost black
    800: '#3A1619', // Very dark (text primary)
    700: '#5C252A', // Dark
    600: '#8B3A42', // Deep burgundy (text secondary)
    500: '#BC6B6B', // Terra cotta red
    400: '#D99A9E', // Light dusty rose
    300: '#E8CDB0', // Warm beige
    200: '#F4D5D3', // Blush pink
    100: '#FFE9D6', // Pale peach
    50: '#fff9f2', // Warm cream (background)
    0: '#FFFFFF', // Pure white (paper)
  },

  // Semantic Colors
  semantic: {
    error: '#8B3A42', // Deep burgundy
    warning: '#CC8B70', // Terracotta
    info: '#D08585', // Salmon pink
    success: '#7C9885', // Muted sage green
  },

  // UI States
  states: {
    hover: 'rgba(184, 85, 99, 0.08)', // Primary with low opacity
    pressed: 'rgba(184, 85, 99, 0.12)', // Primary with medium opacity
    selected: 'rgba(184, 85, 99, 0.16)', // Primary with higher opacity
    disabled: 'rgba(58, 22, 25, 0.38)', // Dark with 38% opacity
    divider: '#F4D5D3', // Blush pink for dividers
    backdrop: 'rgba(31, 10, 12, 0.5)', // Dark overlay
  },

  // Special Purpose
  special: {
    link: '#B85563', // Primary color for links
    linkHover: '#8B3A42', // Darker on hover
    focus: '#B85563', // Focus ring color
    shadow: 'rgba(31, 10, 12, 0.08)', // Shadow color
    navBackground: '#A34357', // Navigation bar background
    navHover: 'rgba(255, 255, 255, 0.15)', // Navigation hover state
    navText: '#FFFFFF', // Navigation text color
    navTextSecondary: 'rgba(255, 255, 255, 0.7)', // Secondary nav text
  },
};

// Material UI Palette Configuration Reference
export const muiPalette = {
  primary: {
    main: colors.burgundy[500],
    light: colors.burgundy[300],
    dark: colors.burgundy[600],
    contrastText: '#ffffff',
  },
  secondary: {
    main: colors.terracotta[500],
    light: colors.terracotta[300],
    dark: colors.terracotta[600],
    contrastText: '#ffffff',
  },
  error: {
    main: colors.semantic.error,
    light: colors.terracotta[500],
    dark: colors.burgundy[700],
  },
  warning: {
    main: colors.semantic.warning,
    light: colors.terracotta[100],
    dark: colors.terracotta[600],
  },
  info: {
    main: colors.semantic.info,
    light: colors.terracotta[200],
    dark: colors.terracotta[500],
  },
  success: {
    main: colors.semantic.success,
    light: '#A3B5AA',
    dark: '#5A7061',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  text: {
    primary: colors.neutral[800],
    secondary: colors.neutral[600],
    disabled: colors.states.disabled,
  },
  background: {
    default: colors.neutral[50],
    paper: colors.neutral[0],
  },
  divider: colors.states.divider,
};

// Export type for TypeScript support
export type ColorPalette = typeof colors;
export type MuiPaletteConfig = typeof muiPalette;
