import { renderHook } from "../test-utils";
import { useTokens } from "./useTokens";
import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("./ThemeContext", () => ({
  useAppTheme: () => ({
    theme: {
      appTokens: {
        semantic: { spacing: { md: 16 } }
      }
    }
  })
}));

describe("useTokens", () => {
  it("returns app tokens from theme context", () => {
    const { result } = renderHook(() => useTokens());
    expect(result.current.semantic.spacing.md).toBe(16);
  });
});
