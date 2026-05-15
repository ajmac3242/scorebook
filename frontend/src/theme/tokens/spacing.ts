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
  inputHeightSm: 32,
  inputHeightMd: 40,
  inputHeightLg: 48,
} as const;

export const touch = {
  targetMin: 44,
  targetComfortable: 48,
  targetLarge: 56,
  iconButtonMin: 44,
  thumbReachInset: 16,
  dragHandleMin: 24,
} as const;

export const density = {
  live: {
    controlHeight: 48,
    iconButton: 44,
    cardPadding: 16,
    gap: 12,
    gridGap: 12,
  },
  review: {
    controlHeight: 40,
    iconButton: 36,
    cardPadding: 12,
    gap: 8,
    gridGap: 8,
  },
} as const;

export const shell = {
  safeAreaTop: "env(safe-area-inset-top)",
  safeAreaRight: "env(safe-area-inset-right)",
  safeAreaBottom: "env(safe-area-inset-bottom)",
  safeAreaLeft: "env(safe-area-inset-left)",
  topBarHeight: 56,
  bottomBarHeight: 64,
  sideRailWidthTablet: 88,
  sidebarWidthTablet: 320,
  sidebarWidthLaptop: 360,
} as const;

export const componentSize = {
  segmentedControlHeight: 40,
  filterBarMinHeight: 48,
  statCardMinWidthPhone: 140,
  statCardMinWidthTablet: 160,
  statCardMinWidthLaptop: 180,
  modalMaxWidthPhone: 560,
  modalMaxWidthTablet: 720,
  modalMaxWidthLaptop: 960,
  panelMinWidthTablet: 280,
  panelMinWidthLaptop: 320,
} as const;

export type SpacingScale = typeof spacing;
export type AppSpace = typeof space;
export type AppLayout = typeof layout;
export type AppTouch = typeof touch;
export type AppDensity = typeof density;
export type AppShell = typeof shell;
export type AppComponentSize = typeof componentSize;
