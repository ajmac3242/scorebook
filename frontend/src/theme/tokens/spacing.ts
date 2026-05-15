// frontend/src/tokens/spacing.ts

export const spacing = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const space = {
  xxs: spacing[1], // 4
  xs: spacing[2], // 8
  sm: spacing[3], // 12
  md: spacing[4], // 16
  lg: spacing[6], // 24
  xl: spacing[8], // 32
  xxl: spacing[12], // 48
  xxxl: spacing[16], // 64
} as const;

export const layout = {
  pagePaddingX: spacing[4], // 16
  pagePaddingXWide: spacing[6], // 24
  pagePaddingY: spacing[4], // 16
  sectionGap: spacing[6], // 24
  cardPaddingCompact: spacing[4], // 16
  cardPadding: spacing[6], // 24
  cardPaddingLarge: spacing[8], // 32
  panelGap: spacing[4], // 16
  stackGap: spacing[3], // 12
  inlineGap: spacing[2], // 8
  controlGap: spacing[2], // 8
  gridGap: spacing[4], // 16
  dialogPadding: spacing[6], // 24
  toolbarHeight: 56,
  touchTargetMin: 44,
  dottedGridSize: 24,
  dottedGridDot: 1,
} as const;

export type SpacingScale = typeof spacing;
export type AppSpace = typeof space;
export type AppLayout = typeof layout;
