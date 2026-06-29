import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SpecialtyExecutionCard } from "./SpecialtyExecutionCard";
import { renderWithProviders } from "../../../test-utils";

describe("SpecialtyExecutionCard", () => {
  const mockData = [
    {
      situation: "ATO",
      ppp: "1.20",
      delta: "0.20",
      successRate: "60.0",
      efg: "55.0",
    },
    {
      situation: "BLOB",
      ppp: "0.80",
      delta: "-0.10",
      successRate: "40.0",
      efg: "45.0",
    },
    {
      situation: "SLOB",
      ppp: "1.00",
      delta: "0.00",
      successRate: "50.0",
      efg: "50.0",
    },
  ];

  it("renders the card title and table data", () => {
    renderWithProviders(<SpecialtyExecutionCard specialtyExecution={mockData} />);

    expect(screen.getByText("Specialty Execution")).toBeInTheDocument();
    expect(screen.getByText("ATO")).toBeInTheDocument();
    expect(screen.getByText("BLOB")).toBeInTheDocument();
    expect(screen.getByText("SLOB")).toBeInTheDocument();
  });

  it("formats delta values correctly with signs", () => {
    renderWithProviders(<SpecialtyExecutionCard specialtyExecution={mockData} />);

    expect(screen.getByText("+0.20")).toBeInTheDocument();
    expect(screen.getByText("-0.10")).toBeInTheDocument();
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });

  it("applies correct colors to delta values", () => {
    renderWithProviders(<SpecialtyExecutionCard specialtyExecution={mockData} />);

    const positiveDelta = screen.getByText("+0.20");
    const negativeDelta = screen.getByText("-0.10");

    // Using computed styles as happy-dom resolves CSS variables
    // Success color matches #4E7D5B, Error color matches #A64444 in our theme configuration
    expect(positiveDelta).toHaveStyle("color: #4E7D5B");
    expect(negativeDelta).toHaveStyle("color: #A64444");
  });

  it("renders empty message when no data is provided", () => {
    renderWithProviders(<SpecialtyExecutionCard specialtyExecution={[]} />);
    expect(screen.getByText("No situational plays recorded.")).toBeInTheDocument();
  });
});
