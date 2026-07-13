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
import { SurfaceCard } from "../components/cards/SurfaceCard";
import EntityBanner from "../components/EntityBanner";
import { useTokens } from "../theme/useTokens";

const OpponentScoutingReport: React.FC = () => {
  const tokens = useTokens();
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
    <Box sx={{ pb: tokens.semantic.spacing.xl / 8 }}>
      <EntityBanner
        title={opponent?.name || "Opponent Scouting"}
        subtitle={`Historical Scouting Report | ${games?.length || 0} Games Tracked`}
        avatarSrc={opponent?.logoUrl}
        backTo="/teams"
      />

      <Grid
        container
        spacing={tokens.semantic.spacing.md / 8}
        sx={{ mt: tokens.semantic.spacing.sm / 8 }}
      >
        <Grid size={{ xs: 12 }}>
          <SurfaceCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: tokens.typography.fontFamily.accent,
                mb: tokens.semantic.spacing.sm / 8,
              }}
            >
              Player Scouting (Cumulative)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: tokens.semantic.color.action.hover }}
                  >
                    <TableCell
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      Jersey
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      PTS
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      FG%
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      PPP
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      REB
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      AST
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      STL
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      BLK
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      TO
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedPlayers.map(([pId, agg]) => (
                    <TableRow key={pId}>
                      <TableCell
                        sx={{
                          fontWeight: tokens.typography.fontWeight.semibold,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: tokens.semantic.spacing.xs / 8,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: tokens.typography.fontSize.xs,
                              bgcolor:
                                tokens.semantic.color.brand.secondary.main,
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
                </TableBody>
              </Table>
            </TableContainer>
          </SurfaceCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OpponentScoutingReport;
