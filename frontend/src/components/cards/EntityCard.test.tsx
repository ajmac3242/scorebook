import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import EntityCard from "./EntityCard";

describe("EntityCard", () => {
  const defaultProps = {
    title: "Test Team",
    subtitle: "Test Description",
    badgeLabel: "Quarters",
    accentColor: "#FF5500",
    fallbackInitials: "TT",
    highlightValue: "10-2",
    highlightLabel: "Record",
    stats: [
      { label: "PPG", value: "85.5" },
      { label: "RPG", value: "42.1" },
    ],
  };

  it("renders basic entity information", () => {
    render(<EntityCard {...defaultProps} />);

    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Quarters")).toBeInTheDocument();
    expect(screen.getByText("10-2")).toBeInTheDocument();
    expect(screen.getByText("Record")).toBeInTheDocument();
    expect(screen.getByText("PPG")).toBeInTheDocument();
    expect(screen.getByText("85.5")).toBeInTheDocument();
    expect(screen.getByText("RPG")).toBeInTheDocument();
    expect(screen.getByText("42.1")).toBeInTheDocument();
    expect(screen.queryByText("View Dashboard")).not.toBeInTheDocument();
  });

  it("renders fallback initials when no image is provided", () => {
    render(<EntityCard {...defaultProps} />);
    expect(screen.getByText("TT")).toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EntityCard {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("handles favorite toggle separately", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onFavoriteClick = vi.fn();
    render(
      <EntityCard
        {...defaultProps}
        onClick={onClick}
        onFavoriteClick={onFavoriteClick}
        favoriteAriaLabel="Toggle Favorite"
      />,
    );

    const favoriteButton = screen.getByLabelText("Toggle Favorite");
    await user.click(favoriteButton);

    expect(onFavoriteClick).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders dash placeholders and 'No games yet' caption when gamesPlayed is 0", () => {
    render(<EntityCard {...defaultProps} gamesPlayed={0} />);

    expect(screen.getByText("No games yet")).toBeInTheDocument();
    // Multiple '—' placeholders are rendered for highlight and stats
    const dashPlaceholders = screen.getAllByText("—");
    expect(dashPlaceholders.length).toBeGreaterThanOrEqual(2);
  });

  it("renders active favorite badge and custom favorite icons when isFavorite is true", () => {
    render(
      <EntityCard
        {...defaultProps}
        isFavorite={true}
        onFavoriteClick={vi.fn()}
        favoriteAriaLabel="Remove Favorite"
        favoriteTooltip="Remove from favorites"
      />,
    );

    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Favorite")).toBeInTheDocument();
  });

  it("renders with role='region' when ariaLabel is provided and onClick is not set", () => {
    render(<EntityCard {...defaultProps} ariaLabel="Team Information Card" />);

    const region = screen.getByRole("region", {
      name: "Team Information Card",
    });
    expect(region).toBeInTheDocument();
  });

  it("triggers onClick when Enter or Space key is pressed on a clickable card", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EntityCard
        {...defaultProps}
        onClick={onClick}
        ariaLabel="Clickable Team"
      />,
    );

    const card = screen.getByRole("button");
    card.focus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
