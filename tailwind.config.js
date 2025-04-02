/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  safelist: ['html', 'body', 'dark'],
  theme: {
    extend: {
      colors: {
        'linen': '#F0EFE7',
        'steel-blue': '#4682B4',
        'accent': '#2a4d69',
        'light-accent': '#d6e1e8',
        'dark-bg': '#1a1a2e',
        'dark-surface': '#16213e',
        'dark-accent': '#0f3460',
        'dark-text': '#e1e1e6',
        'dark-muted': '#a0a0a9',
      },
      spacing: {
        '128': '32rem',
      },
      fontFamily: {
        sans: ['Segoe UI', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}