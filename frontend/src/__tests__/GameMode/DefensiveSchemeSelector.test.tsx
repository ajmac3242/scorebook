import React from "react";
import { render, screen } from "@testing-library/react";
import { DefensiveSchemeSelector } from "../../pages/GameMode/DefensiveSchemeSelector";

jest.mock("../../components/SharedUI", () => ({
  MoleskineCard: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../../db", () => ({
  db: { games: { update: jest.fn().mockResolvedValue(undefined) } },
}));

jest.mock("../../utils/syncService", () => ({
  syncService: { pushUpdates: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../../utils/logger", () => ({
  logger: { error: jest.fn() },
}));

const SCHEMES = ["MAN", "ZONE", "PRESS", "DOUBLE"];

describe("DefensiveSchemeSelector", () => {
  const defaultProps = {
    activeScheme: "MAN",
    gameId: "game-1",
    isReadOnly: false,
  };

  it("renders all defensive scheme options", () => {
    render(<DefensiveSchemeSelector {...defaultProps} />);
    SCHEMES.forEach((scheme) => {
      expect(screen.getByText(scheme)).toBeInTheDocument();
    });
  });

  it("renders the active scheme as selected", () => {
    render(<DefensiveSchemeSelector {...defaultProps} activeScheme="ZONE" />);
    const zoneBtn = screen.getByText("ZONE").closest("button");
    expect(zoneBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders disabled buttons when isReadOnly is true", () => {
    render(<DefensiveSchemeSelector {...defaultProps} isReadOnly={true} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-disabled", "true");
  });

  it("renders without crashing when activeScheme is undefined", () => {
    render(
      <DefensiveSchemeSelector
        activeScheme={undefined}
        gameId="game-1"
        isReadOnly={false}
      />,
    );
    expect(screen.getByText("MAN")).toBeInTheDocument();
  });
});
