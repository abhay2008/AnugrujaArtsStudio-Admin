/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          gold: '#f2d770',
          'gold-light': '#fdf6d8',
          'gold-dark': '#b8933a',
          purple: '#371842',
          'purple-light': '#512461',
          'purple-dark': '#210c28',
          dark: '#0d0512',
          card: '#200e2a',
          border: '#3d1c4a',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Trajan Pro', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
