/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: ['html', 'body'],
  theme: {
    extend: {
      colors: {
        'linen': '#F0EFE7',
        'steel-blue': '#4682B4',
        'accent': '#2a4d69',
        'light-accent': '#d6e1e8',
      },
      spacing: {
        '128': '32rem',
      },
      fontFamily: {
        sans: ['Segoe UI', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}