import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OnOffImpactTable } from "./OnOffImpactTable";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("OnOffImpactTable", () => {
  it("renders table headers correctly", () => {
    renderWithTheme(<OnOffImpactTable data={[]} />);
    expect(screen.getByText("PLAYER")).toBeInTheDocument();
    expect(screen.getByText("TEAM ON")).toBeInTheDocument();
    expect(screen.getByText("TEAM OFF")).toBeInTheDocument();
    expect(screen.getByText("DIFF")).toBeInTheDocument();
  });

  it("renders data rows correctly", () => {
    const data = [
      {
        playerId: "1",
        name: "Player 1",
        on: {
          possessions: 10,
          ptsFor: 11,
          ptsAgainst: 10,
          offRating: "110.0",
          defRating: "100.0",
          netRating: "10.0",
        },
        off: {
          possessions: 10,
          ptsFor: 10,
          ptsAgainst: 11,
          offRating: "105.0",
          defRating: "110.0",
          netRating: "-5.0",
        },
        differential: "15.0",
      },
    ];

    renderWithTheme(<OnOffImpactTable data={data} />);
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getAllByText("110.0")).toHaveLength(2); // ON OFF RTG and OFF DEF RTG
    expect(screen.getByText("100.0")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("105.0")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("+15")).toBeInTheDocument();
  });
});
