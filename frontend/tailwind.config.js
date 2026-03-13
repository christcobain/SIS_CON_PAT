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
        primary: {
          DEFAULT: '#7F1D1D',
          hover:   '#991B1B',
          light:   '#FECACA',
          muted:   '#FCA5A5',
        },
        'background-light': '#f8f6f6',
       'background-dark':  '#0f172a',
      },
      fontFamily: {
        sans:    ['Public Sans', 'system-ui', 'sans-serif'],
        display: ['Public Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        full:    '9999px',
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .06)',
        modal:   '0 20px 60px -10px rgb(0 0 0 / .25)',
        sidebar: '2px 0 12px 0 rgb(0 0 0 / .08)',
      },
    },
  },

  plugins: [],
}