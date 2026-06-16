export const fontFamily = {
  body: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display:
    '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  accent: '"EB Garamond", "Playfair Display", Georgia, serif',
  serif: '"EB Garamond", "Playfair Display", Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tighter: "-0.02em",
  tight: "-0.01em",
  normal: "0",
  wide: "0.01em",
  wider: "0.03em",
} as const;

export const typographyPrimitives = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
};
