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
    if (isAssigned) return "var(--cs-semantic-color-brand-primary-light)";
    if (possessions < 3) return "var(--cs-semantic-color-surface-subtle)";
    if (stopPct >= 70) return "var(--cs-semantic-color-feedback-success-light)";
    if (stopPct <= 40) return "var(--cs-semantic-color-feedback-error-light)";
    return "var(--cs-semantic-color-feedback-warning-light)";
  };

  return (
    <Box sx={{ mt: "var(--cs-semantic-spacing-md)" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          mb: 1,
          display: "block",
          textTransform: "uppercase",
          color: "var(--cs-semantic-color-text-secondary)",
          letterSpacing: "var(--cs-typography-letterSpacing-wider)",
        }}
      >
        Holistic Matchup Efficiency (Stop %)
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: "var(--cs-semantic-shape-radius-md)" }}
      >
        <Table size="small" aria-label="Matchup Efficiency Matrix">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  fontSize: "0.6rem",
                  color: "var(--cs-semantic-color-text-secondary)",
                }}
              >
                US \ OPP
              </TableCell>
              {oppActiveIds.map((oId) => (
                <TableCell
                  key={oId}
                  align="center"
                  sx={{ fontWeight: 800, fontSize: "0.6rem" }}
                >
                  #{oId.includes(":") ? oId.split(":")[1] : "??"}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {teamActiveIds.map((tId) => (
              <TableRow key={tId}>
                <TableCell
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    fontSize: "0.6rem",
                    bgcolor: "var(--cs-semantic-color-surface-subtle)",
                    color: "var(--cs-semantic-color-text-secondary)",
                  }}
                >
                  #{jerseyMap.get(tId) || "??"}
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

                  return (
                    <Tooltip
                      key={`${tId}-${oId}`}
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
                            {data
                              ? `${data.stopPct}% Stop Rate over ${data.possessions} possessions.`
                              : "No matchup data."}
                          </Typography>
                          {isRecommended && (
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                display: "block",
                                color: "var(--cs-semantic-color-feedback-warning-main)",
                                fontWeight: 800,
                              }}
                            >
                              ⭐ Best Personnel Counter for {frequentPlayType}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            sx={{ mt: 0.5, display: "block", fontStyle: "italic", opacity: 0.8 }}
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
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: getCellColor(
                            data?.stopPct || 0,
                            data?.possessions || 0,
                            isAssigned,
                          ),
                          cursor: "pointer",
                          border: isAssigned
                            ? "2px solid var(--cs-semantic-color-brand-primary-main)"
                            : "none",
                          position: "relative",
                          transition: "all var(--cs-motion-duration-fast) var(--cs-motion-easing-productive)",
                          "&:hover": {
                            filter: "brightness(0.95)",
                          },
                        }}
                      >
                        {isRecommended && (
                          <Star
                            sx={{
                              position: "absolute",
                              top: 1,
                              right: 1,
                              fontSize: 10,
                              color: "var(--cs-semantic-color-feedback-warning-main)",
                            }}
                          />
                        )}
                        {data ? `${data.stopPct}%` : "-"}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
