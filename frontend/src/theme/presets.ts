import type { ThemePreset } from "./tokens/tokens";
import { palettes } from "./tokens/palette";

export const PRESETS: ThemePreset[] = [
  // ─── Classic ────────────────────────────────────────────────────────────────
  {
    id: "classic",
    label: "Classic",
    previewColor: palettes.blue[500],
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: palettes.blue[500],
              light: palettes.blue[400],
              dark: palettes.blue[900],
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: palettes.slate[500],
              light: palettes.slate[300],
              dark: palettes.slate[700],
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
    previewColor: palettes.warningScale[500],
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: palettes.warningScale[500],
              light: palettes.warningScale[300],
              dark: palettes.warningScale[700],
              contrastText: palettes.blue[900],
            },
            secondary: {
              main: palettes.blue[500],
              light: palettes.blue[300],
              dark: palettes.blue[700],
              contrastText: "#FFFFFF",
            },
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
            focus: palettes.warningScale[500],
          },
          action: {
            hover: "rgba(217, 158, 50, 0.08)",
            active: "rgba(217, 158, 50, 0.12)",
            selected: "rgba(217, 158, 50, 0.16)",
            disabled: "rgba(240, 237, 232, 0.38)",
            disabledBackground: "rgba(240, 237, 232, 0.08)",
            focusRing: palettes.warningScale[500],
          },
          feedback: {
            warning: {
              contrastText: "#0E1117",
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
            primary: {
              main: "#B8620A",
              light: "#D97A1A",
              dark: "#7A3E05",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: palettes.slate[500],
              light: palettes.slate[300],
              dark: palettes.slate[700],
              contrastText: "#FFFFFF",
            },
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
            active: "rgba(184, 98, 10, 0.10)",
            selected: "rgba(184, 98, 10, 0.12)",
            disabled: "rgba(46, 31, 10, 0.38)",
            disabledBackground: "rgba(46, 31, 10, 0.08)",
            focusRing: "#B8620A",
          },
        },
      },
    },
  },
];

export const DEFAULT_PRESET_ID = "classic";

export default PRESETS;
