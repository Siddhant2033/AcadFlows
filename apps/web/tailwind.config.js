/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Primary: Red-Orange (AcadFlows brand) ───
        primary: {
          50: '#FEF2F0',
          100: '#FDDAD4',
          200: '#FBAB9E',
          300: '#F87B67',
          400: '#F1543B',
          500: '#DF301C', // brand
          600: '#C4270F',
          700: '#A01F0C',
          800: '#7A1709',
          900: '#580F06',
          950: '#3A0A04',
        },

        // ─── Secondary: Amber ───
        secondary: {
          50: '#FFF7E6',
          100: '#FFE9B8',
          200: '#FFD480',
          300: '#FFB84D',
          400: '#FFA326',
          500: '#FF9100', // brand
          600: '#DB7A00',
          700: '#B36200',
          800: '#8A4B00',
          900: '#633500',
          950: '#3D2000',
        },

        // ─── Accent: Cyan ───
        accent: {
          50: '#E5FAFC',
          100: '#C2F3F7',
          200: '#8AE9F0',
          300: '#52DEE9',
          400: '#1FCFE0',
          500: '#00B7CD', // brand
          600: '#009BB0',
          700: '#007D8D',
          800: '#005F6B',
          900: '#00434B',
          950: '#002830',
        },

        // ─── Neutral: Warm grays (matches warm brand palette) ───
        neutral: {
          50: '#FAF7F4',
          100: '#F5F0EA',
          200: '#E8E0D6',
          300: '#D4C8B9',
          400: '#A19891',
          500: '#78716C',
          600: '#57534E',
          700: '#3F3A36',
          800: '#2A2320',
          900: '#1E140F',
          950: '#0F0B09',
        },

        // ─── Semantic tokens (CSS-variable driven, auto light/dark) ───
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-tint': 'rgb(var(--surface-tint) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

        // ─── Status colors (India-friendly, WCAG AA) ───
        success: {
          light: '#DCFCE7',
          DEFAULT: '#16A34A',
          dark: '#166534',
        },
        warning: {
          light: '#FEF3C7',
          DEFAULT: '#D97706',
          dark: '#92400E',
        },
        danger: {
          light: '#FEE2E2',
          DEFAULT: '#DC2626',
          dark: '#991B1B',
        },
        info: {
          light: '#DBEAFE',
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
        },
      },

      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },

      borderRadius: {
        card: '16px',
        pill: '9999px',
      },

      boxShadow: {
        card: '0 1px 3px rgba(223, 48, 28, 0.04), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 6px rgba(223, 48, 28, 0.05), 0 2px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 15px rgba(223, 48, 28, 0.08), 0 4px 6px rgba(0,0,0,0.05)',
      },

      // ─── Animations (subtle, non-distracting) ───
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        'fade-down': 'fade-down 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },

      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};