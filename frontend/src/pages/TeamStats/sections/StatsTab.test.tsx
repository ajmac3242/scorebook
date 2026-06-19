import {
  renderWithProviders as render,
  screen,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import StatsTab from "./StatsTab";

describe("StatsTab", () => {
  const mockStats = [
    { label: "Points", value: "85.5", rank: 1, total: 10 },
    { label: "Rebounds", value: "42.1", rank: 3, total: 10 },
  ] as any;

  it("renders stats correctly", () => {
    render(<StatsTab teamStats={mockStats} controlRadius={8} />);

    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("85.5")).toBeInTheDocument();
    expect(screen.getByText("Rebounds")).toBeInTheDocument();
    expect(screen.getByText("42.1")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<StatsTab teamStats={[]} controlRadius={8} />);
    expect(screen.getByText(/No stats recorded/i)).toBeInTheDocument();
  });

  it("calls onStatClick when a stat row is clicked", async () => {
    const user = userEvent.setup();
    const onStatClick = vi.fn();
    render(
      <StatsTab
        teamStats={mockStats}
        controlRadius={8}
        onStatClick={onStatClick}
      />,
    );

    await user.click(screen.getByText("Points"));
    expect(onStatClick).toHaveBeenCalledWith(mockStats[0]);
  });
});
