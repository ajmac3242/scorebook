import { describe, it, expect, beforeEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  assertAccessible,
} from "../../test-utils";
import { DefensiveSchemeSelector } from "./DefensiveSchemeSelector";
import { mockDb } from "../../dbMock";
import { syncService } from "../../utils/syncService";

// Mock sync service
vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("DefensiveSchemeSelector", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("renders with active scheme selected", async () => {
    const { container } = render(
      <DefensiveSchemeSelector
        activeScheme="ZONE"
        gameId="game-1"
        isReadOnly={false}
      />,
    );
    await assertAccessible(container);

    const zoneButton = screen.getByRole("button", { name: "ZONE" });
    expect(zoneButton).toHaveAttribute("aria-pressed", "true");
  });

  it("changes scheme and updates database", async () => {
    const user = userEvent.setup();
    mockDb.games.data = [
      { id: "game-1", activeDefensiveScheme: "MAN", synced: 1 } as any,
    ];
    mockDb.notify();

    render(
      <DefensiveSchemeSelector
        activeScheme="MAN"
        gameId="game-1"
        isReadOnly={false}
      />,
    );

    const zoneButton = screen.getByRole("button", { name: "ZONE" });
    await user.click(zoneButton);

    await waitFor(() => {
      expect(mockDb.games.data[0].activeDefensiveScheme).toBe("ZONE");
      expect(mockDb.games.data[0].synced).toBe(0);
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("is disabled when isReadOnly is true", () => {
    render(
      <DefensiveSchemeSelector
        activeScheme="MAN"
        gameId="game-1"
        isReadOnly={true}
      />,
    );

    const manButton = screen.getByRole("button", { name: "MAN" });
    expect(manButton).toBeDisabled();
  });

  it("does not update if val is null or gameId is missing", async () => {
    const user = userEvent.setup();
    render(
      <DefensiveSchemeSelector
        activeScheme="MAN"
        gameId={null}
        isReadOnly={false}
      />,
    );

    const zoneButton = screen.getByRole("button", { name: "ZONE" });
    await user.click(zoneButton);

    expect(mockDb.games.update).not.toHaveBeenCalled();
  });

  it("logs error when update fails", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDb.games.update.mockImplementationOnce(() => {
      throw new Error("Update failed");
    });

    render(
      <DefensiveSchemeSelector
        activeScheme="MAN"
        gameId="game-1"
        isReadOnly={false}
      />,
    );

    const zoneButton = screen.getByRole("button", { name: "ZONE" });
    await user.click(zoneButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
