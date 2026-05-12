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
import { PlayerAggregates } from "../utils/stats/types";

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
          mb: 2,
          p: 1,
          bgcolor: "error.dark",
          borderRadius: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            color: "white",
            letterSpacing: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LocalFireDepartment fontSize="small" /> WINNING TIME HUD
        </Typography>
        <Chip
          label="CLUTCH"
          size="small"
          sx={{
            height: 16,
            fontSize: "0.5rem",
            fontWeight: 900,
            bgcolor: "white",
            color: "error.main",
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
                            bgcolor: "primary.main",
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
                          color: p.points > 0 ? "success.main" : "inherit",
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
                              ? "success.main"
                              : parseFloat(p.ftPct) <= 50 && p.fta > 0
                                ? "error.main"
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
                            bgcolor: "rgba(0,0,0,0.05)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor:
                                usage > 30 ? "error.main" : "primary.main",
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: "0.5rem" }}>
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

      <Box sx={{ mt: 2, p: 1, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: "text.secondary",
            display: "block",
            mb: 0.5,
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
                    color: "warning.dark",
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
                  sx={{ display: "block", color: "error.main", fontWeight: 700 }}
                >
                  🚨 FT Risk: #{jerseyMap.get(poorFT.id.toString())} is a "Hack-a"
                  target ({poorFT.ftPct}%).
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
