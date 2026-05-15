export const fontFamily = {
  body: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  accent: '"EB Garamond", "Playfair Display", Georgia, serif',
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

export const textStyles = {
  titleLg: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.bold,
    fontSize: fontSize["3xl"],
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  titleMd: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  titleSm: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  sectionTitle: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  cardTitle: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  labelMd: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelSm: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
  metric: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.bold,
    fontSize: fontSize["2xl"],
    lineHeight: 1,
    letterSpacing: letterSpacing.tighter,
  },
  metricLabel: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
  button: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
    lineHeight: 1.2,
    letterSpacing: letterSpacing.normal,
    textTransform: "none" as const,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: "0",
  },
  editorialAccent: {
    fontFamily: fontFamily.accent,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
} as const;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
};

export type AppTypography = typeof typography;
