import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTeams } from "../useTeams";
import { mockDb } from "../../dbMock";

describe("useTeams", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("returns an empty array when no teams exist", async () => {
    const { result } = renderHook(() => useTeams());
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("returns all teams", async () => {
    await act(async () => {
      await mockDb.teams.bulkPut([
        { id: "t1", name: "Team A", periodType: "QUARTERS" },
        { id: "t2", name: "Team B", periodType: "QUARTERS" },
      ]);
    });

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current.map((t) => t.id)).toContain("t1");
      expect(result.current.map((t) => t.id)).toContain("t2");
    });
  });

  it("updates reactively when a team is added", async () => {
    const { result } = renderHook(() => useTeams());
    await waitFor(() => expect(result.current).toHaveLength(0));

    await act(async () => {
      await mockDb.teams.add({ id: "t1", name: "New Team", periodType: "QUARTERS" });
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe("New Team");
    });
  });
});
