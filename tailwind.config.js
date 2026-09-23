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
        ivory: {
          50: "#fbfaf7",
          100: "#f5f3ec",
          200: "#eae6db",
          300: "#dbd3c0",
          400: "#c8bca0",
          500: "#b2a07c",
          600: "#9c865f",
          700: "#7d6a4b",
          800: "#5f5038",
          900: "#45392a",
        },
        peach: {
          50: "#fff4ed",
          100: "#ffe6d7",
          200: "#ffc9a8",
          300: "#ffa473",
          400: "#ff7a3c",
          500: "#fb5a14",
          600: "#e6430a",
          700: "#bf3209",
          800: "#98290e",
          900: "#7b2410",
        },
      },
    },
  },
  plugins: [],
}