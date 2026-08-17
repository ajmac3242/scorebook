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
  Paper,
  Tooltip,
} from "@mui/material";
import { Star } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

interface MatchupData {
  teamPlayerId: string;
  teamPlayerJersey: string;
  oppPlayerId: string;
  oppPlayerJersey: string;
  stopPct: number;
  possessions: number;
}

interface MatchupMatrixProps {
  teamActiveIds: string[];
  oppActiveIds: string[];
  matchupData: MatchupData[];
  archetypeEfficiency?: Record<string, Record<string, number>>;
  oppMostFrequentPlayType?: Record<string, string>;
  jerseyMap: Map<string, string | undefined>;
  currentMatchups?: Record<string, string>;
  onReassign?: (_oppPlayerId: string, _teamPlayerId: string) => void;
}

export const MatchupMatrix: React.FC<MatchupMatrixProps> = ({
  teamActiveIds,
  oppActiveIds,
  matchupData,
  archetypeEfficiency = {},
  oppMostFrequentPlayType = {},
  jerseyMap,
  currentMatchups = {},
  onReassign,
}) => {
  const tokens = useTokens();

  const getCellData = (tId: string, oId: string) => {
    return matchupData.find(
      (m) => m.teamPlayerId === tId && m.oppPlayerId === oId,
    );
  };

  const getCellColor = (
    stopPct: number,
    possessions: number,
    isAssigned: boolean,
  ) => {
    if (isAssigned) return tokens.semantic.color.brand.primary.light;
    if (possessions < 3) return tokens.semantic.color.surface.subtle;
    if (stopPct >= 70) return tokens.semantic.color.feedback.success.light;
    if (stopPct <= 40) return tokens.semantic.color.feedback.error.light;
    return tokens.semantic.color.feedback.warning.light;
  };

  return (
    <Box sx={{ mt: tokens.semantic.spacing.md / 8 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          mb: tokens.spacing[1] / 8,
          display: "block",
          textTransform: "uppercase",
          color: tokens.semantic.color.text.secondary,
          letterSpacing: tokens.typography.letterSpacing.wider,
        }}
      >
        Holistic Matchup Efficiency (Stop %)
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: `${tokens.semantic.shape.radius.md}px` }}
      >
        <Table size="small" aria-label="Matchup Efficiency Matrix">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: tokens.semantic.color.surface.subtle,
                  fontWeight: tokens.typography.fontWeight.bold,
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.semantic.color.text.secondary,
                }}
              >
                US \ OPP
              </TableCell>
              {oppActiveIds.map((oId) => (
                <TableCell
                  key={oId}
                  align="center"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.black,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  #{oId.includes(":") ? oId.split(":")[1] : "??"}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {teamActiveIds.map((tId) => {
              const teamJersey = jerseyMap.get(tId) ?? "??";

              return (
                <TableRow key={tId}>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.xs,
                      bgcolor: tokens.semantic.color.surface.subtle,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    #{teamJersey}
                  </TableCell>
                  {oppActiveIds.map((oId) => {
                    const data = getCellData(tId, oId);
                    const isAssigned = currentMatchups[oId] === tId;

                    // Archetype Advisor Logic: Recommend if this player is the best against the opponent's frequent play type
                    const frequentPlayType = oppMostFrequentPlayType[oId];
                    let isRecommended = false;
                    if (frequentPlayType) {
                      const myEff =
                        archetypeEfficiency[tId]?.[frequentPlayType] || 0;
                      if (myEff >= 60) {
                        // Check if anyone else is better
                        const othersEff = teamActiveIds
                          .filter((id) => id !== tId)
                          .map(
                            (id) =>
                              archetypeEfficiency[id]?.[frequentPlayType] || 0,
                          );
                        if (myEff >= Math.max(...othersEff, 50)) {
                          isRecommended = true;
                        }
                      }
                    }

                    const oppJersey = oId.split(":")[1] ?? "??";

                    return (
                      <Tooltip
                        key={`${tId}-${oId}`}
                        title={
                          <Box sx={{ p: tokens.spacing[0.5] / 8 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                fontWeight: tokens.typography.fontWeight.bold,
                              }}
                            >
                              {data
                                ? `${data.stopPct}% Stop Rate over ${data.possessions} possessions.`
                                : "No matchup data."}
                            </Typography>
                            {isRecommended && (
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: tokens.spacing[0.5] / 8,
                                  display: "block",
                                  color:
                                    tokens.semantic.color.feedback.warning.main,
                                  fontWeight:
                                    tokens.typography.fontWeight.black,
                                }}
                              >
                                ⭐ Best Personnel Counter for {frequentPlayType}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                mt: tokens.spacing[0.5] / 8,
                                display: "block",
                                fontStyle: "italic",
                                opacity: 0.8,
                              }}
                            >
                              Click to assign.
                            </Typography>
                          </Box>
                        }
                      >
                        <TableCell
                          align="center"
                          onClick={() => {
                            if (onReassign) onReassign(oId, tId);
                          }}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (
                              onReassign &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              onReassign(oId, tId);
                            }
                          }}
                          role="button"
                          aria-label={
                            data
                              ? `Matchup: US #${teamJersey} vs OPP #${oppJersey}. Stop Rate: ${data.stopPct}%. ${isAssigned ? "Currently assigned." : "Click to assign."}`
                              : `No matchup data for US #${teamJersey} vs OPP #${oppJersey}. Click to assign.`
                          }
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: tokens.typography.fontWeight.bold,
                            bgcolor: getCellColor(
                              data?.stopPct || 0,
                              data?.possessions || 0,
                              isAssigned,
                            ),
                            cursor: "pointer",
                            border: isAssigned
                              ? `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.brand.primary.main}`
                              : "none",
                            position: "relative",
                            transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
                            "&:hover": {
                              filter: "brightness(0.95)",
                            },
                            "&:focus-visible": {
                              outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
                              outlineOffset: -tokens.semantic.focus.offset,
                              zIndex: 1,
                            },
                          }}
                        >
                          {isRecommended && (
                            <Star
                              sx={{
                                position: "absolute",
                                top: tokens.spacing.px,
                                right: tokens.spacing.px,
                                fontSize: 10,
                                color:
                                  tokens.semantic.color.feedback.warning.main,
                              }}
                            />
                          )}
                          {data ? `${data.stopPct}%` : "-"}
                        </TableCell>
                      </Tooltip>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
