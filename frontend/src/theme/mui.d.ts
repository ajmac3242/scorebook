/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AppTokens } from "./tokens/tokens";
import type { CSSProperties } from "react";

declare module "@mui/material/styles" {
  interface Theme {
    appTokens: AppTokens;
  }

  interface ThemeOptions {
    appTokens?: AppTokens;
  }

  interface Palette {
    tertiary: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }

  interface PaletteEmphasis {
    clutch: string;
    momentum: string;
    trendUp: string;
    trendDown: string;
  }

  interface Palette {
    emphasis: PaletteEmphasis;
    status: {
      active: string;
      inactive: string;
      starred: string;
    };
  }

  interface PaletteOptions {
    emphasis?: Partial<PaletteEmphasis>;
    status?: {
      active: string;
      inactive: string;
      starred: string;
    };
  }

  interface Typography {
    supporting: CSSProperties;
  }

  interface TypographyVariantsOptions {
    supporting?: CSSProperties;
  }

  interface ThemeVars {
    cs: AppTokens;
  }

  interface TypeText {
    tertiary: string;
    muted: string;
    inverse: string;
    placeholder: string;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    supporting: true;
  }
}

export {};
