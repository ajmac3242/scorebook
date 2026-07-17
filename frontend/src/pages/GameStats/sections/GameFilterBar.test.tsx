import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { GameFilterBar } from "./GameFilterBar";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

describe("GameFilterBar", () => {
  const mockSetActiveTab = vi.fn();
  const mockSetPeriodFilter = vi.fn();
  const mockSetClutchFilter = vi.fn();

  const mockFilters = {
    activeTab: "standard",
    setActiveTab: mockSetActiveTab,
    periodFilter: "ALL",
    setPeriodFilter: mockSetPeriodFilter,
    clutchFilter: false,
    setClutchFilter: mockSetClutchFilter,
  } as unknown as GameFilters;

  const mockRawDataHalves = {
    team: {
      periodType: "HALVES",
    },
    allStats: [
      { period: 1 },
      { period: 2 },
      { period: 3 }, // OT 1
    ],
  } as unknown as GameData;

  const mockRawDataQuarters = {
    team: {
      periodType: "QUARTERS",
    },
    allStats: [
      { period: 1 },
      { period: 2 },
      { period: 3 },
      { period: 4 },
      { period: 5 }, // OT 1
    ],
  } as unknown as GameData;

  it("renders correctly with HALVES period type", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GameFilterBar filters={mockFilters} rawData={mockRawDataHalves} />,
    );

    // Tab buttons
    expect(
      screen.getByRole("button", { name: "Standard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Impact (On/Off)" }),
    ).toBeInTheDocument();

    // Period buttons (HALVES: Full Game, Half 1, Half 2, Half 3)
    expect(
      screen.getByRole("button", { name: "Full Game" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Half 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Half 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Half 3" })).toBeInTheDocument();

    // Clutch mode button
    expect(
      screen.getByRole("button", { name: "🔥 CLUTCH MODE" }),
    ).toBeInTheDocument();

    // Interaction test: change active tab
    await user.click(screen.getByRole("button", { name: "Impact (On/Off)" }));
    expect(mockSetActiveTab).toHaveBeenCalledWith("impact");

    // Interaction test: change period
    await user.click(screen.getByRole("button", { name: "Half 1" }));
    expect(mockSetPeriodFilter).toHaveBeenCalledWith("1");

    // Interaction test: toggle clutch
    await user.click(screen.getByRole("button", { name: "🔥 CLUTCH MODE" }));
    expect(mockSetClutchFilter).toHaveBeenCalledWith(true);

    await assertAccessible(container);
  });

  it("renders correctly with QUARTERS period type", async () => {
    const { container } = render(
      <GameFilterBar filters={mockFilters} rawData={mockRawDataQuarters} />,
    );

    expect(
      screen.getByRole("button", { name: "Quarter 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quarter 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quarter 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quarter 4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quarter 5" }),
    ).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("handles when clutchFilter is selected", async () => {
    const selectedFilters = {
      ...mockFilters,
      clutchFilter: true,
    } as unknown as GameFilters;

    const { container } = render(
      <GameFilterBar filters={selectedFilters} rawData={mockRawDataHalves} />,
    );

    const clutchBtn = screen.getByRole("button", { name: "🔥 CLUTCH MODE" });
    expect(clutchBtn).toHaveClass("Mui-selected");

    await assertAccessible(container);
  });
});
