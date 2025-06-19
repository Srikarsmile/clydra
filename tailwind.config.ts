import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    fontFamily: {
      sans: ['var(--font-sf)', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif']
    },
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0BA5EC',
          50: '#f0fafe',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0BA5EC',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Neo-Wave Tech Color System
        primary: {
          50: "#e6f4f8",
          100: "#b3dde8",
          200: "#80c6d8",
          300: "#4dafc8",
          400: "#2d9fb8",
          500: "#003E5F", // Deep Ocean Blue - trust & depth
          600: "#003550",
          700: "#002d41",
          800: "#002432",
          900: "#001b23",
          light: "#0090B7", // Brighter for dark mode
          dark: "#003E5F", // Deep Ocean for light mode
          DEFAULT: "#003E5F",
        },
        secondary: {
          50: "#e8fef5",
          100: "#c3fce3",
          200: "#9dfad1",
          300: "#77f8bf",
          400: "#5BE7A9", // Fresh Emerald - freshness & growth
          500: "#5BE7A9",
          600: "#2dd4bf",
          700: "#14b8a6",
          800: "#0f766e",
          900: "#134e4a",
          light: "#3AD6A0",
          dark: "#5BE7A9",
          DEFAULT: "#5BE7A9",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe4cc",
          200: "#ffc999",
          300: "#ffad66",
          400: "#ff9142",
          500: "#FF6B35", // Burnt Orange - urgency & action
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          light: "#FF874F",
          dark: "#FF6B35",
          DEFAULT: "#FF6B35",
        },
      },
      keyframes: {
        /* clydra-design */ fadeMove: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        /* clydra-design */ wiggle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' }
        },
      },
      animation: {
        /* clydra-design */ fadeMove: 'fadeMove 0.6s ease-out',
        /* clydra-design */ wiggle: 'wiggle 0.4s ease-in-out',
      }
    }
  },
  plugins: [],
}

export default config 