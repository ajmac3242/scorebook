export const breakpoints = {
  phone: 0,
  tablet: 768,
  laptop: 1200,
  desktop: 1440,
} as const;

export const muiBreakpointValues = {
  xs: breakpoints.phone,
  sm: breakpoints.tablet,
  md: breakpoints.laptop,
  lg: breakpoints.desktop,
  xl: 1920,
} as const;

export type AppBreakpoints = typeof breakpoints;
export type MuiBreakpointValues = typeof muiBreakpointValues;
