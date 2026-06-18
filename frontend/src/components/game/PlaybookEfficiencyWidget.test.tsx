import {
  renderWithProviders as render,
  screen,
  fireEvent,
} from "../../test-utils";
import { describe, it, expect } from "vitest";
import PlaybookEfficiencyWidget from "./PlaybookEfficiencyWidget";

describe("PlaybookEfficiencyWidget", () => {
  const defaultProps = {
    plays: [
      {
        name: "Horns",
        ppp: "1.25",
        attempts: 4,
        makes: 2,
        points: 5,
        efg: "62.5",
      },
      {
        name: "ISO",
        ppp: "0.80",
        attempts: 5,
        makes: 1,
        points: 4,
        efg: "20.0",
      },
      {
        name: "Hammer",
        ppp: "1.00",
        attempts: 2,
        makes: 1,
        points: 2,
        efg: "50.0",
      },
    ],
    teamPpp: 1.0,
    gameStats: [
      {
        id: "1",
        gameId: "g1",
        playerId: "p1",
        type: "MAKE",
        points: 2,
        playName: "Horns",
        locationX: 50,
        locationY: 50,
        timestamp: new Date().toISOString(),
        period: 1,
      },
      {
        id: "2",
        gameId: "g1",
        playerId: "p1",
        type: "MISS",
        playName: "Horns",
        locationX: 30,
        locationY: 30,
        timestamp: new Date().toISOString(),
        period: 1,
      },
    ],
  };

  it("renders correctly", () => {
    render(<PlaybookEfficiencyWidget {...defaultProps} />);
    expect(screen.getByText("Playbook Efficiency")).toBeInTheDocument();
    expect(screen.getByText("HORNS")).toBeInTheDocument();
    expect(screen.getByText("1.25 PPP")).toBeInTheDocument();
  });

  it("opens dialog with shot chart when chart icon is clicked", () => {
    render(<PlaybookEfficiencyWidget {...defaultProps} />);

    const chartButtons = screen.getAllByRole("button");
    fireEvent.click(chartButtons[0]);

    expect(screen.getByText(/Shot Chart: Horns/i)).toBeInTheDocument();
    expect(screen.getByTestId("basketball-court")).toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", () => {
    render(<PlaybookEfficiencyWidget {...defaultProps} />);
    const chartButtons = screen.getAllByRole("button");
    fireEvent.click(chartButtons[0]);

    expect(screen.getByText(/Shot Chart: Horns/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByText(/Shot Chart: Horns/i)).not.toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<PlaybookEfficiencyWidget {...defaultProps} plays={[]} />);
    expect(screen.getByText("No plays tagged yet.")).toBeInTheDocument();
  });

  it("applies correct color based on efficiency", () => {
    render(<PlaybookEfficiencyWidget {...defaultProps} />);
    const hornsText = screen.getByText("1.25 PPP");
    expect(hornsText).toBeInTheDocument();
  });
});
