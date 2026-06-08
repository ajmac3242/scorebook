import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePageSnackbar } from "./usePageSnackbar";

describe("usePageSnackbar", () => {
  it("initialises closed with a success severity", () => {
    const { result } = renderHook(() => usePageSnackbar());
    expect(result.current.snackbar).toEqual({
      open: false,
      message: "",
      severity: "success",
    });
  });

  it("shows a success snackbar by default", () => {
    const { result } = renderHook(() => usePageSnackbar());
    act(() => {
      result.current.showSnackbar("Saved successfully.");
    });
    expect(result.current.snackbar).toEqual({
      open: true,
      message: "Saved successfully.",
      severity: "success",
    });
  });

  it("supports custom severities", () => {
    const { result } = renderHook(() => usePageSnackbar());
    act(() => {
      result.current.showSnackbar("Something went wrong.", "error");
    });
    expect(result.current.snackbar.severity).toBe("error");
  });

  it("hides without clearing the message so exit animations render correctly", () => {
    const { result } = renderHook(() => usePageSnackbar());
    act(() => {
      result.current.showSnackbar("Keep this message.", "info");
    });
    act(() => {
      result.current.hideSnackbar();
    });
    expect(result.current.snackbar).toEqual({
      open: false,
      message: "Keep this message.",
      severity: "info",
    });
  });

  it("showSnackbar and hideSnackbar are stable references across re-renders", () => {
    const { result, rerender } = renderHook(() => usePageSnackbar());
    const firstShow = result.current.showSnackbar;
    const firstHide = result.current.hideSnackbar;
    rerender();
    expect(result.current.showSnackbar).toBe(firstShow);
    expect(result.current.hideSnackbar).toBe(firstHide);
  });
});
