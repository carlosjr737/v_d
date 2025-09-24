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
        boost: 'var(--glow-boost)',
        holo: 'var(--shadow-holo)',
      },
      backgroundImage: {
        'grad-heat': 'var(--grad-heat)',
        'grad-lobby': 'var(--grad-lobby)',
        'grad-card-back': 'var(--grad-card-back)',
        'glow-dare': 'var(--glow-dare)',
        'grad-overlay': 'var(--grad-overlay)',
        'texture-sparks': 'var(--texture-sparks)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', ...defaultTheme.fontFamily.sans],
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        accent: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
      },
      outlineColor: {
        glow: 'var(--focus-glow-color)',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        neonPulse: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 0 rgba(255, 46, 126, 0))',
            boxShadow: 'inset 0 0 0 0 rgba(255, 46, 126, 0)',
          },
          '50%': {
            filter: 'drop-shadow(0 0 24px rgba(196, 0, 255, 0.4))',
            boxShadow: 'inset 0 0 14px 0 rgba(255, 46, 126, 0.55)',
          },
        },
        ascendParticles: {
          '0%': { transform: 'translate3d(0, 30%, 0) scale(0.85)', opacity: '0' },
          '20%': { opacity: '0.75' },
          '80%': { opacity: '0.6' },
          '100%': { transform: 'translate3d(0, -70%, 0) scale(1.1)', opacity: '0' },
        },
      },
      animation: {
        'card-flip': 'cardFlip var(--card-flip-duration) var(--card-flip-timing) both',
        'neon-pulse': 'neonPulse var(--neon-pulse-duration) ease-in-out infinite',
        'particle-rise': 'ascendParticles var(--particle-rise-duration) linear infinite',
      },
    },
  },
  plugins: [],
};
