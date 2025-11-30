// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#3f51b5',
        'light-bg': '#f4f7fa',
        'gray-text': '#555',
      },
      transitionProperty: {
        'width': 'width',
      }
    },
  },
  plugins: [],
}