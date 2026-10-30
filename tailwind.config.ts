import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Primary — Deep Teal
        primary: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#a3faef",
          300: "#80d5cb",
          400: "#4db8ae",
          500: "#009b8e",
          600: "#007a70",
          700: "#0f766e",
          800: "#005c55",
          900: "#00201d",
          DEFAULT: "#005c55",
          container: "#0f766e",
          "on-container": "#a3faef",
        },
        // Stitch Secondary — Warm Amber
        secondary: {
          50:  "#fffbeb",
          100: "#ffddb8",
          200: "#ffb95f",
          300: "#fea619",
          400: "#d97706",
          500: "#855300",
          600: "#684000",
          700: "#653e00",
          800: "#2a1700",
          900: "#1a0e00",
          DEFAULT: "#855300",
          container: "#fea619",
          "on-container": "#684000",
        },
        // Stitch Tertiary — Forest Green
        tertiary: {
          50:  "#f0fdf4",
          100: "#7ffc97",
          200: "#62df7d",
          300: "#16a34a",
          400: "#007a33",
          500: "#005f26",
          600: "#005320",
          700: "#002109",
          DEFAULT: "#005f26",
          container: "#007a33",
          "on-container": "#a1ffad",
        },
        // Surfaces
        surface: {
          DEFAULT: "#faf8ff",
          dim: "#d2d9f4",
          bright: "#faf8ff",
          lowest: "#ffffff",
          low: "#f2f3ff",
          container: "#eaedff",
          high: "#e2e7ff",
          highest: "#dae2fd",
        },
        // Text
        "on-surface": "#131b2e",
        "on-surface-variant": "#3e4947",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        // Borders
        outline: "#6e7977",
        "outline-variant": "#bdc9c6",
        // Error
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          "on-container": "#93000a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "0.75rem",
        input: "0.5rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15,23,42,0.04), 0 1px 2px -1px rgba(15,23,42,0.02)",
        "card-hover": "0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04)",
        modal: "0 20px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.04)",
      },
      spacing: {
        "gutter": "1.5rem",
        "gutter-sm": "1rem",
        "gutter-lg": "2rem",
      },
      maxWidth: {
        "8xl": "1280px",
      },
      animation: {
        "pulse-dot": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
