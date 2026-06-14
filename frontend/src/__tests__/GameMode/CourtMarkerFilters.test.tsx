import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourtMarkerFilters } from "../../pages/GameMode/CourtMarkerFilters";

const defaultProps = {
  markerFilter: "ALL" as const,
  onFilterChange: vi.fn(),
};

const FILTER_TYPES = [
  "ALL",
  "MAKE",
  "MISS",
  "REBOUND",
  "ASSIST",
  "STEAL",
  "BLOCK",
];

describe("CourtMarkerFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter chip types", () => {
    render(<CourtMarkerFilters {...defaultProps} />);
    FILTER_TYPES.forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  it("shows ALL chip as filled/selected by default", () => {
    render(<CourtMarkerFilters {...defaultProps} markerFilter="ALL" />);
    const allChip = screen.getByText("ALL").closest("[aria-pressed]");
    expect(allChip).toHaveAttribute("aria-pressed", "true");
  });

  it("shows non-selected chips as outlined", () => {
    render(<CourtMarkerFilters {...defaultProps} markerFilter="MAKE" />);
    const allChip = screen.getByText("ALL").closest("[aria-pressed]");
    expect(allChip).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onFilterChange with correct filter type when chip is clicked", async () => {
    const user = userEvent.setup();
    render(<CourtMarkerFilters {...defaultProps} />);
    await user.click(screen.getByText("MAKE"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("MAKE");
  });

  it("calls onFilterChange when MISS chip is clicked", async () => {
    const user = userEvent.setup();
    render(<CourtMarkerFilters {...defaultProps} />);
    await user.click(screen.getByText("MISS"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("MISS");
  });

  it("calls onFilterChange with ALL when ALL chip is clicked", async () => {
    const user = userEvent.setup();
    render(<CourtMarkerFilters {...defaultProps} markerFilter="MAKE" />);
    await user.click(screen.getByText("ALL"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("ALL");
  });
});
