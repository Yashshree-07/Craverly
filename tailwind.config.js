/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3fb",
          100: "#e9e6f7",
          200: "#d2cbed",
          300: "#b0a6e0",
          400: "#8a7ccf",
          500: "#6354b8",
          600: "#43368f",
          700: "#2b1f6e",   // deep indigo-violet
          800: "#251a5c",   // brand base
          900: "#17103c",
        },
      },
    },
  },
  plugins: [],
}