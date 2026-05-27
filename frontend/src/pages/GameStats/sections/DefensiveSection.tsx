import React from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";

interface DefensiveStat {
  totalStops: number;
  totalKills: number;
  currentStreak: number;
}

interface IndividualDefRow {
  playerId: string;
  jerseyNumber: string;
  playerName: string;
  pointsAllowed: number;
  primaryReason: string;
}

interface DefensiveSectionProps {
  defensiveStats: DefensiveStat;
  individualDefensiveBreakdown: IndividualDefRow[];
}

/**
 * Defensive Metrics KPI card + Individual Accountability table.
 * Lineup Efficiency is intentionally excluded — it is rendered in
 * GameStats.tsx as a shared ReactNode and passed to ExpandedSectionDialog
 * and EfficiencySection to avoid duplicated render paths.
 */
export const DefensiveSection = ({
  defensiveStats,
  individualDefensiveBreakdown,
}: DefensiveSectionProps) => {
  return (
    <>
      {/* Defensive Metrics KPI Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{ fontFamily: "var(--cs-typography-fontFamily-display)", mb: "var(--cs-semantic-spacing-md)" }}
          >
            Defensive Metrics
          </Typography>
          <Stack spacing={"var(--cs-semantic-spacing-md)"}>
            {[
              { label: "TOTAL STOPS", value: defensiveStats.totalStops },
              { label: "KILLS (3× STOPS)", value: defensiveStats.totalKills },
              { label: "CURRENT STOP STREAK", value: defensiveStats.currentStreak },
            ].map(({ label, value }) => (
              <Box
                key={label}
                sx={{
                  p: "var(--cs-semantic-spacing-sm)",
                  borderRadius: "var(--cs-semantic-shape-radius-md)",
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  border: "1px solid var(--cs-semantic-color-border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.06em" }}>
                  {label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "var(--cs-typography-fontWeight-black)", fontVariantNumeric: "tabular-nums" }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </MoleskineCard>
      </Grid>

      {/* Individual Defensive Accountability */}
      <Grid size={{ xs: 12, md: 8 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{ fontFamily: "var(--cs-typography-fontFamily-display)", mb: "var(--cs-semantic-spacing-md)" }}
          >
            Individual Defensive Accountability
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}>
                  {["Defender", "PTS Allowed", "Primary Breakdown"].map((h) => (
                    <TableCell
                      key={h}
                      align={h === "Defender" ? "left" : "right"}
                      sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {individualDefensiveBreakdown.map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell>
                      <Stack direction="row" spacing={"var(--cs-semantic-spacing-xs)"} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
                          {row.jerseyNumber}
                        </Avatar>
                        <Typography variant="body2">{row.playerName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "var(--cs-typography-fontWeight-bold)",
                        color: row.pointsAllowed > 8
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "inherit",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {row.pointsAllowed}
                    </TableCell>
                    <TableCell align="right">
                      {row.primaryReason ? (
                        <Chip
                          label={row.primaryReason}
                          size="small"
                          sx={{ fontSize: "0.65rem", fontWeight: 600 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {individualDefensiveBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: "var(--cs-semantic-spacing-md)", color: "text.secondary" }}>
                      No defensive breakdown data recorded.
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
