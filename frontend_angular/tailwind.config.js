/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4F86C6',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        secondary: {
          light: '#CBD5E1',
          DEFAULT: '#94A3B8',
          dark: '#64748B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
}

