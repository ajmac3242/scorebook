import type { AppTokens } from "./tokens/tokens";

declare module "@mui/material/styles" {
  interface Theme {
    appTokens: AppTokens;
  }

  interface ThemeOptions {
    appTokens?: AppTokens;
  }
}
