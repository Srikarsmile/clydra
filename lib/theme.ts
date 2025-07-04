/**
 * Clydra Labs Theme Configuration
 *
 * This file contains the complete theme system for Clydra Labs, including:
 * - Brand colors and design tokens
 * - Component variants and styles
 * - Utility functions for theme consistency
 * - TypeScript types for theme safety
 */

// Brand Colors
export const brandColors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Main brand blue
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  secondary: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7", // Main brand purple
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  accent: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981", // Success/accent green
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Warning orange
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // Error red
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
} as const;

// AI Theme Colors
export const aiColors = {
  electric: "#00d4ff",
  neon: "#39ff14",
  cyber: "#ff0080",
  matrix: "#00ff41",
  plasma: "#ff6b35",
} as const;

// Neutral Colors
export const neutralColors = {
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
} as const;

// Typography
export const typography = {
  fontFamily: {
    primary: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
    display: '"Inter", system-ui, sans-serif',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
    "8xl": "6rem",
    "9xl": "8rem",
  },
  fontWeight: {
    thin: "100",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

// Spacing
export const spacing = {
  xs: "0.5rem",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "3rem",
  "2xl": "4rem",
  "3xl": "6rem",
  "4xl": "8rem",
} as const;

// Border Radius
export const borderRadius = {
  none: "0",
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  "4xl": "2rem",
  "5xl": "2.5rem",
  full: "9999px",
} as const;

// Shadows
export const shadows = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  brandGlow:
    "0 0 0 1px rgba(59, 130, 246, 0.15), 0 0 25px rgba(59, 130, 246, 0.1)",
  aiGlow: "0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)",
  successGlow:
    "0 0 0 1px rgba(16, 185, 129, 0.15), 0 0 25px rgba(16, 185, 129, 0.1)",
  errorGlow:
    "0 0 0 1px rgba(239, 68, 68, 0.15), 0 0 25px rgba(239, 68, 68, 0.1)",
} as const;

// Animations
export const animations = {
  transition: {
    fast: "0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    base: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  duration: {
    fast: "150ms",
    base: "300ms",
    slow: "500ms",
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// Component Variants
export const componentVariants = {
  button: {
    size: {
      xs: "btn-xs",
      sm: "btn-sm",
      md: "btn-md",
      lg: "btn-lg",
      xl: "btn-xl",
    },
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      danger: "btn-danger",
      success: "btn-success",
    },
  },
  card: {
    variant: {
      default: "card",
      interactive: "card-interactive",
      gradient: "card-gradient",
      ai: "card-ai",
      glass: "glass-card",
    },
  },
  badge: {
    variant: {
      primary: "badge-primary",
      secondary: "badge-secondary",
      success: "badge-success",
      warning: "badge-warning",
      danger: "badge-danger",
      ai: "badge-ai",
    },
  },
  input: {
    size: {
      sm: "input-small",
      md: "input-field",
      lg: "input-large",
    },
  },
} as const;

// Gradients
export const gradients = {
  brand: "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)",
  ai: "linear-gradient(135deg, #00d4ff 0%, #39ff14 50%, #ff0080 100%)",
  mesh: `
    radial-gradient(at 40% 20%, hsla(228,100%,74%,1) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
    radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
    radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
    radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)
  `,
  subtle: {
    primary:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
    ai: "linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(57, 255, 20, 0.05) 50%, rgba(255, 0, 128, 0.05) 100%)",
  },
} as const;

// Status Colors
export const statusColors = {
  online: brandColors.accent[500],
  offline: neutralColors[400],
  busy: brandColors.warning[500],
  error: brandColors.danger[500],
  success: brandColors.accent[500],
  warning: brandColors.warning[500],
  info: brandColors.primary[500],
} as const;

// Z-Index Scale
export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Theme object combining all tokens
export const theme = {
  colors: {
    brand: brandColors,
    ai: aiColors,
    neutral: neutralColors,
    status: statusColors,
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  gradients,
  zIndex,
  breakpoints,
  componentVariants,
} as const;

// Type definitions
export type BrandColor = keyof typeof brandColors;
export type ColorScale = keyof typeof brandColors.primary;
export type NeutralColor = keyof typeof neutralColors;
export type AIColor = keyof typeof aiColors;
export type StatusColor = keyof typeof statusColors;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;

// Utility functions
export const getColor = (color: BrandColor, scale: ColorScale = 500) => {
  return brandColors[color][scale];
};

export const getNeutralColor = (scale: NeutralColor) => {
  return neutralColors[scale];
};

export const getAIColor = (color: AIColor) => {
  return aiColors[color];
};

export const getStatusColor = (status: StatusColor) => {
  return statusColors[status];
};

export const getFontSize = (size: FontSize) => {
  return typography.fontSize[size];
};

export const getSpacing = (size: Spacing) => {
  return spacing[size];
};

export const getShadow = (shadow: Shadow) => {
  return shadows[shadow];
};

export const getZIndex = (layer: ZIndex) => {
  return zIndex[layer];
};

// Component class name builders
export const buildButtonClasses = (
  variant: keyof typeof componentVariants.button.variant = "primary",
  size: keyof typeof componentVariants.button.size = "md"
) => {
  return `${componentVariants.button.variant[variant]} ${componentVariants.button.size[size]}`;
};

export const buildCardClasses = (
  variant: keyof typeof componentVariants.card.variant = "default"
) => {
  return componentVariants.card.variant[variant];
};

export const buildBadgeClasses = (
  variant: keyof typeof componentVariants.badge.variant = "primary"
) => {
  return componentVariants.badge.variant[variant];
};

export const buildInputClasses = (
  size: keyof typeof componentVariants.input.size = "md"
) => {
  return componentVariants.input.size[size];
};

// CSS custom property generators
export const generateCSSCustomProperties = () => {
  const properties: Record<string, string> = {};

  // Brand colors
  Object.entries(brandColors).forEach(([colorName, colorScale]) => {
    Object.entries(colorScale).forEach(([scale, value]) => {
      properties[`--color-brand-${colorName}-${scale}`] = value;
    });
  });

  // AI colors
  Object.entries(aiColors).forEach(([colorName, value]) => {
    properties[`--color-ai-${colorName}`] = value;
  });

  // Neutral colors
  Object.entries(neutralColors).forEach(([scale, value]) => {
    properties[`--color-neutral-${scale}`] = value;
  });

  // Spacing
  Object.entries(spacing).forEach(([size, value]) => {
    properties[`--spacing-${size}`] = value;
  });

  return properties;
};

// Default export
export default theme;
