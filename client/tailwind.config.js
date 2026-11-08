/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#f0f5ff',
          100: '#e0ebfe',
          200: '#c7d9fd',
          300: '#9ebafd',
          400: '#6f92fa',
          500: '#4361ee',
          600: '#3046d7',
          700: '#2535ae',
          800: '#212d8c',
          900: '#1e286f',
          950: '#131944',
        }
      }
    },
  },
  plugins: [],
}
