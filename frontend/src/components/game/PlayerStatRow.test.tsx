import React from "react";
import { Table, TableBody } from "@mui/material";
import { renderWithProviders as render } from "../../test-utils";
import { PlayerStatRow } from "./PlayerStatRow";
import { describe, it, expect } from "vitest";

const mockProps = {
  jerseyNumber: "23",
  name: "Michael Jordan",
  isOnCourt: true,
  min: 35,
  points: 30,
  threePM: 2,
  threePA: 5,
  threePPct: "40%",
  ftm: 8,
  fta: 10,
  ftPct: "80%",
  rebounds: 6,
  assists: 5,
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
     * This snapshot protects against unintended changes to the per-player stat row layout,
     * theme token usage for on-court highlighting, and alignment of statistical columns.
     */
    const { container } = render(
      <Table>
        <TableBody>
          <PlayerStatRow {...mockProps} />
        </TableBody>
      </Table>
    );
    expect(container).toMatchSnapshot("PlayerStatRow default render");
  });
});
