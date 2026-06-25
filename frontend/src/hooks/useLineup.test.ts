import { renderHook, act } from "../test-utils";
import { describe, it, expect } from "vitest";
import { useLineup } from "./useLineup";

describe("useLineup hook", () => {
  it("initializes draft state with on-court players", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useLineup(onCourt));

    expect(result.current.draftOnCourtIds).toEqual(onCourt);
    expect(result.current.isLineupIllegal).toBe(false);
    expect(result.current.isDraftIllegal).toBe(false);
  });

  it("identifies illegal lineup size", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4"]);
    const { result } = renderHook(() => useLineup(onCourt));

    expect(result.current.isLineupIllegal).toBe(true);
    expect(result.current.isDraftIllegal).toBe(true);
  });

  it("handles swap logic between on-court and bench", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useLineup(onCourt));

    // Select on-court player p1
    act(() => {
      result.current.handleSwapClick("p1");
    });
    expect(result.current.selectedSwapId).toBe("p1");

    // Select bench player p6 to swap
    act(() => {
      result.current.handleSwapClick("p6");
    });

    expect(result.current.selectedSwapId).toBeNull();
    expect(result.current.draftOnCourtIds.has("p6")).toBe(true);
    expect(result.current.draftOnCourtIds.has("p1")).toBe(false);
    expect(result.current.draftOnCourtIds.size).toBe(5);
  });

  it("handles swap logic starting with bench player", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useLineup(onCourt));

    // Select bench player p6
    act(() => {
      result.current.handleSwapClick("p6");
    });
    expect(result.current.selectedSwapId).toBe("p6");

    // Select on-court player p5 to swap
    act(() => {
      result.current.handleSwapClick("p5");
    });

    expect(result.current.selectedSwapId).toBeNull();
    expect(result.current.draftOnCourtIds.has("p6")).toBe(true);
    expect(result.current.draftOnCourtIds.has("p5")).toBe(false);
  });

  it("resets selection if same player clicked twice", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useLineup(onCourt));

    act(() => {
      result.current.handleSwapClick("p1");
    });
    expect(result.current.selectedSwapId).toBe("p1");

    act(() => {
      result.current.handleSwapClick("p1");
    });
    expect(result.current.selectedSwapId).toBeNull();
  });

  it("updates selection if two players of same group (on-court) clicked", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useLineup(onCourt));

    act(() => {
      result.current.handleSwapClick("p1");
    });
    expect(result.current.selectedSwapId).toBe("p1");

    act(() => {
      result.current.handleSwapClick("p2");
    });
    expect(result.current.selectedSwapId).toBe("p2");
    expect(result.current.draftOnCourtIds).toEqual(onCourt); // No swap happened
  });

  it("handles swapping with empty slots", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4"]); // 4 players, 1 empty
    const { result } = renderHook(() => useLineup(onCourt));

    act(() => {
      result.current.handleSwapClick("EMPTY-0");
    });
    act(() => {
      result.current.handleSwapClick("p5");
    });

    expect(result.current.draftOnCourtIds.has("p5")).toBe(true);
    expect(result.current.draftOnCourtIds.size).toBe(5);
  });

  it("syncs draft with on-court IDs when dialog is closed", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result, rerender } = renderHook(
      ({ onCourt }) => useLineup(onCourt),
      {
        initialProps: { onCourt },
      },
    );

    // Change on-court externally
    const newOnCourt = new Set(["p6", "p7", "p8", "p9", "p10"]);
    rerender({ onCourt: newOnCourt });

    expect(result.current.draftOnCourtIds).toEqual(newOnCourt);
  });

  it("prevents draft sync with on-court IDs when dialog is open", () => {
    const onCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const { result, rerender } = renderHook(
      ({ onCourt }) => useLineup(onCourt),
      {
        initialProps: { onCourt },
      },
    );

    act(() => {
      result.current.setIsSubDialogOpen(true);
    });

    // External on-court update
    const newOnCourt = new Set(["p6", "p7", "p8", "p9", "p10"]);
    rerender({ onCourt: newOnCourt });

    // Draft should NOT change while user is editing
    expect(result.current.draftOnCourtIds).toEqual(onCourt);
  });
});
