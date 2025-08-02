/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-blue': {
          DEFAULT: '#00A9FF',
          dark: '#2F80ED'
        },
        'brand-teal': {
          DEFAULT: '#A0E9FF',
          dark: '#81E6D9'
        },
        'brand-light': {
          DEFAULT: '#CDF5FD',
          dark: '#B2F5EA'
        },
        'brand-dark': {
          DEFAULT: '#00427E',
          dark: '#2C5282'
        },
        light: {
          bg: '#ffffff',
          text: '#1F2937',
          accent: '#00A9FF',
          surface: '#F3F4F6'
        },
        dark: {
          bg: '#1F2937',
          text: '#F3F4F6',
          accent: '#A0E9FF',
          surface: '#374151'
        },
      },
    },
  },
  plugins: [],
}