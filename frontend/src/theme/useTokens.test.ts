import { renderHook } from "../test-utils";
import { useTokens } from "./useTokens";
import { CourtSightThemeProvider } from "./ThemeContext";
import { describe, it, expect } from "vitest";

describe("useTokens", () => {
  it("returns app tokens from theme context", () => {
    const { result } = renderHook(() => useTokens(), {
      wrapper: CourtSightThemeProvider,
    });
    expect(result.current).toBeDefined();
    expect(result.current.semantic).toBeDefined();
    expect(result.current.semantic.spacing.md).toBeDefined();
  });
});
