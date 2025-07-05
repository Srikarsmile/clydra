import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // @performance - Optimize color palette (remove unused colors)
      colors: {
        primary: "#5e35b1",
        "primary-light": "rgba(94, 53, 177, 0.1)",
        "primary-dark": "#4a148c",
        "bg-base": "#f8f9fb",
        "text-muted": "#6b7280",
      },
      // @performance - Optimize font family
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // @performance - Essential animations only
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "scale-in-spring": "scaleInSpring 0.5s ease-out forwards",
        "page-enter": "pageEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleInSpring: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pageEnter: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      // @performance - Optimize breakpoints
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
  // @performance - Optimize for production
  corePlugins: {
    // Disable unused plugins for smaller bundle
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
  },
};

export default config;
