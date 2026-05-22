import { palettes } from "./palette";
import { spacing } from "./spacing";
import { typographyPrimitives } from "./typography";
import { breakpoints } from "./breakpoints";
import { elevationPrimitives } from "./elevation";

/**
 * Base dark mode semantic colors.
 * These roles provide a first-class dark theme foundation.
 */
export const darkSemanticColors = {
  background: {
    default: "#0E141B",
    subtle: "#121A24",
    paper: "#16202B",
    elevated: "#1C2834",
    inset: "#0A1016",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
  surface: {
    default: "#16202B",
    subtle: "#1B2531",
    elevated: "#22303D",
    inset: "#0A1016",
    strong: "#2C3A4A",
    accentSoft: "rgba(40, 112, 148, 0.15)",
    accentMuted: "rgba(40, 112, 148, 0.12)",
  },
  text: {
    primary: "#F2F6FA",
    secondary: "#C4D0DA",
    tertiary: "#9EAFBD",
    muted: "#7E91A2",
    inverse: "#0E141B",
    disabled: "rgba(242, 246, 250, 0.40)",
    placeholder: "#8EA0AF",
  },
  border: {
    subtle: "#2A3847",
    default: "#364A5E",
    strong: "#486177",
    accent: "rgba(40, 112, 148, 0.4)",
    focus: palettes.blue[400],
  },
  action: {
    hover: "rgba(242, 246, 250, 0.08)",
    active: "rgba(242, 246, 250, 0.12)",
    selected: "rgba(242, 246, 250, 0.16)",
    disabled: "rgba(242, 246, 250, 0.38)",
    disabledBackground: "rgba(242, 246, 250, 0.08)",
    focusRing: palettes.blue[400],
  },
} as const;

export const tokens = {
  palette: palettes,
  spacing: spacing,
  typography: typographyPrimitives,
  breakpoints: breakpoints,
  elevation: elevationPrimitives,

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
        tertiary: {
          main: palettes.warmGray[500],
          light: palettes.warmGray[300],
          dark: palettes.warmGray[700],
          contrastText: palettes.blue[900],
        },
      },
      background: {
        default: "#F1F3F5",
        subtle: "#EAEDF0",
        paper: "#F8F9FB",
        elevated: "#FFFFFF",
        inset: "#E4E8EC",
        overlay: "rgba(15, 23, 42, 0.6)",
      },
      surface: {
        default: "#F8F9FB",
        subtle: "#F2F5F8",
        elevated: "#FFFFFF",
        inset: "#E4E8EC",
        strong: "#D9E0E7",
        accentSoft: palettes.blue[50],
        accentMuted: "rgba(40, 112, 148, 0.12)",
        moleskine: "#FFFDF5",
        onCourt: "rgba(40, 112, 148, 0.08)",
      },
      text: {
        primary: "#1A2530",
        secondary: "#5A6876",
        tertiary: "#748391",
        muted: "#8A96A2",
        disabled: "rgba(26, 37, 48, 0.38)",
        inverse: "#FFFFFF",
        placeholder: "#97A2AD",
      },
      border: {
        subtle: "#D3DAE2",
        default: "#C3CCD6",
        strong: "#AEB9C5",
        accent: palettes.blue[200],
        focus: palettes.blue[500],
      },
      action: {
        hover: "rgba(2, 50, 70, 0.04)",
        active: "rgba(2, 50, 70, 0.08)",
        selected: "rgba(40, 112, 148, 0.10)",
        disabled: "rgba(31, 41, 51, 0.38)",
        disabledBackground: "rgba(31, 41, 51, 0.08)",
        focusRing: palettes.blue[500],
      },
      feedback: {
        success: {
          main: palettes.successScale[500],
          light: palettes.successScale[100],
          dark: palettes.successScale[700],
          contrastText: "#FFFFFF",
        },
        error: {
          main: palettes.errorScale[500],
          light: palettes.errorScale[100],
          dark: palettes.errorScale[700],
          contrastText: "#FFFFFF",
        },
        warning: {
          main: palettes.warningScale[500],
          light: palettes.warningScale[100],
          dark: palettes.warningScale[700],
          contrastText: palettes.blue[900],
        },
        info: {
          main: palettes.blue[500],
          light: palettes.blue[100],
          dark: palettes.blue[700],
          contrastText: "#FFFFFF",
        },
      },
      scrollbar: {
        thumb: palettes.neutral[400],
        track: "transparent",
        hover: palettes.neutral[500],
      },
    },

    typography: {
      h1: {
        fontFamily: typographyPrimitives.fontFamily.display,
        fontSize: typographyPrimitives.fontSize["4xl"],
        fontWeight: typographyPrimitives.fontWeight.bold,
        lineHeight: typographyPrimitives.lineHeight.tight,
        letterSpacing: typographyPrimitives.letterSpacing.tighter,
      },
      h2: {
        fontFamily: typographyPrimitives.fontFamily.display,
        fontSize: typographyPrimitives.fontSize["3xl"],
        fontWeight: typographyPrimitives.fontWeight.bold,
        lineHeight: typographyPrimitives.lineHeight.tight,
        letterSpacing: typographyPrimitives.letterSpacing.tight,
      },
      h3: {
        fontFamily: typographyPrimitives.fontFamily.display,
        fontSize: typographyPrimitives.fontSize["2xl"],
        fontWeight: typographyPrimitives.fontWeight.semibold,
        lineHeight: typographyPrimitives.lineHeight.snug,
        letterSpacing: typographyPrimitives.letterSpacing.tight,
      },
      h4: {
        fontFamily: typographyPrimitives.fontFamily.display,
        fontSize: typographyPrimitives.fontSize.xl,
        fontWeight: typographyPrimitives.fontWeight.semibold,
        lineHeight: typographyPrimitives.lineHeight.snug,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      h5: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.lg,
        fontWeight: typographyPrimitives.fontWeight.semibold,
        lineHeight: typographyPrimitives.lineHeight.snug,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      h6: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.md,
        fontWeight: typographyPrimitives.fontWeight.semibold,
        lineHeight: typographyPrimitives.lineHeight.normal,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      body1: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.md,
        fontWeight: typographyPrimitives.fontWeight.regular,
        lineHeight: typographyPrimitives.lineHeight.relaxed,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      body2: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.sm,
        fontWeight: typographyPrimitives.fontWeight.regular,
        lineHeight: typographyPrimitives.lineHeight.normal,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      supporting: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.sm,
        fontWeight: typographyPrimitives.fontWeight.regular,
        lineHeight: 1.6,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
      },
      caption: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.xs,
        fontWeight: typographyPrimitives.fontWeight.medium,
        lineHeight: 1.4,
        letterSpacing: typographyPrimitives.letterSpacing.wide,
      },
      overline: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.xs,
        fontWeight: typographyPrimitives.fontWeight.bold,
        lineHeight: 1.2,
        letterSpacing: typographyPrimitives.letterSpacing.wider,
        textTransform: "uppercase" as const,
      },
      label: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.xs,
        fontWeight: typographyPrimitives.fontWeight.medium,
        lineHeight: 1.2,
        letterSpacing: typographyPrimitives.letterSpacing.wider,
      },
      code: {
        fontFamily: typographyPrimitives.fontFamily.mono,
        fontSize: typographyPrimitives.fontSize.sm,
        fontWeight: typographyPrimitives.fontWeight.regular,
        lineHeight: typographyPrimitives.lineHeight.normal,
        letterSpacing: "0",
      },
      button: {
        fontFamily: typographyPrimitives.fontFamily.body,
        fontSize: typographyPrimitives.fontSize.sm,
        fontWeight: typographyPrimitives.fontWeight.medium,
        lineHeight: 1.2,
        letterSpacing: typographyPrimitives.letterSpacing.normal,
        textTransform: "none" as const,
      },
    },

    spacing: {
      xs: spacing[2],
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
      xl: spacing[8],
      "2xl": spacing[12],

      dialogPadding: spacing[6],
      sectionCardPadding: spacing[6],
      pagePaddingX: spacing[6],
      pagePaddingY: spacing[6],
      inputHeightMd: spacing[10],
      appBarHeight: spacing[16],
    },

    focus: {
      width: "2px",
      offset: "2px",
    },

    shape: {
      radius: {
        none: 0,
        xs: 4,
        sm: 6,
        md: 8,
        lg: 12,
        xl: 16,
        "2xl": 20,
        full: 9999,
      },
    },

    elevation: {
      shadow: {
        card: elevationPrimitives.shadows[1],
        dialog: elevationPrimitives.shadows[3],
        tooltip: elevationPrimitives.shadows[1],
        dropdown: elevationPrimitives.shadows[2],
      },
      zIndex: elevationPrimitives.zIndex,
    },

    component: {
      scoreboard: {
        background: "linear-gradient(180deg, #1E1E1E 0%, #0A0A0A 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        shadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
      },
      pageShell: {
        radius: 20,
        border: "1px solid var(--cs-semantic-color-border-subtle)",
        shadow: "none",
        background: "var(--cs-semantic-color-background-paper)",
      },
      sectionCard: {
        radius: 12,
        border: "1px solid var(--cs-semantic-color-border-subtle)",
        shadow: "none",
        background: "var(--cs-semantic-color-background-paper)",
      },
      navItem: {
        minHeight: 50,
        radius: 12,
        paddingX: 14,
        iconMinWidth: 38,
        textSize: typographyPrimitives.fontSize.md,
        textWeight: typographyPrimitives.fontWeight.medium,
        activeTextWeight: typographyPrimitives.fontWeight.semibold,
        activeBackground: "var(--cs-semantic-color-action-selected)",
        hoverBackground: "var(--cs-semantic-color-action-hover)",
        settingsBackground: "var(--cs-semantic-color-surface-accentMuted)",
        settingsHoverBackground: "var(--cs-semantic-color-action-selected)",
        settingsActiveOutline:
          "1px solid var(--cs-semantic-color-border-accent)",
      },
      radius: {
        button: 8,
        input: 8,
        chip: 9999,
        dialog: 16,
      },
    },
  },

  settings: {
    selectionCard: {
      radius: 10,
      previewRadius: 6,
      borderWidth: 1,
      selectedBorderWidth: 2,
      padding: 10,
      titleGap: 4,
      checkSize: 18,
      checkOffset: 10,
    },
    control: {
      colorSwatchSize: 22,
      inputWidth: 120,
      selectWidth: 260,
    },
  },

  motion: {
    duration: {
      fast: "120ms",
      normal: "180ms",
      slow: "240ms",
    },
    easing: {
      productive: "cubic-bezier(0.2, 0, 0, 1)",
    },
    scale: {
      iconHover: 1.04,
      press: 0.98,
    },
  },

  layout: {
    appFrame: {
      gutter: 16,
      sidebarWidth: 220,
      background: "var(--cs-semantic-color-background-default)",
      contentMinWidth: 0,
    },
    sideNav: {
      width: 220,
      paddingX: 16,
      logoPaddingTop: 24,
      logoPaddingBottom: 14,
      searchPaddingBottom: 20,
      searchHeight: 44,
      searchRadius: 10,
      searchPaddingX: 14,
      navListPaddingX: 10,
      navItemGap: 6,
      sectionGapTop: 18,
      bottomPaddingTop: 18,
      bottomPaddingBottom: 12,
      bottomGroupGap: 10,
      coachCardPaddingX: 12,
      coachCardPaddingY: 11,
      coachAvatarSize: 34,
      dividerOpacity: 0.55,
    },
    pageSurface: {
      radius: 20,
      background: "var(--cs-semantic-color-background-paper)",
      border: "1px solid var(--cs-semantic-color-border-subtle)",
      dividerColor: "var(--cs-semantic-color-border-subtle)",
      headerPaddingX: 24,
      headerPaddingTop: 24,
      contentPaddingX: 24,
      contentPaddingBottom: 24,
      shadow: "none",
      variants: {
        default: {
          maxWidth: 1280,
        },
        narrow: {
          maxWidth: 900,
        },
      },
    },
    pageTabs: {
      height: 40,
      radius: 8,
      gap: 8,
      paddingX: 12,
      activeBackground: "var(--cs-semantic-color-surface-subtle)",
      activeColor: "var(--cs-semantic-color-text-primary)",
      inactiveColor: "var(--cs-semantic-color-text-secondary)",
      hoverBackground: "var(--cs-semantic-color-action-hover)",
    },
    formRow: {
      minHeight: 80,
      paddingY: 20,
      gap: 24,
      labelWidth: 260,
      descriptionMaxWidth: 240,
      dividerColor: "var(--cs-semantic-color-border-subtle)",
    },
    sectionIntro: {
      titleGap: 4,
      marginBottom: 20,
    },

    /** @deprecated Use semantic.spacing.inputHeightMd */
    inputHeightMd: 40,
    /** @deprecated Use semantic.spacing.dialogPadding */
    dialogPadding: 24,
    /** @deprecated Use semantic.spacing.pagePaddingX */
    pagePaddingX: 24,
    pagePanelPaddingMobile: 20,
    pageMaxWidth: 1280,
    sectionCardPaddingCompact: 16,
    /** @deprecated Use semantic.spacing.sectionCardPadding */
    sectionCardPadding: 24,
  },

  touch: {
    targetComfortable: 44,
    iconButtonMin: 44,
  },
} as const;

export type AppTokens = typeof tokens;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
  ? DeepPartial<T[K]>
  : T[K] extends number
  ? number
  : T[K] extends string
  ? string
  : T[K] extends boolean
  ? boolean
  : T[K];
};

export interface ThemePreset {
  id: string;
  label: string;
  previewColor: string;
  mode: "light" | "dark";
  overrides?: DeepPartial<AppTokens>;
}