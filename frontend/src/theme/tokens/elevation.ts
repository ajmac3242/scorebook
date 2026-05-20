export const shadows = {
  0: "none",
  1: "0px 1px 2px rgba(16, 24, 40, 0.05)",
  2: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
  3: "0px 8px 24px -4px rgba(16, 24, 40, 0.08), 0px 20px 48px -8px rgba(16, 24, 40, 0.12)",
  4: "0px 24px 48px -12px rgba(16, 24, 40, 0.18), 0px 48px 64px -24px rgba(16, 24, 40, 0.24)",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  snackbar: 1500,
  tooltip: 1600,
} as const;

export const elevationPrimitives = {
  shadows,
  zIndex,
};
