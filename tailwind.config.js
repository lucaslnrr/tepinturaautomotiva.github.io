/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#121212",
          primary: "#1f2937",
          accent: "#facc15",
          dark: "#111827",
          gray: "#6b7280"
        }
      },
      fontFamily: { sans: ['ui-sans-serif','system-ui','Segoe UI','Roboto','Arial'] },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,.08)" }
    },
  },
  plugins: [],
}
