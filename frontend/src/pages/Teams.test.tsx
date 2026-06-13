import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  renderWithProviders as render,
  screen,
} from "../test-utils";
import Teams from "./Teams";
import * as useTeamsHook from "../hooks/useTeams";
import * as useTeamsDataHook from "./Teams/hooks/useTeamsData";

vi.mock("../hooks/useTeams", () => ({
  useTeams: vi.fn(),
}));

vi.mock("./Teams/hooks/useTeamsData", () => ({
  useTeamsData: vi.fn(),
}));

vi.mock("../components/layout/AppPageShell", () => ({
  default: ({
    children,
    title,
    controls,
  }: {
    children: React.ReactNode;
    title: string;
    controls: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      <div>{controls}</div>
      {children}
    </div>
  ),
}));

describe("Teams Page", () => {
  const mockTeams = [
    { id: "1", name: "Lakers", isFavorite: 1, primaryColor: "#552583" },
    { id: "2", name: "Celtics", isFavorite: 0, primaryColor: "#007A33" },
  ];

  beforeEach(() => {
    (useTeamsHook.useTeams as Mock).mockReturnValue(mockTeams);
    (useTeamsDataHook.useTeamsData as Mock).mockReturnValue({
      teamAggregatesMap: {},
      handleToggleFavorite: vi.fn(),
    });
  });

  it("renders the Teams page with title", () => {
    render(<Teams />);
    expect(screen.getByText("Teams")).toBeInTheDocument();
  });

  it("filters teams based on search input", async () => {
    const { user } = render(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    await user.type(searchInput, "Lakers");

    expect(screen.getByText("Lakers")).toBeInTheDocument();
    expect(screen.queryByText("Celtics")).not.toBeInTheDocument();
  });

  it("shows inline clear search control when search is active", async () => {
    const { user } = render(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    await user.type(searchInput, "Lakers");

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
    expect(screen.queryByText("Search: Lakers")).not.toBeInTheDocument();
  });

  it("clears search from the inline clear control", async () => {
    const { user } = render(<Teams />);

    const searchInput = screen.getByPlaceholderText(
      "Search teams",
    ) as HTMLInputElement;
    await user.type(searchInput, "Lakers");

    await user.click(screen.getByLabelText("Clear search"));

    expect(searchInput.value).toBe("");
    expect(screen.getByText("Celtics")).toBeInTheDocument();
  });
});
