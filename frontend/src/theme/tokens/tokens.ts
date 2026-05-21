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
        default: "#0E1117",
        subtle: "#13181F",
        paper: "#13181F",
        elevated: "#1A2028",
        inset: "#0A0D12",
        overlay: "rgba(0, 0, 0, 0.7)",
    },
    surface: {
        default: "#13181F",
        subtle: "#171D26",
        elevated: "#1A2028",
        inset: "#0A0D12",
        strong: "#242C38",
        accentSoft: "rgba(40, 112, 148, 0.15)",
    },
    text: {
        primary: "#F0EDE8",
        secondary: "#A8A49E",
        tertiary: "#6E6B66",
        muted: "#4E4B48",
        inverse: "#0E1117",
        disabled: "rgba(240, 237, 232, 0.38)",
        placeholder: "#4E4B48",
    },
    border: {
        subtle: "#232931",
        default: "#2C3340",
        strong: "#3A4454",
        accent: "rgba(40, 112, 148, 0.4)",
        focus: palettes.blue[400],
    },
    action: {
        hover: "rgba(240, 237, 232, 0.08)",
        active: "rgba(240, 237, 232, 0.12)",
        selected: "rgba(240, 237, 232, 0.16)",
        disabled: "rgba(240, 237, 232, 0.38)",
        disabledBackground: "rgba(240, 237, 232, 0.08)",
        focusRing: palettes.blue[400],
    },
} as const;

export const tokens = {
    // Primitives re-exported/composed
    palette: palettes,
    spacing: spacing,
    typography: typographyPrimitives,
    breakpoints: breakpoints,
    elevation: elevationPrimitives,

    // Semantic Tokens
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
                default: palettes.warmGray[100],
                subtle: palettes.neutral[200],
                paper: palettes.neutral[50],
                elevated: "#FFFFFF",
                inset: palettes.warmGray[200],
                overlay: "rgba(15, 23, 42, 0.6)", // Scrim for modals/drawers
            },
            surface: {
                default: palettes.neutral[50],
                subtle: palettes.neutral[100],
                elevated: "#FFFFFF",
                inset: palettes.warmGray[200],
                strong: palettes.warmGray[300],
                accentSoft: palettes.blue[50],
                moleskine: "#FFFDF5",
                onCourt: "rgba(40, 112, 148, 0.08)",
            },
            text: {
                primary: palettes.blue[900],
                secondary: palettes.slate[500],
                tertiary: palettes.slate[700],
                muted: palettes.warmGray[700],
                disabled: palettes.neutral[600],
                inverse: "#FFFFFF",
                placeholder: palettes.neutral[500],
            },
            border: {
                subtle: palettes.neutral[300],
                default: palettes.neutral[400],
                strong: palettes.warmGray[500],
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

            // Component Spacing Tokens
            dialogPadding: spacing[6], // 24px
            sectionCardPadding: spacing[6], // 24px
            pagePaddingX: spacing[6], // 24px
            pagePaddingY: spacing[6], // 24px
            inputHeightMd: spacing[10], // 40px
            appBarHeight: spacing[16], // 64px
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
                radius: 12,
                border: `1px solid var(--cs-semantic-color-border-subtle)`,
                shadow: elevationPrimitives.shadows[1],
                background: `var(--cs-semantic-color-background-paper)`,
            },
            sectionCard: {
                radius: 12,
                border: `1px solid var(--cs-semantic-color-border-subtle)`,
                shadow: "none",
                background: `var(--cs-semantic-color-background-paper)`,
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
        shell: {
            maxWidth: 900,
            radius: 12,
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            background: "var(--cs-semantic-color-background-elevated)",
            headerPaddingX: 28,
            headerPaddingTop: 24,
            contentPaddingX: 28,
            contentPaddingBottom: 28,
        },
        tabs: {
            height: 40,
            radius: 8,
            gap: 8,
            paddingX: 12,
            activeBackground: "var(--cs-semantic-color-surface-subtle)",
            activeColor: "var(--cs-semantic-color-text-primary)",
            inactiveColor: "var(--cs-semantic-color-text-secondary)",
            hoverBackground: "var(--cs-semantic-color-action-hover)",
        },
        section: {
            titleGap: 4,
            introMarginBottom: 20,
        },
        row: {
            minHeight: 80,
            paddingY: 20,
            labelWidth: 260,
            gap: 24,
            dividerColor: "var(--cs-semantic-color-border-subtle)",
            descriptionMaxWidth: 240,
        },
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

    // Motion tokens
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

    /** @deprecated Use semantic.spacing.inputHeightMd */
    layout: {
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