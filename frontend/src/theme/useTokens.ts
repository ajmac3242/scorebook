import { useAppTheme } from "./ThemeContext";
import type { AppTokens } from "./tokens/tokens";

/**
 * Returns the fully resolved app token tree from CourtSightThemeProvider.
 * Use this hook for custom design tokens instead of reading theme.appTokens directly.
 */
export function useTokens(): AppTokens {
  return useAppTheme().theme.appTokens;
}

export default useTokens;
