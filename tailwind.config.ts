import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        surface: {
          DEFAULT: "#0f1419",
          elevated: "#1a2332",
          overlay: "#252d3d",
        },
        accent: {
          coral: "#ff6b6b",
          teal: "#4ecdc4",
          gold: "#ffd93d",
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(78, 205, 196, 0.4)",
        "glow-red": "0 0 40px -10px rgba(255, 107, 107, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
