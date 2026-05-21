/**
 * App-specific semantic breakpoint names.
 */
export const breakpoints = {
  phone: 0,
  tablet: 768,
  laptop: 1200,
  desktop: 1440,
  giant: 1920,
} as const;

/**
 * Standard MUI breakpoint values mapped from app tokens.
 *
 * Mapping documentation:
 * - phone   -> xs (0px)
 * - tablet  -> sm (768px)
 * - laptop  -> md (1200px)
 * - desktop -> lg (1440px)
 * - giant   -> xl (1920px)
 */
export const muiBreakpointValues = {
  xs: breakpoints.phone,
  sm: breakpoints.tablet,
  md: breakpoints.laptop,
  lg: breakpoints.desktop,
  xl: breakpoints.giant,
} as const;

export const layoutModes = {
  phone: "stacked",
  tablet: "operational",
  laptop: "review",
  desktop: "expanded",
} as const;

export type AppBreakpoints = typeof breakpoints;
export type MuiBreakpointValues = typeof muiBreakpointValues;
export type AppLayoutModes = typeof layoutModes;
