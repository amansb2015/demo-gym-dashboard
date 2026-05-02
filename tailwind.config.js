/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#111827',
        coal: '#0f172a',
        mint: '#10b981',
        limefit: '#84cc16',
        ember: '#f97316',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.12)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        slideUp: 'slideUp 240ms ease-out',
      },
    },
  },
  plugins: [],
};
