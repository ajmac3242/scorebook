/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AppTokens } from "./tokens/tokens";

declare module "@mui/material/styles" {
  interface Theme {
    appTokens: AppTokens;
    vars: ThemeVars;
  }

  interface ThemeOptions {
    appTokens?: AppTokens;
  }

  interface ThemeVars {
    cs: AppTokens; // Our namespaced variables
  }
}

export {};
