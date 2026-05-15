import type { ThemePreset } from "./tokens/tokens";

export const PRESETS: ThemePreset[] = [
  // ─── Classic ────────────────────────────────────────────────────────────────
  {
    id: "classic",
    label: "Classic",
    previewColor: "#287094",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: "#287094",
            primaryLight: "#5AA6C8",
            primaryDark: "#023246",
            secondary: "#D99E32",
          },
          background: {
            default: "#F6F6F6",
            subtle: "#F1F3F5",
            paper: "#FFFFFF",
            elevated: "#FFFFFF",
            inset: "#ECEFF2",
          },
          surface: {
            default: "#FFFFFF",
            subtle: "#F8FAFB",
            elevated: "#FFFFFF",
            inset: "#ECEFF2",
            strong: "#E0E5E9",
            accentSoft: "#EAF3F8",
          },
          text: {
            primary: "#023246",
            secondary: "#4F6B78",
            tertiary: "#6F8793",
            muted: "#9AAAB3",
            inverse: "#FFFFFF",
            disabled: "#9AAAB3",
          },
          border: {
            subtle: "#E1E6EA",
            default: "#CDD6DC",
            strong: "#AEBBC4",
            accent: "#B8D3DF",
            focus: "#287094",
          },
          action: {
            hover: "rgba(40, 112, 148, 0.06)",
            selected: "rgba(40, 112, 148, 0.12)",
            disabled: "rgba(2, 50, 70, 0.38)",
            disabledBackground: "rgba(2, 50, 70, 0.08)",
            focusRing: "#287094",
          },
          feedback: {
            success: {
              main: "#4E7D5B",
              light: "#709A7A",
              dark: "#2E5C10",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#A64444",
              light: "#BC6666",
              dark: "#782F2F",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#D99E32",
              light: "#E5AF45",
              dark: "#BC8323",
              contrastText: "#FFFFFF",
            },
            info: {
              main: "#287094",
              light: "#5AA6C8",
              dark: "#023246",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
    },
  },

  // ─── Gametime ───────────────────────────────────────────────────────────────
  {
    id: "gametime",
    label: "Gametime",
    previewColor: "#D99E32",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: "#D99E32",
            primaryLight: "#E5AF45",
            primaryDark: "#BC8323",
            secondary: "#287094",
          },
          background: {
            default: "#0E1117",
            subtle: "#13181F",
            paper: "#13181F",
            elevated: "#1A2028",
            inset: "#0A0D12",
          },
          surface: {
            default: "#13181F",
            subtle: "#171D26",
            elevated: "#1A2028",
            inset: "#0A0D12",
            strong: "#242C38",
            accentSoft: "#1C1A0F",
          },
          text: {
            primary: "#F0EDE8",
            secondary: "#A8A49E",
            tertiary: "#6E6B66",
            muted: "#4E4B48",
            inverse: "#0E1117",
            disabled: "#6E6B66",
          },
          border: {
            subtle: "#232931",
            default: "#2C3340",
            strong: "#3A4454",
            accent: "#4A3A10",
            focus: "#D99E32",
          },
          action: {
            hover: "rgba(217, 158, 50, 0.08)",
            selected: "rgba(217, 158, 50, 0.16)",
            disabled: "rgba(240, 237, 232, 0.38)",
            disabledBackground: "rgba(240, 237, 232, 0.08)",
            focusRing: "#D99E32",
          },
          feedback: {
            success: {
              main: "#6DAA45",
              light: "#8DC46A",
              dark: "#4D8F25",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#DD6974",
              light: "#E88E97",
              dark: "#C24A59",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#D99E32",
              light: "#E5AF45",
              dark: "#BC8323",
              contrastText: "#0E1117",
            },
            info: {
              main: "#5591C7",
              light: "#78AAD6",
              dark: "#3B78AB",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
    },
  },

  // ─── Hardwood ───────────────────────────────────────────────────────────────
  {
    id: "hardwood",
    label: "Hardwood",
    previewColor: "#B8620A",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: "#B8620A",
            primaryLight: "#D97A1A",
            primaryDark: "#7A3E05",
            secondary: "#5A7381",
          },
          background: {
            default: "#FBF6EE",
            subtle: "#F5EEE2",
            paper: "#FFFDF8",
            elevated: "#FFFFFF",
            inset: "#EDE5D6",
          },
          surface: {
            default: "#FFFDF8",
            subtle: "#F5EEE2",
            elevated: "#FFFFFF",
            inset: "#EDE5D6",
            strong: "#E2D8C8",
            accentSoft: "#FDF0DE",
          },
          text: {
            primary: "#2E1F0A",
            secondary: "#6B4E2A",
            tertiary: "#9C7A52",
            muted: "#BDA882",
            inverse: "#FFFFFF",
            disabled: "#9C7A52",
          },
          border: {
            subtle: "#E2D8C8",
            default: "#CDBFA8",
            strong: "#B8A48A",
            accent: "#D9A86A",
            focus: "#B8620A",
          },
          action: {
            hover: "rgba(184, 98, 10, 0.06)",
            selected: "rgba(184, 98, 10, 0.12)",
            disabled: "rgba(46, 31, 10, 0.38)",
            disabledBackground: "rgba(46, 31, 10, 0.08)",
            focusRing: "#B8620A",
          },
          feedback: {
            success: {
              main: "#4E7D5B",
              light: "#709A7A",
              dark: "#2E5C10",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#A64444",
              light: "#BC6666",
              dark: "#782F2F",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#B8620A",
              light: "#D97A1A",
              dark: "#7A3E05",
              contrastText: "#FFFFFF",
            },
            info: {
              main: "#5A7381",
              light: "#8095A1",
              dark: "#3E5561",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
    },
  },

  // ─── Leather ────────────────────────────────────────────────────────────────
  {
    id: "leather",
    label: "Leather",
    previewColor: "#8B4513",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: "#8B4513",
            primaryLight: "#A0522D",
            primaryDark: "#5C2E0A",
            secondary: "#4C6573",
          },
          background: {
            default: "#F7F0E8",
            subtle: "#EFE5D5",
            paper: "#FBF8F3",
            elevated: "#FFFFFF",
            inset: "#E5D8C5",
          },
          surface: {
            default: "#FBF8F3",
            subtle: "#EFE5D5",
            elevated: "#FFFFFF",
            inset: "#E5D8C5",
            strong: "#D9CAAE",
            accentSoft: "#F5E8D5",
          },
          text: {
            primary: "#2A1A08",
            secondary: "#5C3A1E",
            tertiary: "#8B6440",
            muted: "#B89A72",
            inverse: "#FFFFFF",
            disabled: "#8B6440",
          },
          border: {
            subtle: "#D9CAAE",
            default: "#C8B494",
            strong: "#B89A72",
            accent: "#C8922A",
            focus: "#8B4513",
          },
          action: {
            hover: "rgba(139, 69, 19, 0.06)",
            selected: "rgba(139, 69, 19, 0.12)",
            disabled: "rgba(42, 26, 8, 0.38)",
            disabledBackground: "rgba(42, 26, 8, 0.08)",
            focusRing: "#8B4513",
          },
          feedback: {
            success: {
              main: "#4E7D5B",
              light: "#709A7A",
              dark: "#2E5C10",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#A64444",
              light: "#BC6666",
              dark: "#782F2F",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#C8922A",
              light: "#D9A84A",
              dark: "#A07018",
              contrastText: "#FFFFFF",
            },
            info: {
              main: "#4C6573",
              light: "#6B7785",
              dark: "#31434D",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
    },
  },

  // ─── Blacktop ───────────────────────────────────────────────────────────────
  {
    id: "blacktop",
    label: "Blacktop",
    previewColor: "#FF6B2B",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: "#FF6B2B",
            primaryLight: "#FF8F5A",
            primaryDark: "#CC4A10",
            secondary: "#5591C7",
          },
          background: {
            default: "#111111",
            subtle: "#161616",
            paper: "#181818",
            elevated: "#1F1F1F",
            inset: "#0A0A0A",
          },
          surface: {
            default: "#181818",
            subtle: "#1C1C1C",
            elevated: "#222222",
            inset: "#0D0D0D",
            strong: "#2A2A2A",
            accentSoft: "#1F1410",
          },
          text: {
            primary: "#F2F2F2",
            secondary: "#A0A0A0",
            tertiary: "#666666",
            muted: "#404040",
            inverse: "#111111",
            disabled: "#666666",
          },
          border: {
            subtle: "#242424",
            default: "#2E2E2E",
            strong: "#3A3A3A",
            accent: "#4A2A18",
            focus: "#FF6B2B",
          },
          action: {
            hover: "rgba(255, 107, 43, 0.08)",
            selected: "rgba(255, 107, 43, 0.18)",
            disabled: "rgba(242, 242, 242, 0.38)",
            disabledBackground: "rgba(242, 242, 242, 0.08)",
            focusRing: "#FF6B2B",
          },
          feedback: {
            success: {
              main: "#6DAA45",
              light: "#8DC46A",
              dark: "#4D8F25",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#DD6974",
              light: "#E88E97",
              dark: "#C24A59",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#FF6B2B",
              light: "#FF8F5A",
              dark: "#CC4A10",
              contrastText: "#111111",
            },
            info: {
              main: "#5591C7",
              light: "#78AAD6",
              dark: "#3B78AB",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
    },
  },
];

export const DEFAULT_PRESET_ID = "classic";

export default PRESETS;
