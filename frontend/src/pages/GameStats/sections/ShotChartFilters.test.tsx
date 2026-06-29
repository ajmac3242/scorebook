import { screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ShotChartFilters } from "./ShotChartFilters";
import { renderWithProviders } from "../../../test-utils";
import {
  ACTION_TYPES,
  SHOT_QUALITY,
  BREAKDOWN_REASONS,
} from "../../../constants/stats";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

describe("ShotChartFilters", () => {
  const mockFilters = {
    selectedPlayerId: "ALL",
    setSelectedPlayerId: vi.fn(),
    selectedType: "ALL",
    setSelectedType: vi.fn(),
    selectedQuality: "ALL",
    setSelectedQuality: vi.fn(),
    selectedBreakdown: "ALL",
    setSelectedBreakdown: vi.fn(),
    selectedPlay: "ALL",
    setSelectedPlay: vi.fn(),
    compareMode: false,
    setCompareMode: vi.fn(),
    shotChartView: "markers" as const,
    setShotChartView: vi.fn(),
  } as unknown as GameFilters;

  const mockRawData = {
    team: {
      playbook: ["Pick & Roll", "Isolation"],
    },
    players: [
      { id: "p1", name: "Player 1" },
      { id: "p2", name: "Player 2" },
    ],
  } as unknown as GameData;

  it("renders all filter options", () => {
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /compare/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /markers/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /heatmap/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Player")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Quality")).toBeInTheDocument();
    expect(screen.getByLabelText("Breakdown")).toBeInTheDocument();
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("calls setCompareMode when Compare button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    await user.click(screen.getByRole("button", { name: /compare/i }));
    expect(mockFilters.setCompareMode).toHaveBeenCalledWith(true);
  });

  it("calls setShotChartView when view toggle is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    await user.click(screen.getByRole("button", { name: /heatmap/i }));
    expect(mockFilters.setShotChartView).toHaveBeenCalledWith("heatmap");
  });

  it("updates player filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    const select = screen.getByLabelText("Player");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Player 1" });
    await user.click(option);
    expect(mockFilters.setSelectedPlayerId).toHaveBeenCalledWith("p1");
  });

  it("updates type filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    const select = screen.getByLabelText("Type");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Makes" });
    await user.click(option);
    expect(mockFilters.setSelectedType).toHaveBeenCalledWith(ACTION_TYPES.MAKE);
  });

  it("updates quality filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    const select = screen.getByLabelText("Quality");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Contested" });
    await user.click(option);
    expect(mockFilters.setSelectedQuality).toHaveBeenCalledWith(
      SHOT_QUALITY.CONTESTED,
    );
  });

  it("updates breakdown filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    const select = screen.getByLabelText("Breakdown");
    await user.click(select);
    const option = await screen.findByRole("option", {
      name: BREAKDOWN_REASONS.MISSED_ROTATION,
    });
    await user.click(option);
    expect(mockFilters.setSelectedBreakdown).toHaveBeenCalledWith(
      BREAKDOWN_REASONS.MISSED_ROTATION,
    );
  });

  it("updates play filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={mockRawData} />,
    );

    const select = screen.getByLabelText("Play");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Pick & Roll" });
    await user.click(option);
    expect(mockFilters.setSelectedPlay).toHaveBeenCalledWith("Pick & Roll");
  });

  it("does not render play filter if playbook is empty", () => {
    const rawDataNoPlaybook = {
      ...mockRawData,
      team: { ...mockRawData.team, playbook: [] },
    } as unknown as GameData;
    renderWithProviders(
      <ShotChartFilters filters={mockFilters} rawData={rawDataNoPlaybook} />,
    );

    expect(screen.queryByLabelText("Play")).not.toBeInTheDocument();
  });
});
