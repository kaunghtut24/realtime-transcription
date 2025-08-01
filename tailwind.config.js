/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#00A9FF',
        'brand-teal': '#A0E9FF',
        'brand-light': '#CDF5FD',
        'brand-dark': '#00427E',
      },
    },
  },
  plugins: [],
}