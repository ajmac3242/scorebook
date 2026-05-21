import type { ThemePreset } from "./tokens/tokens";

export const PRESETS: ThemePreset[] = [
  {
    id: "classic",
    label: "CourtSight Classic",
    previewColor: "#12B5CB",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#12B5CB",
              light: "#55D3E4",
              dark: "#0A7F90",
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
            default: "#0C1218",
            subtle: "#111922",
            paper: "#16212C",
            elevated: "#1C2834",
            inset: "#080D12",
          },
          surface: {
            default: "#16212C",
            subtle: "#1B2733",
            elevated: "#22303D",
            inset: "#080D12",
            strong: "#2B3B4C",
            accentSoft: "rgba(18, 181, 203, 0.12)",
          },
          text: {
            primary: "#EAF2F7",
            secondary: "#BCC8D4",
            tertiary: "#91A2B3",
            muted: "#6E8192",
            inverse: "#0C1218",
            disabled: "rgba(234, 242, 247, 0.38)",
            placeholder: "#8092A4",
          },
          border: {
            subtle: "#243344",
            default: "#314558",
            strong: "#40596F",
            accent: "rgba(18, 181, 203, 0.30)",
            focus: "#12B5CB",
          },
          action: {
            hover: "rgba(18, 181, 203, 0.08)",
            active: "rgba(18, 181, 203, 0.12)",
            selected: "rgba(18, 181, 203, 0.16)",
            disabled: "rgba(234, 242, 247, 0.38)",
            disabledBackground: "rgba(234, 242, 247, 0.08)",
            focusRing: "#12B5CB",
          },
        },
      },
    },
  },

  {
    id: "gametime",
    label: "Gametime",
    previewColor: "#2E78A6",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#2E78A6",
              light: "#4F95BE",
              dark: "#1F5C80",
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
            default: "#EEF1F4",
            subtle: "#E7EBF0",
            paper: "#FAFBFC",
            elevated: "#FFFFFF",
            inset: "#E3E8EE",
          },
          surface: {
            default: "#FAFBFC",
            subtle: "#F4F7FA",
            elevated: "#FFFFFF",
            inset: "#E3E8EE",
            strong: "#D7DEE7",
            accentSoft: "rgba(46, 120, 166, 0.08)",
          },
          text: {
            primary: "#163042",
            secondary: "#486173",
            tertiary: "#667C8C",
            muted: "#7E909E",
            inverse: "#FFFFFF",
            disabled: "rgba(22, 48, 66, 0.38)",
            placeholder: "#8A99A6",
          },
          border: {
            subtle: "#D8DEE6",
            default: "#C8D0DA",
            strong: "#B2BDC9",
            accent: "#B7D1E3",
            focus: "#2E78A6",
          },
          action: {
            hover: "rgba(46, 120, 166, 0.04)",
            active: "rgba(46, 120, 166, 0.08)",
            selected: "rgba(46, 120, 166, 0.10)",
            disabled: "rgba(31, 41, 51, 0.38)",
            disabledBackground: "rgba(31, 41, 51, 0.08)",
            focusRing: "#2E78A6",
          },
        },
      },
    },
  },

  {
    id: "hardwood",
    label: "Hardwood",
    previewColor: "#C7922F",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#C7922F",
              light: "#D8AB52",
              dark: "#966B1C",
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
            default: "#F6EEE1",
            subtle: "#EFE3CF",
            paper: "#FFF9EE",
            elevated: "#FFFFFF",
            inset: "#E5D6BE",
          },
          surface: {
            default: "#FFF9EE",
            subtle: "#F8EEDB",
            elevated: "#FFFFFF",
            inset: "#E5D6BE",
            strong: "#D8C29D",
            accentSoft: "rgba(199, 146, 47, 0.10)",
          },
          text: {
            primary: "#3C280F",
            secondary: "#6D4C24",
            tertiary: "#8A673A",
            muted: "#A68457",
            inverse: "#FFFFFF",
            disabled: "rgba(60, 40, 15, 0.38)",
            placeholder: "#A78B64",
          },
          border: {
            subtle: "#DFCDAF",
            default: "#CCB38A",
            strong: "#B99866",
            accent: "#E5C48B",
            focus: "#C7922F",
          },
          action: {
            hover: "rgba(199, 146, 47, 0.06)",
            active: "rgba(199, 146, 47, 0.10)",
            selected: "rgba(199, 146, 47, 0.12)",
            disabled: "rgba(60, 40, 15, 0.38)",
            disabledBackground: "rgba(60, 40, 15, 0.08)",
            focusRing: "#C7922F",
          },
        },
      },
    },
  },

  {
    id: "leather",
    label: "Leather",
    previewColor: "#B74A2A",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#B74A2A",
              light: "#D36A48",
              dark: "#84311A",
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
            default: "#140C08",
            subtle: "#1A120E",
            paper: "#211611",
            elevated: "#2A1C16",
            inset: "#0D0604",
          },
          surface: {
            default: "#211611",
            subtle: "#271A14",
            elevated: "#2E2019",
            inset: "#0D0604",
            strong: "#3A281F",
            accentSoft: "rgba(183, 74, 42, 0.12)",
          },
          text: {
            primary: "#F1E4D8",
            secondary: "#C8AE9A",
            tertiary: "#9F806E",
            muted: "#7E6254",
            inverse: "#140C08",
            disabled: "rgba(241, 228, 216, 0.38)",
            placeholder: "#8D7062",
          },
          border: {
            subtle: "#35231B",
            default: "#463024",
            strong: "#5C4133",
            accent: "rgba(183, 74, 42, 0.30)",
            focus: "#B74A2A",
          },
          action: {
            hover: "rgba(183, 74, 42, 0.08)",
            active: "rgba(183, 74, 42, 0.12)",
            selected: "rgba(183, 74, 42, 0.16)",
            disabled: "rgba(241, 228, 216, 0.38)",
            disabledBackground: "rgba(241, 228, 216, 0.08)",
            focusRing: "#B74A2A",
          },
        },
      },
    },
  },

  {
    id: "blacktop",
    label: "Blacktop",
    previewColor: "#F28C18",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#F28C18",
              light: "#FFAA47",
              dark: "#B86300",
              contrastText: "#0A0A0A",
            },
            secondary: {
              main: "#6B7280",
              light: "#9CA3AF",
              dark: "#4B5563",
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#08090A",
            subtle: "#0F1113",
            paper: "#14171A",
            elevated: "#1D2126",
            inset: "#040404",
          },
          surface: {
            default: "#14171A",
            subtle: "#1A1F24",
            elevated: "#22272D",
            inset: "#040404",
            strong: "#2C333B",
            accentSoft: "rgba(242, 140, 24, 0.13)",
          },
          text: {
            primary: "#F3F5F7",
            secondary: "#C3C9D1",
            tertiary: "#98A1AB",
            muted: "#707983",
            inverse: "#0A0A0A",
            disabled: "rgba(243, 245, 247, 0.38)",
            placeholder: "#7F8892",
          },
          border: {
            subtle: "#272D33",
            default: "#353D45",
            strong: "#48515B",
            accent: "rgba(242, 140, 24, 0.34)",
            focus: "#F28C18",
          },
          action: {
            hover: "rgba(242, 140, 24, 0.08)",
            active: "rgba(242, 140, 24, 0.12)",
            selected: "rgba(242, 140, 24, 0.16)",
            disabled: "rgba(243, 245, 247, 0.38)",
            disabledBackground: "rgba(243, 245, 247, 0.08)",
            focusRing: "#F28C18",
          },
        },
      },
    },
  },
];

export const DEFAULT_PRESET_ID = "gametime";

export default PRESETS;
