/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgba(10, 10, 12, <alpha-value>)',
        card: 'rgba(20, 20, 25, <alpha-value>)',
        accent: {
          DEFAULT: '#6366f1', // Indigo
          hover: '#4f46e5',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
        muted: {
          DEFAULT: '#94a3b8',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
