// Color palette based on your design system
export const colors = {
  // Primary: Orange (#F97316)
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Base primary
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407',
  },
  // Secondary: Slate Gray (#64748B)
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Base secondary
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  // Tertiary: Lighter Orange (#FB923C)
  tertiary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C', // Base tertiary
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407',
  },
  // Neutral: Near-black to white
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#0B0F17', // Base dark background
  },
};

// Theme configurations
export const lightTheme = {
  background: {
    base: '#F8FAFC',
    surface: '#FFFFFF',
    elevated: '#F1F5F9',
    card: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverted: '#FFFFFF',
  },
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
  button: {
    primary: {
      background: '#F97316',
      text: '#FFFFFF',
      hover: '#EA580C',
    },
    secondary: {
      background: '#F1F5F9',
      text: '#0F172A',
      hover: '#E2E8F0',
    },
    inverted: {
      background: '#0F172A',
      text: '#FFFFFF',
      hover: '#1E293B',
    },
    outlined: {
      background: 'transparent',
      text: '#0F172A',
      border: '#CBD5E1',
      hover: '#F1F5F9',
    },
  },
  input: {
    background: '#FFFFFF',
    border: '#CBD5E1',
    text: '#0F172A',
    placeholder: '#94A3B8',
    focus: '#F97316',
  },
  progress: {
    track: '#E2E8F0',
    fill: '#F97316',
  },
  nav: {
    background: '#F1F5F9',
    active: '#F97316',
    inactive: '#94A3B8',
  },
  card: {
    background: '#FFFFFF',
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    radius: '16px',
  },
};

export const darkTheme = {
  background: {
    base: '#0B0F17',
    surface: '#0F172A',
    elevated: '#1E293B',
    card: '#1E293B',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    inverted: '#0F172A',
  },
  border: {
    light: '#1E293B',
    medium: '#334155',
    dark: '#475569',
  },
  button: {
    primary: {
      background: '#F97316',
      text: '#FFFFFF',
      hover: '#FB923C',
    },
    secondary: {
      background: '#334155',
      text: '#F1F5F9',
      hover: '#475569',
    },
    inverted: {
      background: '#FFFFFF',
      text: '#0F172A',
      hover: '#F1F5F9',
    },
    outlined: {
      background: 'transparent',
      text: '#F1F5F9',
      border: '#334155',
      hover: '#1E293B',
    },
  },
  input: {
    background: '#1E293B',
    border: '#334155',
    text: '#F1F5F9',
    placeholder: '#94A3B8',
    focus: '#F97316',
  },
  progress: {
    track: '#334155',
    fill: '#F97316',
  },
  nav: {
    background: '#1E293B',
    active: '#F97316',
    inactive: '#94A3B8',
  },
  card: {
    background: '#1E293B',
    shadow: '0 1px 3px rgba(0,0,0,0.3)',
    radius: '16px',
  },
};

export type Theme = typeof lightTheme;