export const spacing = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
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
  xxs: spacing[1],
  xs: spacing[2],
  sm: spacing[3],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
  xxl: spacing[12],
  xxxl: spacing[16],
} as const;

export const layout = {
  pagePaddingX: spacing[4],
  pagePaddingXWide: spacing[6],
  pagePaddingY: spacing[4],
  sectionGap: spacing[6],
  panelGap: spacing[4],
  gridGap: spacing[4],
  gridGapDense: spacing[3],
  stackGap: spacing[3],
  stackGapDense: spacing[2],
  inlineGap: spacing[2],
  inlineGapTight: spacing[1.5],
  controlGap: spacing[2],
  cardPaddingCompact: spacing[4],
  cardPadding: spacing[6],
  cardPaddingLarge: spacing[8],
  dialogPadding: spacing[6],
  toolbarHeight: 56,
  touchTargetMin: 44,
  inputHeightSm: 32,
  inputHeightMd: 40,
  inputHeightLg: 48,
} as const;

export type SpacingScale = typeof spacing;
export type AppSpace = typeof space;
export type AppLayout = typeof layout;
