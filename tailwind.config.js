/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'murmur-dark': '#011e15',
        'murmur-post-bg': '#f2e4d4',
        'murmur-post-text': '#2c1b08',
        "icon-color": "#62eb3b",
      },
      fontFamily: {
        italianno: ['Italianno', 'cursive'],
        raleway: ['Raleway', 'sans-serif'],
        instrument: ['Instrument Sans', 'sans-serif'],
        dancing: ['Dancing Script', 'cursive'],
        monoton: ['Monoton', 'cursive'],
        judson: ['Judson', 'serif'],
        elsie: ['"Elsie Swash Caps"', 'cursive']
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 0 },
        },
        progress: {
            '0%': { width: '0%' },
            '100%': { width: '100%' },
        }
      },
      animation: {
        blink: 'blink 1s linear infinite',
        progress: 'progress 5s linear forwards',
      },
    },
  },
  plugins: [],
}