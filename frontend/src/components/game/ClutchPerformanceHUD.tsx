import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
} from "@mui/material";
import { LocalFireDepartment } from "@mui/icons-material";
import { PlayerAggregates } from "../../utils/stats/types";

/**
 * 🏀 Assistant Coach: "Winning Time" (Clutch) Performance HUD
 * WHY: The final 4 minutes of a close game require different tactical data.
 * This HUD removes the "noise" and focuses only on high-pressure performance.
 */

interface ClutchPerformanceHUDProps {
  onCourtStats: PlayerAggregates[];
  jerseyMap: Map<string, string | undefined>;
}

export const ClutchPerformanceHUD: React.FC<ClutchPerformanceHUDProps> = ({
  onCourtStats,
  jerseyMap,
}) => {
  // Calculate total clutch attempts for usage estimation
  const totalClutchAttempts = onCourtStats.reduce(
    (acc, p) => acc + p.attempts + p.fta * 0.44 + p.turnovers,
    0,
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "var(--cs-semantic-spacing-md)",
          p: "var(--cs-semantic-spacing-sm)",
          bgcolor: "var(--cs-semantic-color-feedback-error-dark)",
          borderRadius: "var(--cs-semantic-shape-radius-sm)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            color: "var(--cs-semantic-color-text-inverse)",
            letterSpacing: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LocalFireDepartment fontSize="small" /> Winning Time HUD
        </Typography>
        <Chip
          label="CLUTCH"
          size="small"
          sx={{
            height: 16,
            fontSize: "var(--cs-typography-fontSize-xs)",
            fontWeight: 900,
            bgcolor: "var(--cs-semantic-color-background-elevated)",
            color: "var(--cs-semantic-color-feedback-error-main)",
          }}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: "0.6rem", fontWeight: 800, p: 0.5 }}>
                PLAYER
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontSize: "0.6rem", fontWeight: 800, p: 0.5 }}
              >
                PTS
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontSize: "0.6rem", fontWeight: 800, p: 0.5 }}
              >
                FT%
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontSize: "0.6rem", fontWeight: 800, p: 0.5 }}
              >
                USAGE
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {onCourtStats
              .sort((a, b) => b.points - a.points)
              .map((p) => {
                const usage =
                  totalClutchAttempts > 0
                    ? ((p.attempts + p.fta * 0.44 + p.turnovers) /
                        totalClutchAttempts) *
                      100
                    : 0;

                return (
                  <TableRow key={p.id}>
                    <TableCell sx={{ p: 0.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 20,
                            height: 20,
                            fontSize: "0.6rem",
                            bgcolor:
                              "var(--cs-semantic-color-brand-primary-main)",
                          }}
                        >
                          {jerseyMap.get(p.id.toString()) || "?"}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {p.name.split(" ")[0]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ p: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 900,
                          color:
                            p.points > 0
                              ? "var(--cs-semantic-color-feedback-success-main)"
                              : "inherit",
                        }}
                      >
                        {p.points}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ p: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color:
                            parseFloat(p.ftPct) >= 80
                              ? "var(--cs-semantic-color-feedback-success-main)"
                              : parseFloat(p.ftPct) <= 50 && p.fta > 0
                                ? "var(--cs-semantic-color-feedback-error-main)"
                                : "inherit",
                        }}
                      >
                        {p.ftPct}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ p: 0.5, minWidth: 60 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={usage}
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            bgcolor:
                              "var(--cs-semantic-color-action-disabledBackground)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor:
                                usage > 30
                                  ? "var(--cs-semantic-color-feedback-error-main)"
                                  : "var(--cs-semantic-color-brand-primary-main)",
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.5rem" }}
                        >
                          {Math.round(usage)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: "var(--cs-semantic-spacing-md)",
          p: "var(--cs-semantic-spacing-sm)",
          bgcolor: "var(--cs-semantic-color-surface-subtle)",
          borderRadius: "var(--cs-semantic-shape-radius-sm)",
          border: "1px solid var(--cs-semantic-color-border-subtle)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            color: "var(--cs-semantic-color-text-secondary)",
            display: "block",
            mb: 0.5,
            textTransform: "uppercase",
          }}
        >
          CLUTCH ADVISOR
        </Typography>
        {(() => {
          const highUsage = onCourtStats.find((p) => {
            const usage =
              totalClutchAttempts > 0
                ? ((p.attempts + p.fta * 0.44 + p.turnovers) /
                    totalClutchAttempts) *
                  100
                : 0;
            return usage > 35;
          });
          const poorFT = onCourtStats.find(
            (p) => p.fta > 0 && parseFloat(p.ftPct) < 60,
          );

          return (
            <Box>
              {highUsage && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "var(--cs-semantic-color-feedback-warning-dark)",
                    fontWeight: 700,
                  }}
                >
                  ⚠️ High Usage: Play through #
                  {jerseyMap.get(highUsage.id.toString())} or find counter.
                </Typography>
              )}
              {poorFT && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "var(--cs-semantic-color-feedback-error-main)",
                    fontWeight: 700,
                  }}
                >
                  🚨 FT Risk: #{jerseyMap.get(poorFT.id.toString())} is a
                  "Hack-a" target ({poorFT.ftPct}%).
                </Typography>
              )}
              {!highUsage && !poorFT && (
                <Typography
                  variant="caption"
                  sx={{ fontStyle: "italic", opacity: 0.6 }}
                >
                  Maintain current rotation and spread usage.
                </Typography>
              )}
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
};
