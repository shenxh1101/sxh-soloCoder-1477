/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: "#FFF5EE",
          100: "#FFE8D6",
          200: "#FFD0AE",
          300: "#FFB17A",
          400: "#FF8F4A",
          500: "#FF6B35",
          600: "#ED511A",
          700: "#C43E10",
          800: "#9B3110",
          900: "#7E2A10",
        },
        warn: {
          400: "#FF6B6B",
          500: "#FF4757",
          600: "#E63946",
        },
        success: {
          400: "#8FE388",
          500: "#6BCB77",
          600: "#4CAF50",
        },
        cream: {
          50: "#FFFBF5",
          100: "#FFF8F0",
          200: "#FDECD8",
        },
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', "system-ui", "sans-serif"],
        body: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(255, 107, 53, 0.15)",
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
        pop: "0 8px 30px rgba(255, 107, 53, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-soft": "bounce 1.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shake: "shake 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};
