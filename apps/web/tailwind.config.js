/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Original brand colors (keep them)
        primary: {
          50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
          400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
          800: '#9A3412', 900: '#7C2D12', 950: '#431407',
        },
        secondary: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
          800: '#1E293B', 900: '#0F172A', 950: '#020617',
        },

        // ─── Semantic colors (CSS-variable driven, auto light/dark) ───
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface:    'rgb(var(--surface) / <alpha-value>)',
        elevated:   'rgb(var(--elevated) / <alpha-value>)',
        muted:      'rgb(var(--muted) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        border:     'rgb(var(--border) / <alpha-value>)',
        ring:       'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1)',
        'elevated': '0 4px 6px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}