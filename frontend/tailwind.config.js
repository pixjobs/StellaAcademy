/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // This is where we define our custom colors
      colors: {
        'mint': '#5eead4',
        'sky': '#38bdf8',
        'gold': '#fde047',
      },
    },
  },
  plugins: [],
}