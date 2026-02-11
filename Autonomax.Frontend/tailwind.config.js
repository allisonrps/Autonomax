/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas para o Autonomax (opcional)
        primary: "#000000",
        secondary: "#6fcaff",
      }
    },
  },
  plugins: [],
}