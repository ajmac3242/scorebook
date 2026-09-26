import React from "react";
import {
  renderWithProviders as render,
  screen,
  act,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PlayerStatsFilterBar from "./PlayerStatsFilterBar";

describe("PlayerStatsFilterBar", () => {
  const defaultProps = {
    games: [
      { id: "g1", opponent: "Bulls" } as any,
      { id: "g2", opponent: "Celtics" } as any,
    ],
    availableTeams: [{ id: "t1", name: "Team 1" } as any],
    selectedTeamId: null,
    setSelectedTeamId: vi.fn(),
    selectedGameId: null,
    setSelectedGameId: vi.fn(),
    selectedGameWindow: "all" as const,
    setSelectedGameWindow: vi.fn(),
  };

  it("renders correctly", async () => {
    await act(async () => {
      render(<PlayerStatsFilterBar {...defaultProps} />);
    });
    expect(screen.getByLabelText("Team")).toBeInTheDocument();
    expect(screen.getByLabelText("Games")).toBeInTheDocument();
  });

  it("handles team selection", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<PlayerStatsFilterBar {...defaultProps} />);
    });

    const select = screen.getByLabelText("Team");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Team 1" });
    await user.click(option);

    expect(defaultProps.setSelectedTeamId).toHaveBeenCalledWith("t1");
  });

  it("handles 'career' selection", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<PlayerStatsFilterBar {...defaultProps} selectedTeamId="t1" />);
    });

    const select = screen.getByLabelText("Team");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Career" });
    await user.click(option);

    expect(defaultProps.setSelectedTeamId).toHaveBeenCalledWith(null);
  });

  it("handles window selection and resets game id when not single", async () => {
    const user = userEvent.setup();
    const setSelectedGameId = vi.fn();
    const setSelectedGameWindow = vi.fn();

    await act(async () => {
      render(
        <PlayerStatsFilterBar
          {...defaultProps}
          selectedGameWindow="single"
          selectedGameId="g1"
          setSelectedGameId={setSelectedGameId}
          setSelectedGameWindow={setSelectedGameWindow}
        />,
      );
    });

    const select = screen.getByLabelText("Games");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Last 10" });
    await user.click(option);

    expect(setSelectedGameWindow).toHaveBeenCalledWith("last10");
    expect(setSelectedGameId).toHaveBeenCalledWith(null);
  });

  it("shows game selector when window is 'single'", async () => {
    await act(async () => {
      render(
        <PlayerStatsFilterBar {...defaultProps} selectedGameWindow="single" />,
      );
    });
    expect(screen.getByLabelText("Game")).toBeInTheDocument();
  });

  it("handles individual game selection and fallback opponent name", async () => {
    const user = userEvent.setup();
    const setSelectedGameId = vi.fn();
    const games = [
      { id: "g1", opponent: "Bulls" } as any,
      { id: "g3" } as any, // Missing opponent string
    ];

    await act(async () => {
      render(
        <PlayerStatsFilterBar
          {...defaultProps}
          games={games}
          selectedGameWindow="single"
          setSelectedGameId={setSelectedGameId}
        />,
      );
    });

    const select = screen.getByLabelText("Game");
    await user.click(select);
    const option = await screen.findByRole("option", { name: "Opponent" });
    await user.click(option);

    expect(setSelectedGameId).toHaveBeenCalledWith("g3");
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<PlayerStatsFilterBar {...defaultProps} />);
      container = rendered.container;
    });

    await assertAccessible(container!);
  });
});
