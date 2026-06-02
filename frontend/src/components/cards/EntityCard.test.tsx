import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import EntityCard from "./EntityCard";

const theme = createTheme();

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
    footerLabel: "View Dashboard",
  };

  it("renders basic entity information", () => {
    render(
      <ThemeProvider theme={theme}>
        <EntityCard {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Quarters")).toBeInTheDocument();
    expect(screen.getByText("10-2")).toBeInTheDocument();
    expect(screen.getByText("Record")).toBeInTheDocument();
    expect(screen.getByText("PPG")).toBeInTheDocument();
    expect(screen.getByText("85.5")).toBeInTheDocument();
    expect(screen.getByText("RPG")).toBeInTheDocument();
    expect(screen.getByText("42.1")).toBeInTheDocument();
    expect(screen.getByText("View Dashboard")).toBeInTheDocument();
  });

  it("renders fallback initials when no image is provided", () => {
    render(
      <ThemeProvider theme={theme}>
        <EntityCard {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByText("TT")).toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", () => {
    const onClick = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <EntityCard {...defaultProps} onClick={onClick} />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("handles favorite toggle separately", () => {
    const onClick = vi.fn();
    const onFavoriteClick = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <EntityCard
          {...defaultProps}
          onClick={onClick}
          onFavoriteClick={onFavoriteClick}
          favoriteAriaLabel="Toggle Favorite"
        />
      </ThemeProvider>,
    );

    const favoriteButton = screen.getByLabelText("Toggle Favorite");
    fireEvent.click(favoriteButton);

    expect(onFavoriteClick).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
