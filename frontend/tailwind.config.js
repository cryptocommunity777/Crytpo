/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f97316", // Bright Orange
        secondary: "#fb923c", // Light Orange
        accent: "#ea580c", // Dark Orange/Lava
        darkBg: "#000000", // Pure Black
        cardBg: "#0a0a0a", // Slightly lighter black for cards
      }
    },
  },
  plugins: [],
}