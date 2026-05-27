import React from "react";
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";
import { OnOffImpactTable } from "../../components/OnOffImpactTable";

interface MatchupStatRow {
  opponentId: string;
  opponentJersey?: string;
  defenderId?: string;
  defenderJersey?: string;
  defenderName?: string;
  pointsAllowed: number;
  stops: number;
  stopPct: string;
}

interface ImpactSectionProps {
  onOffStats: Parameters<typeof OnOffImpactTable>[0]["data"];
  matchupStats: MatchupStatRow[];
}

export const ImpactSection = ({
  onOffStats,
  matchupStats,
}: ImpactSectionProps) => {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "var(--cs-typography-fontFamily-display)",
              mb: "var(--cs-semantic-spacing-md)",
            }}
          >
            Team Impact Analytics (On/Off)
          </Typography>
          <OnOffImpactTable data={onOffStats} />
        </MoleskineCard>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "var(--cs-typography-fontFamily-display)",
              mb: "var(--cs-semantic-spacing-md)",
            }}
          >
            Matchup Accountability (Points Allowed)
          </Typography>
          <TableContainer component={Box}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                >
                  <TableCell
                    sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                  >
                    Opponent
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                  >
                    Primary Defender
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                  >
                    PTS Allowed
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                  >
                    Stops
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                  >
                    Stop %
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matchupStats.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{
                        fontWeight: "var(--cs-typography-fontWeight-semibold)",
                      }}
                    >
                      #{m.opponentJersey ?? "?"}
                    </TableCell>
                    <TableCell>
                      {m.defenderName
                        ? `#${m.defenderJersey ?? "?"} ${m.defenderName}`
                        : "—"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "var(--cs-typography-fontWeight-bold)",
                        color:
                          m.pointsAllowed > 10
                            ? "var(--cs-semantic-color-feedback-error-main)"
                            : "inherit",
                      }}
                    >
                      {m.pointsAllowed}
                    </TableCell>
                    <TableCell align="right">{m.stops}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "var(--cs-typography-fontWeight-bold)",
                        color:
                          parseFloat(m.stopPct) >= 50
                            ? "var(--cs-semantic-color-feedback-success-main)"
                            : "inherit",
                      }}
                    >
                      {m.stopPct}%
                    </TableCell>
                  </TableRow>
                ))}
                {matchupStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No matchup data recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>
    </>
  );
};
