/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
          dark: "#003E5F",  // Deep Ocean for light mode
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
        // Ocean Depth Palette
        ocean: {
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
          950: "#003E5F", // Deep Ocean
        },
        // Emerald Wave Palette  
        wave: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0", 
          300: "#6ee7b7",
          400: "#34d399",
          500: "#5BE7A9", // Fresh Emerald
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // Background System
        bg: {
          base: {
            light: "#1B1B1E", // Charcoal for dark mode
            dark: "#F8FAFC",  // Soft white for light mode
            DEFAULT: "#F8FAFC",
          }
        },
        surface: {
          light: "#26272C",
          dark: "#FFFFFF",
          DEFAULT: "#FFFFFF",
        },
        // Text System
        text: {
          main: {
            light: "#F2F4F8",
            dark: "#1B1B1E",
            DEFAULT: "#1B1B1E",
          },
          muted: {
            light: "#A6ADBF",
            dark: "#64748B",
            DEFAULT: "#64748B",
          }
        },
        // Borders
        border: {
          light: "#33363D",
          dark: "#E2E8F0",
          DEFAULT: "#E2E8F0",
        },
        
        // Legacy brand colors (backward compatibility)
        brand: {
          primary: {
            50: "#e6f4f8",
            100: "#b3dde8", 
            200: "#80c6d8",
            300: "#4dafc8",
            400: "#2d9fb8",
            500: "#003E5F",
            600: "#003550",
            700: "#002d41",
            800: "#002432",
            900: "#001b23",
            950: "#001014",
          },
          secondary: {
            50: "#e8fef5",
            100: "#c3fce3",
            200: "#9dfad1",
            300: "#77f8bf",
            400: "#5BE7A9",
            500: "#5BE7A9",
            600: "#2dd4bf",
            700: "#14b8a6",
            800: "#0f766e",
            900: "#134e4a",
            950: "#042f2e",
          },
          accent: {
            50: "#fff4ed",
            100: "#ffe4cc",
            200: "#ffc999",
            300: "#ffad66",
            400: "#ff9142",
            500: "#FF6B35",
            600: "#ea580c",
            700: "#c2410c",
            800: "#9a3412",
            900: "#7c2d12",
            950: "#431407",
          },
        },
        // Advanced Neutral Palette
        neutral: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
          1000: "#000000",
        },
        // AI/Tech Themed Colors
        ai: {
          electric: "#00d4ff",
          neon: "#39ff14",
          cyber: "#ff0080",
          matrix: "#00ff41",
          plasma: "#ff6b35",
        },
      },
      fontFamily: {
        // Apple System Font Stack
        sans: [
          "-apple-system", 
          "BlinkMacSystemFont", 
          "Inter",
          "SF Pro",
          "system-ui", 
          "Roboto", 
          "Helvetica Neue", 
          "Arial", 
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "Monaco", 
          "JetBrains Mono",
          "Inconsolata", 
          "Roboto Mono", 
          "Consolas", 
          "monospace"
        ],
        display: [
          "-apple-system", 
          "BlinkMacSystemFont", 
          "Inter",
          "SF Pro Display",
          "system-ui", 
          "sans-serif"
        ],
      },
      fontSize: {
        // Apple HIG Typography Scale
        'caption-2': ['11px', { lineHeight: '1.26', letterSpacing: '0.06em' }],
        'caption-1': ['12px', { lineHeight: '1.33', letterSpacing: '0' }],
        'footnote': ['13px', { lineHeight: '1.38', letterSpacing: '-0.08px' }],
        'subhead': ['15px', { lineHeight: '1.27', letterSpacing: '-0.24px' }],
        'callout': ['16px', { lineHeight: '1.34', letterSpacing: '-0.32px' }],
        'body': ['17px', { lineHeight: '1.34', letterSpacing: '-0.41px' }],
        'headline': ['17px', { lineHeight: '1.34', letterSpacing: '-0.41px', fontWeight: '600' }],
        'title-3': ['20px', { lineHeight: '1.2', letterSpacing: '0.38px' }],
        'title-2': ['22px', { lineHeight: '1.18', letterSpacing: '0.35px' }],
        'title-1': ['28px', { lineHeight: '1.11', letterSpacing: '0.36px' }],
        'large-title': ['34px', { lineHeight: '1.06', letterSpacing: '0.37px' }],
        
        // Legacy sizes for compatibility
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025em" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.025em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.025em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.025em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.025em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.05em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.05em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.05em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.05em" }],
        "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.075em" }],
        "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.075em" }],
        "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.075em" }],
      },
      fontWeight: {
        // Apple font weights
        'thin': '100',
        'light': '200',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'heavy': '800',
        'black': '900',
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',
        'md': '0.625rem', 
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Neo-Wave shadows
        'ocean-glow': '0 0 0 1px rgba(0, 62, 95, 0.15), 0 0 25px rgba(0, 62, 95, 0.1)',
        'wave-glow': '0 0 0 1px rgba(91, 231, 169, 0.15), 0 0 25px rgba(91, 231, 169, 0.1)',
        'accent-glow': '0 0 0 1px rgba(255, 107, 53, 0.15), 0 0 25px rgba(255, 107, 53, 0.1)',
        'primary-glow': '0 0 0 1px rgba(0, 62, 95, 0.15), 0 0 25px rgba(0, 62, 95, 0.1)',
        'primary-glow-lg': '0 0 0 1px rgba(0, 62, 95, 0.2), 0 0 40px rgba(0, 62, 95, 0.15)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in-spring': 'scale-in-spring 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ocean-flow': 'ocean-flow 8s ease-in-out infinite',
        'wave-ripple': 'wave-ripple 2s ease-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in-spring': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'ocean-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'wave-ripple': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' }
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 62, 95, 0.1)' },
          '100%': { boxShadow: '0 0 0 20px rgba(0, 62, 95, 0)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      backgroundImage: {
        'gradient-neo-wave': 'linear-gradient(135deg, #003E5F 0%, #0090B7 50%, #5BE7A9 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #003E5F 0%, #0ea5e9 100%)',
        'gradient-wave': 'linear-gradient(135deg, #5BE7A9 0%, #3AD6A0 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FF6B35 0%, #FF874F 100%)',
        'wave-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23003E5F' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm12 0c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      backdropBlur: {
        'xs': '2px',
      },
      scale: {
        102: "1.02",
        103: "1.03",
        98: "0.98",
        97: "0.97",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        '400': '400ms',
      }
    },
  },
  plugins: [],
};
