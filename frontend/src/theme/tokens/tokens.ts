export const tokens = {
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

  typography: {
    fontFamily: {
      body: '"Inter", "Helvetica", "Arial", sans-serif',
      display: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    inlineGapTight: 4,
    inlineGap: 8,
    inputHeightMd: 40,
    dialogPadding: 24,
    pagePaddingX: 24,

    pageMaxWidth: 1280,
    pagePanelPadding: 32,
    pagePanelPaddingMobile: 20,
    pageSectionGap: 24,
    sectionCardPadding: 24,
    sectionCardPaddingCompact: 20,
    settingsRowMinHeight: 72,
    subnavHeight: 52,
  },

  componentSize: {
    modalMaxWidthTablet: 720,
    segmentedControlHeight: 40,
  },

  radii: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
    full: 999,
  },

  touch: {
    targetComfortable: 44,
    iconButtonMin: 44,
  },

  cssVars: {
    "font-body": '"Inter", "Helvetica", "Arial", sans-serif',
    "font-display": '"Inter", "Helvetica", "Arial", sans-serif',
    "radius-sm": "6px",
    "radius-md": "8px",
    "radius-lg": "12px",
    "radius-xl": "16px",
  },

  semantic: {
    color: {
      brand: {
        primary: "#2E90FA",
        primaryLight: "#53B1FD",
        primaryDark: "#1570EF",
        secondary: "#F97316",
      },
      background: {
        default: "#F9FAFB",
        paper: "#FFFFFF",
        subtle: "#F8F9FC",
      },
      surface: {
        elevated: "#FFFFFF",
        sunken: "#F3F4F6",
      },
      text: {
        primary: "#101828",
        secondary: "#667085",
        inverse: "#FFFFFF",
        disabled: "#98A2B3",
      },
      border: {
        subtle: "#EAECF0",
        default: "#D0D5DD",
        strong: "#98A2B3",
        focus: "#2E90FA",
      },
      action: {
        hover: "rgba(16, 24, 40, 0.04)",
        selected: "rgba(46, 144, 250, 0.10)",
        disabled: "#98A2B3",
        disabledBackground: "#F2F4F7",
      },
      feedback: {
        success: {
          main: "#12B76A",
          light: "#32D583",
          dark: "#039855",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#F04438",
          light: "#FDA29B",
          dark: "#D92D20",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#F79009",
          light: "#FDB022",
          dark: "#DC6803",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#2E90FA",
          light: "#53B1FD",
          dark: "#1570EF",
          contrastText: "#FFFFFF",
        },
      },
    },

    typography: {
      button: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: "0.875rem",
        fontWeight: 500,
        letterSpacing: "0",
        textTransform: "none" as const,
      },
      pageTitle: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: "1.875rem",
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      sectionTitle: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: "1.125rem",
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: "-0.01em",
      },
      supportingText: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: "0.875rem",
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: "0",
      },
      eyebrowLabel: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        fontSize: "0.875rem",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0",
      },
    },

    component: {
      radius: {
        card: 12,
        dialog: 16,
        button: 8,
        input: 8,
        chip: 999,
      },
      border: {
        card: "1px solid #EAECF0",
        divider: "1px solid #EAECF0",
      },
      shadow: {
        card: "none",
        floating: "0 16px 40px rgba(16, 24, 40, 0.08)",
        topBar: "none",
      },
      pageShell: {
        radius: 16,
        border: "1px solid #EAECF0",
        shadow: "none",
        background: "#FFFFFF",
      },
      sectionCard: {
        radius: 12,
        border: "1px solid #EAECF0",
        shadow: "none",
        background: "#FFFFFF",
      },
      subnavTab: {
        height: 52,
        radius: 0,
        indicatorHeight: 2,
      },
      selectionCard: {
        radius: 12,
        previewRadius: 8,
        borderWidth: 1,
        selectedBorderWidth: 2,
      },
    },
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
