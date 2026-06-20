import React from "react";
import { Table, TableBody } from "@mui/material";
import { describe, it, expect } from "vitest";
import { renderWithProviders as render } from "../../test-utils";
import { PlayerStatRow } from "./PlayerStatRow";

const defaultProps = {
  jerseyNumber: "23",
  name: "LeBron James",
  isOnCourt: true,
  min: 35,
  points: 27,
  threePM: 3,
  threePA: 7,
  threePPct: "42.9%",
  ftm: 6,
  fta: 8,
  ftPct: "75.0%",
  rebounds: 8,
  assists: 10,
  steals: 2,
  blocks: 1,
  turnovers: 3,
  fouls: 2,
  plusMinus: 12,
  streak: "HOT" as const,
};

describe("PlayerStatRow", () => {
  it("matches snapshot", () => {
    /**
     * This snapshot protects against unintended regressions in the player statistical row layout,
     * including column alignment, typography choices, and the application of theme-based
     * styles (like on-court highlighting and foul warnings).
     */
    const { asFragment } = render(
      <Table>
        <TableBody>
          <PlayerStatRow {...defaultProps} />
        </TableBody>
      </Table>
    );
    expect(asFragment()).toMatchSnapshot("PlayerStatRow - default");
  });

  it("matches snapshot when in foul trouble", () => {
    const { asFragment } = render(
      <Table>
        <TableBody>
          <PlayerStatRow {...defaultProps} fouls={4} />
        </TableBody>
      </Table>
    );
    expect(asFragment()).toMatchSnapshot("PlayerStatRow - foul trouble");
  });

  it("matches snapshot when fouled out", () => {
    const { asFragment } = render(
      <Table>
        <TableBody>
          <PlayerStatRow {...defaultProps} fouls={5} />
        </TableBody>
      </Table>
    );
    expect(asFragment()).toMatchSnapshot("PlayerStatRow - fouled out");
  });
});
