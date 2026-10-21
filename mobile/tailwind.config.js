/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#d4a017',
        'dark': '#10131d',
        'light': '#f8fafc',
        'accent': '#f2c14e',
        'ink': 'oklch(0.1 0.014 285 / <alpha-value>)',
        'panel': 'oklch(0.16 0.02 285 / <alpha-value>)',
        'gray': {
          100: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      width: {
        '7/8': '87.5%'
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Enables dark mode variants with the 'dark' class
}