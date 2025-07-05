// Theme constants for the Travel Diary app
// Airbnb-level polish with comprehensive design system

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Light theme colors
export const LIGHT_COLORS = {
  // Primary colors - Travel-inspired blues and earth tones
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary colors - Warm earth tones
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Main secondary
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  
  // Accent colors - Adventure-inspired
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main accent
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
  },
  
  // Surface colors
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  
  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
  },
} as const;

// Dark theme colors
export const DARK_COLORS = {
  // Primary colors - Adjusted for dark mode
  primary: {
    50: '#0c4a6e',
    100: '#075985',
    200: '#0369a1',
    300: '#0284c7',
    400: '#0ea5e9',
    500: '#38bdf8', // Main primary (lighter in dark mode)
    600: '#7dd3fc',
    700: '#bae6fd',
    800: '#e0f2fe',
    900: '#f0f9ff',
  },
  
  // Secondary colors
  secondary: {
    50: '#701a75',
    100: '#86198f',
    200: '#a21caf',
    300: '#c026d3',
    400: '#d946ef',
    500: '#e879f9', // Main secondary
    600: '#f0abfc',
    700: '#f5d0fe',
    800: '#fae8ff',
    900: '#fdf4ff',
  },
  
  // Accent colors
  accent: {
    50: '#7c2d12',
    100: '#9a3412',
    200: '#c2410c',
    300: '#ea580c',
    400: '#f97316',
    500: '#fb923c', // Main accent
    600: '#fdba74',
    700: '#fed7aa',
    800: '#ffedd5',
    900: '#fff7ed',
  },
  
  // Neutral grays (inverted)
  neutral: {
    50: '#171717',
    100: '#262626',
    200: '#404040',
    300: '#525252',
    400: '#737373',
    500: '#a3a3a3',
    600: '#d4d4d4',
    700: '#e5e5e5',
    800: '#f5f5f5',
    900: '#fafafa',
  },
  
  // Semantic colors (adjusted for dark)
  success: {
    50: '#14532d',
    500: '#22c55e',
    600: '#4ade80',
  },
  warning: {
    50: '#78350f',
    500: '#f59e0b',
    600: '#fbbf24',
  },
  error: {
    50: '#7f1d1d',
    500: '#ef4444',
    600: '#f87171',
  },
  info: {
    50: '#1e3a8a',
    500: '#3b82f6',
    600: '#60a5fa',
  },
  
  // Background colors
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
  },
  
  // Surface colors
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
  },
  
  // Text colors
  text: {
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    tertiary: '#cbd5e1',
    disabled: '#64748b',
    inverse: '#0f172a',
  },
  
  // Border colors
  border: {
    primary: '#334155',
    secondary: '#475569',
    tertiary: '#64748b',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

// Create a unified color type that works for both themes
export type ColorPalette = {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  neutral: Record<string, string>;
  success: Record<string, string>;
  warning: Record<string, string>;
  error: Record<string, string>;
  info: Record<string, string>;
  background: Record<string, string>;
  surface: Record<string, string>;
  text: Record<string, string>;
  border: Record<string, string>;
};

export const getColors = (mode: ThemeMode): ColorPalette => {
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
};

export const TYPOGRAPHY = {
  // Font families (custom fonts)
  fonts: {
    regular: 'PlusJakartaSans',
    medium: 'PlusJakartaSans',
    bold: 'PlusJakartaSans',
    light: 'PlusJakartaSans',
    display: 'Merienda', // For titles and display text
  },
  
  // Text styles for common use cases
  styles: {
    hero: {
      fontSize: FONT_SIZES.xxxxl,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: 56,
    },
    h1: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: 40,
    },
    h2: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: 32,
    },
    h3: {
      fontSize: FONT_SIZES.xl,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: 28,
    },
    h4: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.medium,
      lineHeight: 24,
    },
    body: {
      fontSize: FONT_SIZES.md,
      fontWeight: FONT_WEIGHTS.regular,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.regular,
      lineHeight: 20,
    },
    caption: {
      fontSize: FONT_SIZES.xs,
      fontWeight: FONT_WEIGHTS.regular,
      lineHeight: 16,
    },
    button: {
      fontSize: FONT_SIZES.md,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: 20,
    },
    buttonSmall: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.medium,
      lineHeight: 16,
    },
  },
} as const;

// Animation durations and easings
export const ANIMATIONS = {
  durations: {
    fast: 150,
    normal: 250,
    slow: 350,
    slowest: 500,
  },
  easings: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Component-specific constants
export const COMPONENTS = {
  button: {
    height: {
      small: 32,
      medium: 44,
      large: 52,
    },
    paddingHorizontal: {
      small: SPACING.sm,
      medium: SPACING.md,
      large: SPACING.lg,
    },
  },
  input: {
    height: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  card: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  header: {
    height: 44,
    paddingHorizontal: SPACING.md,
  },
  tabBar: {
    height: 80,
    paddingBottom: SPACING.md,
  },
} as const; 