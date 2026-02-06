/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a1a15",      // Deep dark green
        surface: "#0f2920",         // Card background
        surfaceLight: "#153528",    // Lighter surface
        primary: "#22c55e",         // Bright green
        primaryLight: "#4ade80",
        primaryDark: "#16a34a",
        protein: "#3b82f6",         // Blue
        carbs: "#22c55e",           // Green
        fats: "#f97316",            // Orange
        water: "#06b6d4",           // Cyan
        border: "#1f3d32",
        borderLight: "#2d5242",
        text: "#ffffff",
        textDim: "#9ca3af",
        textMuted: "#6b7280",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
      }
    },
  },
  plugins: [],
}
