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
          dark: '#ffffff',
          light: '#0a0a0a',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
          accent: '#171717',
        },
        indigo: {
          50: '#0a0a0a',
          100: '#171717',
          200: '#262626',
          300: '#404040',
          400: '#525252',
          500: '#404040',
          600: '#171717',
          700: '#373737',
          800: '#e5e5e5',
          900: '#f5f5f5',
          950: '#ffffff',
        },
        gray: {
          50: '#0a0a0a',
          100: '#171717',
          200: '#262626',
          300: '#404040',
          400: '#525252',
          500: '#737373',
          600: '#a3a3a3',
          700: '#d4d4d4',
          800: '#e5e5e5',
          900: '#f5f5f5',
          950: '#ffffff',
        }
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        glow: '0 0 15px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
