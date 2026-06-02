import type { ThemePreset } from "./tokens/tokens";

export const PRESETS: ThemePreset[] = [
  {
    id: "classic",
    label: "CourtSight Classic",
    previewColor: "#00C9E0",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#00C9E0",
              light: "#5FE2F2",
              dark: "#008A9C",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: "#4E6A80",
              light: "#7E96A8",
              dark: "#324657",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#06101A",
            subtle: "#091522",
            paper: "#0D1E2E",
            elevated: "#152538",
            inset: "#03080D",
          },
          surface: {
            default: "#0D1E2E",
            subtle: "#12263A",
            elevated: "#152538",
            inset: "#03080D",
            strong: "#1E3A52",
            accentSoft: "rgba(0, 201, 224, 0.12)",
          },
          text: {
            primary: "#F2F7FB",
            secondary: "#C7D3DE",
            tertiary: "#A7B8C7",
            muted: "#889AAA",
            inverse: "#06101A",
            disabled: "rgba(242, 247, 251, 0.42)",
            placeholder: "#94A7B8",
          },
          border: {
            subtle: "#162D42",
            default: "#1E3A52",
            strong: "#2B4D6B",
            accent: "rgba(0, 201, 224, 0.40)",
            focus: "#00C9E0",
          },
          action: {
            hover: "rgba(0, 201, 224, 0.08)",
            active: "rgba(0, 201, 224, 0.12)",
            selected: "rgba(0, 201, 224, 0.16)",
            disabled: "rgba(242, 247, 251, 0.38)",
            disabledBackground: "rgba(242, 247, 251, 0.08)",
            focusRing: "#00C9E0",
          },
        },
      },
    },
  },

  {
    id: "gametime",
    label: "Gametime",
    previewColor: "#1A65A0",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#1A65A0",
              light: "#3D87C2",
              dark: "#0D4A7A",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: "#64748B",
              light: "#94A3B8",
              dark: "#475569",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#E8EDF2",
            subtle: "#DFE5ED",
            paper: "#FFFFFF",
            elevated: "#FFFFFF",
            inset: "#DCE3EB",
          },
          surface: {
            default: "#FFFFFF",
            subtle: "#F8FAFC",
            elevated: "#FFFFFF",
            inset: "#DCE3EB",
            strong: "#D1DDEB",
            accentSoft: "rgba(26, 101, 160, 0.08)",
          },
          text: {
            primary: "#0E2336",
            secondary: "#486173",
            tertiary: "#667C8C",
            muted: "#7E909E",
            inverse: "#FFFFFF",
            disabled: "rgba(14, 35, 54, 0.38)",
            placeholder: "#8A99A6",
          },
          border: {
            subtle: "#D1DDEB",
            default: "#BCC7D4",
            strong: "#9AAABB",
            accent: "rgba(26, 101, 160, 0.30)",
            focus: "#1A65A0",
          },
          action: {
            hover: "rgba(26, 101, 160, 0.05)",
            active: "rgba(26, 101, 160, 0.10)",
            selected: "rgba(26, 101, 160, 0.12)",
            disabled: "rgba(14, 35, 54, 0.38)",
            disabledBackground: "rgba(14, 35, 54, 0.08)",
            focusRing: "#1A65A0",
          },
        },
      },
    },
  },

  {
    id: "hardwood",
    label: "Hardwood",
    previewColor: "#B8780F",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#B8780F",
              light: "#D49A38",
              dark: "#8A5608",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: "#7B6246",
              light: "#A08667",
              dark: "#594632",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#F0E4CE",
            subtle: "#E9D9B9",
            paper: "#FEF6E4",
            elevated: "#FFFFFF",
            inset: "#DCC9A4",
          },
          surface: {
            default: "#FEF6E4",
            subtle: "#F9F1DC",
            elevated: "#FFFFFF",
            inset: "#DCC9A4",
            strong: "#D2BD93",
            accentSoft: "rgba(184, 120, 15, 0.10)",
          },
          text: {
            primary: "#2E1A06",
            secondary: "#6D4C24",
            tertiary: "#8A673A",
            muted: "#A68457",
            inverse: "#FFFFFF",
            disabled: "rgba(46, 26, 6, 0.38)",
            placeholder: "#A78B64",
          },
          border: {
            subtle: "#DCC9A4",
            default: "#C4A872",
            strong: "#AA8A52",
            accent: "rgba(184, 120, 15, 0.30)",
            focus: "#B8780F",
          },
          action: {
            hover: "rgba(184, 120, 15, 0.06)",
            active: "rgba(184, 120, 15, 0.10)",
            selected: "rgba(184, 120, 15, 0.12)",
            disabled: "rgba(46, 26, 6, 0.38)",
            disabledBackground: "rgba(46, 26, 6, 0.08)",
            focusRing: "#B8780F",
          },
        },
      },
    },
  },

  {
    id: "leather",
    label: "Leather",
    previewColor: "#D4501E",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#D4501E",
              light: "#EE7040",
              dark: "#9C3610",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: "#8F6E5D",
              light: "#B09182",
              dark: "#644B3D",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#100906",
            subtle: "#160F0A",
            paper: "#1C1108",
            elevated: "#271A10",
            inset: "#080402",
          },
          surface: {
            default: "#1C1108",
            subtle: "#23180F",
            elevated: "#271A10",
            inset: "#080402",
            strong: "#3D2518",
            accentSoft: "rgba(212, 80, 30, 0.12)",
          },
          text: {
            primary: "#F3E8DE",
            secondary: "#D0B9A9",
            tertiary: "#B1917E",
            muted: "#927565",
            inverse: "#100906",
            disabled: "rgba(243, 232, 222, 0.40)",
            placeholder: "#9E8171",
          },
          border: {
            subtle: "#35231B",
            default: "#4A2E1E",
            strong: "#6A4030",
            accent: "rgba(212, 80, 30, 0.35)",
            focus: "#D4501E",
          },
          action: {
            hover: "rgba(212, 80, 30, 0.08)",
            active: "rgba(212, 80, 30, 0.12)",
            selected: "rgba(212, 80, 30, 0.16)",
            disabled: "rgba(243, 232, 222, 0.38)",
            disabledBackground: "rgba(243, 232, 222, 0.08)",
            focusRing: "#D4501E",
          },
        },
      },
    },
  },

  {
    id: "blacktop",
    label: "Blacktop",
    previewColor: "#FF7A00",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#FF7A00",
              light: "#FF9E40",
              dark: "#CC5A00",
              contrastText: "#050506",
            },
            secondary: {
              main: "#1192FF",
              light: "#56B5FF",
              dark: "#006DCC",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#050506",
            subtle: "#0A0B0D",
            paper: "#111316",
            elevated: "#18191C",
            inset: "#000000",
          },
          surface: {
            default: "#111316",
            subtle: "#161A1E",
            elevated: "#1E2228",
            inset: "#000000",
            strong: "#282E36",
            accentSoft: "rgba(255, 122, 0, 0.15)",
          },
          text: {
            primary: "#F8F8F0",
            secondary: "#C8CAC5",
            tertiary: "#9DA0A8",
            muted: "#6B7280",
            inverse: "#050506",
            disabled: "rgba(248, 248, 240, 0.38)",
            placeholder: "#4B5563",
          },
          border: {
            subtle: "#1E2228",
            default: "#2A2F38",
            strong: "#404850",
            accent: "rgba(255, 122, 0, 0.45)",
            focus: "#FF7A00",
          },
          action: {
            hover: "rgba(255, 122, 0, 0.10)",
            active: "rgba(255, 122, 0, 0.16)",
            selected: "rgba(255, 122, 0, 0.20)",
            disabled: "rgba(248, 248, 240, 0.35)",
            disabledBackground: "rgba(248, 248, 240, 0.06)",
            focusRing: "#FF7A00",
          },
        },
      },
    },
  },
];

export const DEFAULT_PRESET_ID = "gametime";

export default PRESETS;
