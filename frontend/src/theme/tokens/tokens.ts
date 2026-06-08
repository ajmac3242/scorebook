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
  spacing,
  typography: typographyPrimitives,
  breakpoints,
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
        default: "#EEF1F4",
        subtle: "#E7EBF0",
        paper: "#FAFBFC",
        elevated: "#FFFFFF",
        inset: "#E3E8EE",
        overlay: "rgba(15, 23, 42, 0.6)",
      },
      surface: {
        default: "#FAFBFC",
        subtle: "#F4F7FA",
        elevated: "#FFFFFF",
        inset: "#E3E8EE",
        strong: "#D7DEE7",
        accentSoft: "rgba(46, 120, 166, 0.08)",
        accentMuted: "rgba(46, 120, 166, 0.10)",
        moleskine: "#FFFDF5",
        onCourt: "rgba(46, 120, 166, 0.08)",
      },
      text: {
        primary: "#163042",
        secondary: "#486173",
        tertiary: "#667C8C",
        muted: "#7E909E",
        disabled: "rgba(22, 48, 66, 0.38)",
        inverse: "#FFFFFF",
        placeholder: "#8A99A6",
      },
      border: {
        subtle: "#D8DEE6",
        default: "#C8D0DA",
        strong: "#B2BDC9",
        accent: "#B7D1E3",
        focus: palettes.blue[500],
      },
      action: {
        hover: "rgba(46, 120, 166, 0.04)",
        active: "rgba(46, 120, 166, 0.08)",
        selected: "rgba(46, 120, 166, 0.10)",
        disabled: "rgba(31, 41, 51, 0.38)",
        disabledBackground: "rgba(31, 41, 51, 0.08)",
        focusRing: palettes.blue[500],
      },
      emphasis: {
        clutch: "#FF4500", // High-intensity orange-red for clutch moments
        momentum: palettes.blue[400],
        trendUp: palettes.successScale[500],
        trendDown: palettes.errorScale[500],
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
        xs: "0 1px 2px rgba(0,0,0,0.02)",
        insetSubtle: "inset 0 0 0 1px rgba(0,0,0,0.05)",
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
        border: "none",
        shadow: "none",
        background: "var(--cs-semantic-color-background-default)",
      },
      sectionCard: {
        radius: 0,
        border: "none",
        shadow: "none",
        background: "transparent",
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
        settingsBackground: "var(--cs-semantic-color-surface-accentSoft)",
        settingsHoverBackground: "var(--cs-semantic-color-action-selected)",
        settingsActiveOutline: "none",
      },
      entityCard: {
        accentStripHeight: 6, // px — top identity bar on entity cards
      },
      iconSize: {
        sm: 20, // inline icons and icon buttons
        md: 24, // standard standalone icons
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
      sidebarWidth: 236,
      background: "var(--cs-semantic-color-background-paper)",
      contentMinWidth: 0,
    },
    sideNav: {
      width: 236,
      paddingX: 20,
      logoPaddingTop: 28,
      logoPaddingBottom: 18,
      searchPaddingBottom: 24,
      searchHeight: 40,
      searchRadius: 10,
      searchPaddingX: 14,
      navListPaddingX: 0,
      navItemGap: 10,
      sectionGapTop: 24,
      bottomPaddingTop: 24,
      bottomPaddingBottom: 16,
      bottomGroupGap: 12,
      coachCardPaddingX: 14,
      coachCardPaddingY: 14,
      coachAvatarSize: 34,
      dividerOpacity: 0.55,
    },
    pageSurface: {
      maxWidth: "none",
      radius: 20,
      background: "var(--cs-semantic-color-background-default)",
      border: "none",
      dividerColor: "var(--cs-semantic-color-border-subtle)",
      headerPaddingX: 32,
      headerPaddingTop: 16,
      contentPaddingX: 32,
      contentPaddingBottom: 32,
      controlsBackground: "var(--cs-semantic-color-background-subtle)",
      controlsPaddingY: 14,
      controlsDividerColor: "var(--cs-semantic-color-border-subtle)",
      shadow: "none",
    },
    pageTabs: {
      height: 40,
      radius: 0,
      gap: 20,
      paddingX: 4,
      activeBackground: "transparent",
      activeColor: "var(--cs-semantic-color-text-primary)",
      inactiveColor: "var(--cs-semantic-color-text-secondary)",
      hoverBackground: "transparent",
    },
    formRow: {
      minHeight: 88,
      paddingY: 24,
      gap: 28,
      labelWidth: 260,
      descriptionMaxWidth: 240,
      dividerColor: "var(--cs-semantic-color-border-subtle)",
    },
    sectionIntro: {
      titleGap: 6,
      marginBottom: 28,
    },

    inputHeightMd: 40,
    dialogPadding: 24,
    pagePaddingX: 24,
    pagePanelPaddingMobile: 20,
    pageMaxWidth: 1280,
    sectionCardPaddingCompact: 16,
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
