import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          300: 'var(--color-primary-300)',
          500: 'var(--color-primary-500)',
          700: 'var(--color-primary-700)',
        },
        secondary: {
          300: 'var(--color-secondary-300)',
          500: 'var(--color-secondary-500)',
          700: 'var(--color-secondary-700)',
        },
        accent: {
          500: 'var(--color-accent-500)',
        },
        bg: {
          700: 'var(--color-bg-700)',
          800: 'var(--color-bg-800)',
          900: 'var(--color-bg-900)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          subtle: 'var(--color-text-2)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        level: {
          leve: 'var(--level-leve)',
          medio: 'var(--level-medio)',
          pesado: 'var(--level-pesado)',
          extremo: 'var(--level-extremo)',
        },
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        heat: 'var(--shadow-heat)',
      },
      backgroundImage: {
        'grad-heat': 'var(--grad-heat)',
        'glow-dare': 'var(--glow-dare)',
        'grad-overlay': 'var(--grad-overlay)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', ...defaultTheme.fontFamily.sans],
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        accent: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
      },
      outlineColor: {
        glow: 'var(--focus-glow-color)',
      },
    },
  },
  plugins: [],
};
