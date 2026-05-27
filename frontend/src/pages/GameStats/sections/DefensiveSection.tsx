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

interface LineupStatRow {
  lineup: string[];
  seconds: number;
  pointsFor: number;
  pointsAgainst: number;
  netRatingPer40: number | string;
  netRating: number;
}

interface DefensiveSectionProps {
  defensiveStats: DefensiveStat;
  individualDefensiveBreakdown: IndividualDefRow[];
  lineupStats: LineupStatRow[];
  jerseyMap: Map<string, string>;
}

export const DefensiveSection = ({
  defensiveStats,
  individualDefensiveBreakdown,
  lineupStats,
  jerseyMap,
}: DefensiveSectionProps) => {
  return (
    <>
      {/* Defensive Metrics KPI Card */}
      <Grid size={{ xs: 12 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{ fontFamily: "var(--cs-typography-fontFamily-display)", mb: "var(--cs-semantic-spacing-md)" }}
          >
            Defensive Metrics
          </Typography>
          <Grid container spacing={"var(--cs-semantic-spacing-lg)"}>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>
                  {defensiveStats.totalStops}
                </Typography>
                <Typography variant="caption" color="text.secondary">TOTAL STOPS</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="secondary" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>
                  {defensiveStats.totalKills}
                </Typography>
                <Typography variant="caption" color="text.secondary">KILLS (3x STOPS)</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>
                  {defensiveStats.currentStreak}
                </Typography>
                <Typography variant="caption" color="text.secondary">CURRENT STOP STREAK</Typography>
              </Box>
            </Grid>
          </Grid>
        </MoleskineCard>
      </Grid>

      {/* Individual Defensive Accountability */}
      <Grid size={{ xs: 12, md: 6 }}>
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
                  <TableCell sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>Defender</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>PTS Agn</TableCell>
                  <TableCell sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>Primary Breakdown</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {individualDefensiveBreakdown.map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell>
                      <Stack direction="row" spacing={"var(--cs-semantic-spacing-xs)"} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: "var(--cs-typography-fontSize-xs)" }}>
                          {row.jerseyNumber}
                        </Avatar>
                        <Typography variant="body2">{row.playerName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>
                      {row.pointsAllowed}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.primaryReason}
                        size="small"
                        variant="outlined"
                        color={row.primaryReason === "Great Contest" ? "success" : "error"}
                        sx={{ fontSize: "var(--cs-typography-fontSize-xs)", height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>

      {/* Lineup Efficiency */}
      <Grid size={{ xs: 12, md: 6 }}>
        <MoleskineCard>
          <Typography
            variant="h6"
            sx={{ fontFamily: "var(--cs-typography-fontFamily-display)", mb: "var(--cs-semantic-spacing-md)" }}
          >
            Lineup Efficiency
          </Typography>
          <TableContainer component={Box}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}>
                  <TableCell sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>Lineup</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>MIN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>PTS FOR</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>PTS AGN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>NET/40</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}>+/-</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineupStats.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Stack direction="row" spacing={"var(--cs-semantic-spacing-xs)"}>
                        {row.lineup.map((pId) => (
                          <Avatar key={pId} sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
                            {jerseyMap.get(pId) ?? "??"}
                          </Avatar>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{(row.seconds / 60).toFixed(1)}</TableCell>
                    <TableCell align="right">{row.pointsFor}</TableCell>
                    <TableCell align="right">{row.pointsAgainst}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{row.netRatingPer40}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "var(--cs-typography-fontWeight-bold)",
                        color:
                          row.netRating > 0
                            ? "var(--cs-semantic-color-feedback-success-main)"
                            : row.netRating < 0
                              ? "var(--cs-semantic-color-feedback-error-main)"
                              : "inherit",
                      }}
                    >
                      {row.netRating > 0 ? `+${row.netRating}` : row.netRating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>
    </>
  );
};
