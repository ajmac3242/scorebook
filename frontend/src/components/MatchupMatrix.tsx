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
  jerseyMap: Map<string, string | undefined>;
}

export const MatchupMatrix: React.FC<MatchupMatrixProps> = ({
  teamActiveIds,
  oppActiveIds,
  matchupData,
  jerseyMap,
}) => {
  const getCellData = (tId: string, oId: string) => {
    return matchupData.find(
      (m) => m.teamPlayerId === tId && m.oppPlayerId === oId,
    );
  };

  const getCellColor = (stopPct: number, possessions: number) => {
    if (possessions < 3) return "rgba(0,0,0,0.05)";
    if (stopPct >= 70) return "rgba(76, 175, 80, 0.2)"; // Green
    if (stopPct <= 40) return "rgba(244, 67, 54, 0.2)"; // Red
    return "rgba(255, 152, 0, 0.1)"; // Orange
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          mb: 1,
          display: "block",
          textTransform: "uppercase",
        }}
      >
        Holistic Matchup Efficiency (Stop %)
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: "rgba(0,0,0,0.02)",
                  fontWeight: 800,
                  fontSize: "0.6rem",
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
                    fontWeight: 800,
                    fontSize: "0.6rem",
                    bgcolor: "rgba(0,0,0,0.02)",
                  }}
                >
                  #{jerseyMap.get(tId) || "??"}
                </TableCell>
                {oppActiveIds.map((oId) => {
                  const data = getCellData(tId, oId);
                  return (
                    <Tooltip
                      key={`${tId}-${oId}`}
                      title={
                        data
                          ? `${data.stopPct}% Stop Rate over ${data.possessions} possessions`
                          : "No data"
                      }
                    >
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: data
                            ? getCellColor(data.stopPct, data.possessions)
                            : "transparent",
                          cursor: "help",
                        }}
                      >
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
