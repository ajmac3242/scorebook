import type { ThemePreset } from "./tokens/tokens";

export const PRESETS: ThemePreset[] = [
  // ─── Classic ─────────────────────────────────────────────
  // Clean, professional. The default everyday workhorse.
  // Navy + steel blue. Neutral warm surfaces. Standard spacing.
  {
    id: "classic",
    label: "Classic",
    previewColor: "#287094",
    mode: "light",
  },

  // ─── Gametime ─────────────────────────────────────────────
  // High-energy live game mode. Bold primary, rich dark surfaces,
  // high-contrast text. Dense spacing for fast interactions.
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
              main: "#6daa45",
              light: "#8dc46a",
              dark: "#4d8f25",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#dd6974",
              light: "#e88e97",
              dark: "#c24a59",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#D99E32",
              light: "#E5AF45",
              dark: "#BC8323",
              contrastText: "#0E1117",
            },
            info: {
              main: "#5591c7",
              light: "#78aad6",
              dark: "#3b78ab",
              contrastText: "#FFFFFF",
            },
          },
        },
      },
      density: {
        live: {
          controlHeight: 52,
          iconButton: 48,
          cardPadding: 16,
          gap: 12,
          gridGap: 12,
        },
      },
    },
  },

  // ─── Hardwood ─────────────────────────────────────────────
  // Warm wood tones. Amber accent. Earthy surfaces.
  // Evokes the floor of a real gym. Light mode.
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

  // ─── Leather ──────────────────────────────────────────────
  // Rich, deep-brown premium feel. Gold accent.
  // Coaches clipboard energy. Light mode.
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

  // ─── Blacktop ─────────────────────────────────────────────
  // Street ball. Dark surfaces, vivid accent. High contrast.
  // For coaches who keep score at the outdoor courts.
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
            secondary: "#5591c7",
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
              main: "#6daa45",
              light: "#8dc46a",
              dark: "#4d8f25",
              contrastText: "#FFFFFF",
            },
            error: {
              main: "#dd6974",
              light: "#e88e97",
              dark: "#c24a59",
              contrastText: "#FFFFFF",
            },
            warning: {
              main: "#FF6B2B",
              light: "#FF8F5A",
              dark: "#CC4A10",
              contrastText: "#111111",
            },
            info: {
              main: "#5591c7",
              light: "#78aad6",
              dark: "#3b78ab",
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
