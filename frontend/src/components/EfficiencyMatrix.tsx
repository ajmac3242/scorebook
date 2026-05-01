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
  Paper,
  Tooltip,
} from "@mui/material";
import { Player } from "../db";
import { MatchupStats } from "../utils/stats/types";

interface EfficiencyMatrixProps {
  ourPlayers: Player[];
  opponents: Player[];
  matchups: MatchupStats[];
  onAssign: (_ourId: string, _oppId: string) => void;
  jerseyMap: Map<string, string>;
  getInitials: (_name: string) => string;
}

export const EfficiencyMatrix: React.FC<EfficiencyMatrixProps> = React.memo(
  ({ ourPlayers, opponents, matchups, onAssign, jerseyMap, getInitials }) => {
    const getEfficiency = (_ourId: string, _oppId: string) => {
      const m = matchups.find(
        (ms) =>
          ms.ourPlayerId === _ourId &&
          ms.opponentPlayerId === _oppId &&
          !ms.isOpponentDefender,
      );
      return m ? parseFloat(m.stopPct) : null;
    };

    const getColor = (eff: number | null) => {
      if (eff === null) return "rgba(0,0,0,0.05)";
      if (eff > 60) return "rgba(76, 175, 80, 0.2)"; // Green
      if (eff < 40) return "rgba(244, 67, 54, 0.2)"; // Red
      return "rgba(255, 193, 7, 0.2)"; // Yellow/Grayish
    };

    return (
      <TableContainer component={Paper} sx={{ mt: 2, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>DEF \ OFF</TableCell>
              {opponents.map((opp) => (
                <TableCell key={opp.id} align="center" sx={{ fontWeight: 800 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: "0.7rem",
                        bgcolor: "secondary.main",
                        mb: 0.5,
                      }}
                    >
                      {opp.id?.split(":")[1] || "??"}
                    </Avatar>
                    <Typography variant="caption">
                      #{opp.id?.split(":")[1] || "??"}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ourPlayers.map((our) => (
              <TableRow key={our.id}>
                <TableCell sx={{ fontWeight: 800 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.7rem" }}>
                      {jerseyMap.get(our.id!) || getInitials(our.name)}
                    </Avatar>
                    <Typography variant="caption">
                      {our.name.split(" ")[0]}
                    </Typography>
                  </Box>
                </TableCell>
                {opponents.map((opp) => {
                  const eff = getEfficiency(our.id!, opp.id!);
                  return (
                    <Tooltip
                      key={opp.id}
                      title={eff !== null ? `Stop %: ${eff}%` : "No data"}
                      arrow
                    >
                      <TableCell
                        align="center"
                        onClick={() => onAssign(our.id!, opp.id!)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: getColor(eff),
                          "&:hover": { filter: "brightness(0.9)" },
                          fontWeight: 700,
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        {eff !== null ? `${Math.round(eff)}%` : "-"}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
);
