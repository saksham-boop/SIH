/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          dark: "#0f2942",      // Deep navy primary
          navy: "#1e3a8a",      // Government blue
          lightNavy: "#2563eb",
          accent: "#0284c7",    // Slate sky
          gold: "#d97706",      // Official seal gold
          cream: "#f8fafc",     // Off-white public sector background
          card: "#ffffff",
          border: "#e2e8f0"
        },
        status: {
          valid: "#059669",      // Emerald green
          validBg: "#ecfdf5",
          validBorder: "#a7f3d0",
          review: "#d97706",     // Amber
          reviewBg: "#fffbeb",
          reviewBorder: "#fde68a",
          risk: "#dc2626",       // Crimson red
          riskBg: "#fef2f2",
          riskBorder: "#fecaca"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
