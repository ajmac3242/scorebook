import type { ThemePreset } from "./tokens/tokens";
import { palettes } from "./tokens/palette";

export const PRESETS: ThemePreset[] = [
  // ─── CourtSight Classic ──────────────────────────────────────────────────────
  {
    id: "classic",
    label: "CourtSight Classic",
    previewColor: "#00BCD4",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#00BCD4",
              light: "#4DD0E1",
              dark: "#00838F",
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
            default: "#0D1117",
            subtle: "#161B22",
            paper: "#161B22",
            elevated: "#1C2128",
            inset: "#090D12",
          },
          surface: {
            default: "#161B22",
            subtle: "#1C2128",
            elevated: "#1C2128",
            inset: "#090D12",
            strong: "#21262D",
            accentSoft: "#0D2026",
          },
          text: {
            primary: "#E6EDF3",
            secondary: "#8B949E",
            tertiary: "#6E7681",
            muted: "#484F58",
            inverse: "#0D1117",
            disabled: "#6E7681",
          },
          border: {
            subtle: "#21262D",
            default: "#30363D",
            strong: "#3D444D",
            accent: "#0D3040",
            focus: "#00BCD4",
          },
          action: {
            hover: "rgba(0, 188, 212, 0.08)",
            active: "rgba(0, 188, 212, 0.12)",
            selected: "rgba(0, 188, 212, 0.16)",
            disabled: "rgba(230, 237, 243, 0.38)",
            disabledBackground: "rgba(230, 237, 243, 0.08)",
            focusRing: "#00BCD4",
          },
        },
      },
    },
  },

  // ─── Gametime ────────────────────────────────────────────────────────────────
  {
    id: "gametime",
    label: "Gametime",
    previewColor: palettes.blue[500],
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: palettes.blue[500],
              light: palettes.blue[400],
              dark: palettes.blue[700],
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

  // ─── Hardwood ────────────────────────────────────────────────────────────────
  {
    id: "hardwood",
    label: "Hardwood",
    previewColor: "#B8860B",
    mode: "light",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#B8860B",
              light: "#D4A017",
              dark: "#7A5700",
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
            focus: "#B8860B",
          },
          action: {
            hover: "rgba(184, 134, 11, 0.06)",
            active: "rgba(184, 134, 11, 0.10)",
            selected: "rgba(184, 134, 11, 0.12)",
            disabled: "rgba(46, 31, 10, 0.38)",
            disabledBackground: "rgba(46, 31, 10, 0.08)",
            focusRing: "#B8860B",
          },
        },
      },
    },
  },

  // ─── Leather ─────────────────────────────────────────────────────────────────
  {
    id: "leather",
    label: "Leather",
    previewColor: "#C0391A",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#C0391A",
              light: "#E04D28",
              dark: "#8B2500",
              contrastText: "#FFFFFF",
            },
            secondary: {
              main: palettes.warmGray[500],
              light: palettes.warmGray[300],
              dark: palettes.warmGray[700],
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#130A04",
            subtle: "#1C100A",
            paper: "#1C100A",
            elevated: "#261510",
            inset: "#0D0603",
          },
          surface: {
            default: "#1C100A",
            subtle: "#221408",
            elevated: "#261510",
            inset: "#0D0603",
            strong: "#2E1C0E",
            accentSoft: "#2A0E06",
          },
          text: {
            primary: "#EDE0D4",
            secondary: "#A89080",
            tertiary: "#6E5248",
            muted: "#4E3830",
            inverse: "#130A04",
            disabled: "#6E5248",
          },
          border: {
            subtle: "#2E1C0E",
            default: "#3D2618",
            strong: "#4F3425",
            accent: "#6B2C14",
            focus: "#C0391A",
          },
          action: {
            hover: "rgba(192, 57, 26, 0.08)",
            active: "rgba(192, 57, 26, 0.12)",
            selected: "rgba(192, 57, 26, 0.16)",
            disabled: "rgba(237, 224, 212, 0.38)",
            disabledBackground: "rgba(237, 224, 212, 0.08)",
            focusRing: "#C0391A",
          },
        },
      },
    },
  },

  // ─── Blacktop ────────────────────────────────────────────────────────────────
  {
    id: "blacktop",
    label: "Blacktop",
    previewColor: "#E87D0D",
    mode: "dark",
    overrides: {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#E87D0D",
              light: "#F5A03A",
              dark: "#B05A00",
              contrastText: "#0A0A0A",
            },
            secondary: {
              main: palettes.slate[500],
              light: palettes.slate[300],
              dark: palettes.slate[700],
              contrastText: "#FFFFFF",
            },
          },
          background: {
            default: "#0A0A0A",
            subtle: "#111111",
            paper: "#111111",
            elevated: "#1A1A1A",
            inset: "#060606",
          },
          surface: {
            default: "#111111",
            subtle: "#171717",
            elevated: "#1A1A1A",
            inset: "#060606",
            strong: "#222222",
            accentSoft: "#1A1000",
          },
          text: {
            primary: "#F0F0F0",
            secondary: "#A0A0A0",
            tertiary: "#6A6A6A",
            muted: "#444444",
            inverse: "#0A0A0A",
            disabled: "#6A6A6A",
          },
          border: {
            subtle: "#1E1E1E",
            default: "#2A2A2A",
            strong: "#3A3A3A",
            accent: "#3D2800",
            focus: "#E87D0D",
          },
          action: {
            hover: "rgba(232, 125, 13, 0.08)",
            active: "rgba(232, 125, 13, 0.12)",
            selected: "rgba(232, 125, 13, 0.16)",
            disabled: "rgba(240, 240, 240, 0.38)",
            disabledBackground: "rgba(240, 240, 240, 0.08)",
            focusRing: "#E87D0D",
          },
        },
      },
    },
  },
];

export const DEFAULT_PRESET_ID = "gametime";

export default PRESETS;
