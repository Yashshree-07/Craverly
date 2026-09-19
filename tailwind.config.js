/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff1f0",
          500: "#e23744",   // Zomato-red-ish, tweak as you like
          600: "#cb202d",
          700: "#a5171f",
        },
      },
    },
  },
  plugins: [],
}