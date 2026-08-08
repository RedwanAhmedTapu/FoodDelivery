/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#17130F',
        surface: '#221C16',
        card: '#2A2219',
        cardHover: '#332A1F',
        border: '#3B3225',
        mango: {
          DEFAULT: '#FFB020',
          dark: '#E09A17',
          soft: '#3A2C13',
        },
        chili: {
          DEFAULT: '#E8491D',
          dark: '#C13A15',
          soft: '#3A1D12',
        },
        paper: '#F6F1E7',
        muted: '#B3A794',
        faint: '#7A7062',
        delivered: '#4C9A6A',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        ticket: '0 8px 24px -8px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'route-dots':
          'repeating-linear-gradient(to bottom, transparent 0, transparent 6px, #7A7062 6px, #7A7062 10px)',
      },
    },
  },
  plugins: [],
};
