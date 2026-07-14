import React from "react";
import {
  renderWithProviders,
  screen,
  assertAccessible,
  waitFor,
  act,
} from "../../../test-utils";
import EditPlayerDialog from "./EditPlayerDialog";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "../../../dbMock";

describe("EditPlayerDialog", () => {
  const onClose = vi.fn();
  const player = {
    id: "p1",
    name: "LeBron James",
    avatarColor: "#ff0000",
    isStar: 1,
    isArchived: 0,
    synced: 1,
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("renders correctly when open", async () => {
    await act(async () => {
      renderWithProviders(
        <EditPlayerDialog
          open={true}
          onClose={onClose}
          player={player}
          playerId="p1"
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Edit player")).toBeInTheDocument();
      expect(screen.getByDisplayValue("LeBron James")).toBeInTheDocument();
    });
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <EditPlayerDialog
          open={true}
          onClose={onClose}
          player={player}
          playerId="p1"
        />,
      );
      container = rendered.container;
    });

    await waitFor(() => {
      expect(screen.getByText("Edit player")).toBeInTheDocument();
    });

    await assertAccessible(container!);
  });
});
