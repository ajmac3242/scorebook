import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, assertAccessible } from "../../test-utils";
import CreateTeamWorkflow from "./CreateTeamWorkflow";
import { mockDb } from "../../dbMock";
import { syncService } from "../../utils/syncService";

vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("CreateTeamWorkflow", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("completes full multi-step workflow and creates a new team record in IndexedDB", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleCreated = vi.fn();

    const { container } = renderWithProviders(
      <CreateTeamWorkflow
        open={true}
        onClose={handleClose}
        onCreated={handleCreated}
      />,
    );

    // Step 0: Details
    expect(screen.getByText("Create team")).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Team name/i);
    await user.type(nameInput, "Tigers");
    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, "Varsity Squad");

    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 1: Identity
    const colorInput = screen.getByRole("textbox", { name: /Primary color/i });
    await user.clear(colorInput);
    await user.type(colorInput, "#123456");
    const logoInput = screen.getByLabelText(/Logo URL/i);
    await user.type(logoInput, "https://example.com/tiger.png");

    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: Rules (test stepper fields increment/decrement)
    expect(screen.getByText("Period format")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /halves format/i }));
    await user.click(
      screen.getByRole("button", { name: /increase Period duration/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /decrease Period duration/i }),
    );

    await user.click(
      screen.getByRole("button", {
        name: /increase Personal fouls to foul out/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /decrease Personal fouls to foul out/i,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /increase Team fouls to bonus/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /decrease Team fouls to bonus/i }),
    );

    await user.click(
      screen.getByRole("button", {
        name: /increase Team fouls to double bonus/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /decrease Team fouls to double bonus/i,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /increase Timeouts per team/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /decrease Timeouts per team/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /timeouts per half/i }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3: Review
    expect(
      screen.getByRole("button", { name: "Create team" }),
    ).toBeInTheDocument();
    await assertAccessible(container);

    await user.click(screen.getByRole("button", { name: "Create team" }));

    expect(mockDb.teams.add).toHaveBeenCalledTimes(1);
    expect(mockDb.teams.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Tigers",
        description: "Varsity Squad",
        primaryColor: "#123456",
        logoUrl: "https://example.com/tiger.png",
        periodType: "HALVES",
        timeoutScope: "HALF",
        synced: 0,
      }),
    );
    expect(syncService.pushUpdates).toHaveBeenCalledTimes(1);
    expect(handleCreated).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("validates required fields and prevents advancing to next step when invalid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTeamWorkflow open={true} onClose={vi.fn()} />);

    // Try advancing step 0 without entering team name
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Team name is required")).toBeInTheDocument();

    // Fill team name and advance
    await user.type(screen.getByLabelText(/Team name/i), "Bears");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 1: Invalid Hex Color
    const colorInput = screen.getByRole("textbox", { name: /Primary color/i });
    await user.clear(colorInput);
    await user.type(colorInput, "invalid");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/Use a valid hex color/i)).toBeInTheDocument();
  });

  it("handles db insertion failure gracefully by displaying submit error message", async () => {
    const user = userEvent.setup();
    mockDb.teams.add.mockRejectedValueOnce(new Error("DB Error"));

    renderWithProviders(<CreateTeamWorkflow open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Team name/i), "Hawks");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByRole("button", { name: "Create team" }));
    expect(
      await screen.findByText("Failed to create team"),
    ).toBeInTheDocument();
  });

  it("allows navigating back across steps", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateTeamWorkflow open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Team name/i), "Eagles");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("textbox", { name: /Primary color/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText(/Team name/i)).toBeInTheDocument();
  });
});
