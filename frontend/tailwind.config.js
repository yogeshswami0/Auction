/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#000000',
          light: '#ffffff',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
          accent: '#ffffff',
        },
        indigo: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#262626',
          700: '#373737',
          800: '#171717',
          900: '#0a0a0a',
          950: '#000000',
        }
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(255, 255, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
