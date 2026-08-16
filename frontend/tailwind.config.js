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
          dark: '#030712',
          light: '#f3f4f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
          accent: '#6366f1',
        }
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
}
