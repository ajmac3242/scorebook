import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  assertAccessible,
} from "../test-utils";
import Opponents from "./Opponents";
import { mockDb } from "../dbMock";
import { syncService } from "../utils/syncService";

// Mock sync service
vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

const renderComponent = () => render(<Opponents />);

describe("Opponents Page", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("renders 'No opponents' state when empty", async () => {
    const { container } = renderComponent();
    await assertAccessible(container);

    await waitFor(() => {
      expect(screen.getByText(/No active opponents/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Add first opponent/i }),
    ).toBeInTheDocument();
  });

  it("renders a list of opponents", async () => {
    mockDb.opponents.data = [
      {
        id: "1",
        name: "Lakers",
        logoUrl: "",
        roster: [{}, {}, {}],
        synced: 1,
        isArchived: 0,
      },
      {
        id: "2",
        name: "Celtics",
        logoUrl: "",
        roster: [],
        synced: 1,
        isArchived: 0,
      },
    ];
    mockDb.notify();

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Lakers")).toBeInTheDocument();
      expect(screen.getByText("Celtics")).toBeInTheDocument();
    });

    expect(screen.getByText("3 players identified")).toBeInTheDocument();
  });

  it("opens add dialog and adds a new opponent", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Open dialog
    await user.click(screen.getByRole("button", { name: /Add Opponent/i }));
    expect(screen.getByText("Add New Opponent")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/Opponent Name/i), "Warriors");
    await user.type(screen.getByLabelText(/Logo URL/i), "http://logo.png");

    // Submit
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      const warriors = mockDb.opponents.data.find((o) => o.name === "Warriors");
      expect(warriors).toBeDefined();
      expect(warriors?.logoUrl).toBe("http://logo.png");
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("opens delete confirmation and deletes an archived opponent", async () => {
    const user = userEvent.setup();
    mockDb.opponents.data = [
      { id: "1", name: "Lakers", roster: [], isArchived: 1, synced: 1 },
    ];
    mockDb.notify();

    renderComponent();

    await user.click(screen.getByRole("tab", { name: /Archived/i }));

    await waitFor(() => screen.getByText("Lakers"));

    await user.click(screen.getByLabelText(/Delete opponent Lakers/i));

    expect(
      screen.getByText(/Are you sure you want to delete/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Opponent" }));

    await waitFor(() => {
      expect(mockDb.opponents.data).toHaveLength(0);
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("archives an active opponent", async () => {
    const user = userEvent.setup();
    mockDb.opponents.data = [
      { id: "1", name: "Lakers", roster: [], isArchived: 0, synced: 1 },
    ];
    mockDb.notify();

    renderComponent();

    await waitFor(() => screen.getByText("Lakers"));

    await user.click(screen.getByLabelText(/Archive opponent Lakers/i));

    await user.click(screen.getByRole("button", { name: "Archive Opponent" }));

    await waitFor(() => {
      expect(mockDb.opponents.data[0].isArchived).toBe(1);
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("restores an archived opponent", async () => {
    const user = userEvent.setup();
    mockDb.opponents.data = [
      { id: "1", name: "Lakers", roster: [], isArchived: 1, synced: 1 },
    ];
    mockDb.notify();

    renderComponent();

    await user.click(screen.getByRole("tab", { name: /Archived/i }));

    await waitFor(() => screen.getByText("Lakers"));

    // Click on the card to restore (as per component logic)
    await user.click(screen.getByText("Lakers"));

    await user.click(screen.getByRole("button", { name: "Restore Opponent" }));

    await waitFor(() => {
      expect(mockDb.opponents.data[0].isArchived).toBe(0);
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });
});
