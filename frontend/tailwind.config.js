/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        // Define a fonte 'Inter' como a fonte primária do projeto
        sans: ['Inter', 'system-ui', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}

