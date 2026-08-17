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
import { useTokens } from "../../theme/useTokens";

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
  const tokens = useTokens();

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
          mb: tokens.semantic.spacing.md / 8,
          p: tokens.semantic.spacing.sm / 8,
          bgcolor: tokens.semantic.color.feedback.error.dark,
          borderRadius: tokens.semantic.shape.radius.sm / 8,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: tokens.typography.fontWeight.black,
            color: tokens.semantic.color.text.inverse,
            letterSpacing: tokens.typography.letterSpacing.wider,
            display: "flex",
            alignItems: "center",
            gap: tokens.semantic.spacing.xs / 8,
          }}
        >
          <LocalFireDepartment fontSize="small" /> Winning Time HUD
        </Typography>
        <Chip
          label="CLUTCH"
          size="small"
          sx={{
            height: 16,
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.black,
            bgcolor: tokens.semantic.color.background.elevated,
            color: tokens.semantic.color.feedback.error.main,
          }}
        />
      </Box>

      <TableContainer>
        <Table size="small" aria-label="Clutch performance table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  p: tokens.semantic.spacing.xs / 16,
                }}
              >
                PLAYER
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  p: tokens.semantic.spacing.xs / 16,
                }}
              >
                PTS
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  p: tokens.semantic.spacing.xs / 16,
                }}
              >
                FT%
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  p: tokens.semantic.spacing.xs / 16,
                }}
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

                const jerseyVal = jerseyMap.get(p.id.toString()) ?? "?";

                return (
                  <TableRow key={p.id}>
                    <TableCell sx={{ p: tokens.semantic.spacing.xs / 16 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: tokens.semantic.spacing.xs / 8,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 20,
                            height: 20,
                            fontSize: tokens.typography.fontSize.xs,
                            bgcolor: tokens.semantic.color.brand.primary.main,
                          }}
                        >
                          {jerseyVal}
                        </Avatar>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: tokens.typography.fontWeight.bold,
                          }}
                        >
                          {p.name.split(" ")[0]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ p: tokens.semantic.spacing.xs / 16 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: tokens.typography.fontWeight.black,
                          color:
                            p.points > 0
                              ? tokens.semantic.color.feedback.success.main
                              : "inherit",
                        }}
                      >
                        {p.points}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ p: tokens.semantic.spacing.xs / 16 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: tokens.typography.fontWeight.bold,
                          color:
                            parseFloat(p.ftPct) >= 80
                              ? tokens.semantic.color.feedback.success.main
                              : parseFloat(p.ftPct) <= 50 && p.fta > 0
                                ? tokens.semantic.color.feedback.error.main
                                : "inherit",
                        }}
                      >
                        {p.ftPct}%
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        p: tokens.semantic.spacing.xs / 16,
                        minWidth: 60,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: tokens.semantic.spacing.xs / 16,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={usage}
                          aria-label={`Usage for ${p.name}: ${Math.round(usage)}%`}
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: tokens.semantic.shape.radius.sm / 8,
                            bgcolor:
                              tokens.semantic.color.action.disabledBackground,
                            "& .MuiLinearProgress-bar": {
                              bgcolor:
                                usage > 30
                                  ? tokens.semantic.color.feedback.error.main
                                  : tokens.semantic.color.brand.primary.main,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.55rem" }}
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
          mt: tokens.semantic.spacing.md / 8,
          p: tokens.semantic.spacing.sm / 8,
          bgcolor: tokens.semantic.color.surface.subtle,
          borderRadius: tokens.semantic.shape.radius.sm / 8,
          border: `1px solid ${tokens.semantic.color.border.subtle}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.semantic.color.text.secondary,
            display: "block",
            mb: tokens.semantic.spacing.xs / 16,
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
                    color: tokens.semantic.color.feedback.warning.dark,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}
                >
                  ⚠️ High Usage: Play through #
                  {jerseyMap.get(highUsage.id.toString()) ?? "?"} or find
                  counter.
                </Typography>
              )}
              {poorFT && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: tokens.semantic.color.feedback.error.main,
                    fontWeight: tokens.typography.fontWeight.bold,
                  }}
                >
                  🚨 FT Risk: #{jerseyMap.get(poorFT.id.toString()) ?? "?"} is
                  a "Hack-a" target ({poorFT.ftPct}%).
                </Typography>
              )}
              {!highUsage && !poorFT && (
                <Typography
                  variant="caption"
                  sx={{
                    fontStyle: "italic",
                    color: tokens.semantic.color.text.secondary,
                  }}
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
