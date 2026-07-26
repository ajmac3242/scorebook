import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EmptyState from "./EmptyState";
import { Button } from "@mui/material";

describe("EmptyState", () => {
  const mockIcon = <span data-testid="mock-icon">🏀</span>;

  it("renders correctly with title, description and icon", async () => {
    const { container } = render(
      <EmptyState
        icon={mockIcon}
        title="No games available"
        description="Try creating a new game to get started."
      />,
      { withAuth: false },
    );

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    expect(screen.getByText("No games available")).toBeInTheDocument();
    expect(
      screen.getByText("Try creating a new game to get started."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await assertAccessible(container);
  });

  it("renders the custom action button when provided", async () => {
    const user = userEvent.setup();
    const handleActionClick = vi.fn();
    const actionCta = <Button onClick={handleActionClick}>Add Game</Button>;

    const { container } = render(
      <EmptyState
        icon={mockIcon}
        title="Empty List"
        description="Nothing here."
        action={actionCta}
      />,
      { withAuth: false },
    );

    const actionButton = screen.getByRole("button", { name: "Add Game" });
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(handleActionClick).toHaveBeenCalledTimes(1);

    await assertAccessible(container);
  });
});
