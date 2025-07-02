import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    fontFamily: {
      sans: [
        "var(--font-sf)",
        "ui-sans-serif",
        "-apple-system",
        "BlinkMacSystemFont",
        "SF Pro Text",
        "Segoe UI",
        "Roboto",
        "Inter",
        "sans-serif",
      ],
    },
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0BA5EC",
          50: "#f0fafe",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0BA5EC",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Option 3 Color Palette - Purple/Blue/Turquoise Theme
        brand: {
          50: "#f3f0ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#5E35B1", // Primary Purple
          600: "#4c1d95",
          700: "#3730a3",
          800: "#312e81",
          900: "#1e1b4b",
        },
        // Surface and background colors
        surface: "#ffffff",
        "text-main": "#212121",
        "text-muted": "#64748b",
        "sidebar-from": "#f8fafc",
        "sidebar-to": "#f1f5f9",

        // Primary Purple
        primary: {
          50: "#f3f0ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#5E35B1", // Primary Purple
          600: "#4c1d95",
          700: "#3730a3",
          800: "#312e81",
          900: "#1e1b4b",
          light: "#7C4DFF", // Brighter for dark mode
          dark: "#5E35B1", // Primary for light mode
          DEFAULT: "#5E35B1",
        },

        // Turquoise Secondary
        secondary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#00BFA5", // Turquoise
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          light: "#1DE9B6", // Bright for dark mode
          dark: "#00BFA5", // Primary for light mode
          DEFAULT: "#00BFA5",
        },

        // Electric Blue
        electric: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2196F3", // Electric Blue
          600: "#1976d2",
          700: "#1565c0",
          800: "#1e40af",
          900: "#1e3a8a",
          DEFAULT: "#2196F3",
        },

        // Bright Orange Accent
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#FF5722", // Bright Orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          light: "#FF6D40", // Vibrant for dark mode
          dark: "#FF5722", // Primary for light mode
          DEFAULT: "#FF5722",
        },
      },
      keyframes: {
        /* clydra-design */ fadeMove: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* clydra-design */ wiggle: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        /* clydra-design */ fadeMove: "fadeMove 0.6s ease-out",
        /* clydra-design */ wiggle: "wiggle 0.4s ease-in-out",
      },
    },
  },
  plugins: [
    // @dashboard-redesign - Add custom utility plugins
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};

export default config;
