import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { calculateOpponentScoutingStats } from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { Groups as OpponentsIcon } from "@mui/icons-material";

const OpponentScoutingReport: React.FC = () => {
  const { opponentId } = useParams<{ opponentId: string }>();

  const opponent = useLiveQuery(
    () =>
      opponentId ? db.opponents.get(opponentId) : Promise.resolve(undefined),
    [opponentId],
  );

  const games = useLiveQuery(
    () =>
      opponentId
        ? db.games.where("opponentId").equals(opponentId).toArray()
        : Promise.resolve([]),
    [opponentId],
  );

  const gameIds = useMemo(
    () => (games?.map((g) => g.id).filter(Boolean) as string[]) || [],
    [games],
  );

  const stats = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats.where("gameId").anyOf(gameIds).toArray()
        : Promise.resolve([]),
    [gameIds],
  );

  const scoutingStats = useMemo(() => {
    if (!stats) return new Map();
    return calculateOpponentScoutingStats(stats);
  }, [stats]);

  const sortedPlayers = useMemo(() => {
    return Array.from(scoutingStats.entries()).sort(
      (a, b) => b[1].points - a[1].points,
    );
  }, [scoutingStats]);

  return (
    <Box sx={{ pb: 4 }}>
      <EntityBanner
        title={opponent?.name || "Opponent Scouting"}
        icon={<OpponentsIcon />}
        subtitle={`Historical Scouting Report | ${games?.length || 0} Games Tracked`}
        avatarSrc={opponent?.logoUrl}
        backTo="/teams" // Assuming this is where users come from
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <MoleskineCard>
            <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
              Player Scouting (Cumulative)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Jersey</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      PTS
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      FG%
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      PPP
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      REB
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      AST
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      STL
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      BLK
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      TO
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedPlayers.map(([pId, agg]) => (
                    <TableRow key={pId}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.75rem",
                              bgcolor: "secondary.main",
                            }}
                          >
                            {pId.split(":")[1] || "??"}
                          </Avatar>
                          #{pId.split(":")[1] || "??"}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{agg.points}</TableCell>
                      <TableCell align="right">{agg.fgPct}%</TableCell>
                      <TableCell align="right">{agg.ppp}</TableCell>
                      <TableCell align="right">{agg.rebounds}</TableCell>
                      <TableCell align="right">{agg.assists}</TableCell>
                      <TableCell align="right">{agg.steals}</TableCell>
                      <TableCell align="right">{agg.blocks}</TableCell>
                      <TableCell align="right">{agg.turnovers}</TableCell>
                    </TableRow>
                  ))}
                  {sortedPlayers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        No opponent players tracked for this team yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OpponentScoutingReport;
