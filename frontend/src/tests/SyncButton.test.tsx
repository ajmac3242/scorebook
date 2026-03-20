import { render, screen, fireEvent } from "@testing-library/react";
import TeamStats from "../pages/TeamStats";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { syncService } from "../utils/syncService";

vi.mock("../utils/syncService", () => ({
  syncService: {
    syncAllForTeam: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ teamId: "t1" }),
    useNavigate: () => vi.fn(),
  };
});

describe("TeamStats Sync Button", () => {
  const mockTeam = {
    id: "t1",
    name: "Team 1",
    seasonId: "s1",
    primaryColor: "#154C56",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("teams.get")) return mockTeam;
      return [];
    });
  });

  it("renders sync button and calls syncService on click", async () => {
    render(
      <BrowserRouter>
        <TeamStats />
      </BrowserRouter>,
    );

    const syncButton = screen.getByRole("button", { name: /sync/i });
    expect(syncButton).toBeInTheDocument();

    fireEvent.click(syncButton);
    expect(syncService.syncAllForTeam).toHaveBeenCalledWith("t1");
  });
});
