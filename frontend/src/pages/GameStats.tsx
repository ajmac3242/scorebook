import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Chip,
  useTheme,
  Avatar,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS, ACTION_TYPES } from "../constants/stats";
const OPPONENT_PLAYER_ID = "OPPONENT";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GameStats: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get("gameId");
  const gameId = gameIdParam
    ? isNaN(Number(gameIdParam))
      ? gameIdParam
      : Number(gameIdParam)
    : undefined;

  const [tabValue, setTabValue] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as any)
        : Promise.resolve(undefined),
    [gameId],
  );

  const teamPlayers = useLiveQuery(
    () => (game?.teamId ? db.teamPlayers.where("teamId").equals(game.teamId.toString()).toArray() : Promise.resolve([])),
    [game?.teamId]
  ) || [];

  const players = useLiveQuery(() => db.players.toArray()) || [];

  const stats =
    useLiveQuery(
      () =>
        gameId !== undefined
          ? db.stats.where("gameId").equals(gameId).toArray()
          : Promise.resolve([]),
      [gameId],
    ) || [];

  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      if (selectedPlayerId !== "ALL" && s.playerId !== selectedPlayerId)
        return false;
      if (selectedType !== "ALL" && s.type !== selectedType) return false;
      return true;
    });
  }, [stats, selectedPlayerId, selectedType]);

  const playerAggregates = useMemo(() => {
    const agg: Record<string, any> = {};

    stats.forEach((s) => {
      const pId = s.playerId.toString();
      if (!agg[pId]) {
        agg[pId] = {
          id: s.playerId,
          name:
            pId === "OPPONENT"
              ? "Opponent"
              : players.find((p) => p.id === s.playerId)?.name || "Unknown",
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          turnovers: 0,
          makes: 0,
          attempts: 0,
        };
      }

      const p = agg[pId];
      if (s.type === ACTION_TYPES.MAKE) {
        p.points += s.points || 0;
        p.makes += 1;
        p.attempts += 1;
      } else if (s.type === ACTION_TYPES.MISS) {
        p.attempts += 1;
      } else if (s.type === ACTION_TYPES.REBOUND) {
        p.rebounds += 1;
      } else if (s.type === ACTION_TYPES.ASSIST) {
        p.assists += 1;
      } else if (s.type === ACTION_TYPES.STEAL) {
        p.steals += 1;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        p.turnovers += 1;
      }
    });

    return Object.values(agg).map((p) => ({
      ...p,
      fgPct: p.attempts > 0 ? ((p.makes / p.attempts) * 100).toFixed(1) : "0.0",
    }));
  }, [stats, players]);

  const scoreFlowData = useMemo(() => {
    let teamScore = 0;
    let opponentScore = 0;
    const sortedStats = [...stats].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const data = sortedStats
      .filter((s) => s.type === ACTION_TYPES.MAKE)
      .map((s) => {
        if (s.playerId === "OPPONENT") {
          opponentScore += s.points || 0;
        } else {
          teamScore += s.points || 0;
        }
        return {
          time: new Date(s.timestamp).toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          Team: teamScore,
          Opponent: opponentScore,
          lead: teamScore - opponentScore,
        };
      });

    return [{ time: "00:00", Team: 0, Opponent: 0, lead: 0 }, ...data];
  }, [stats]);

  const handleMarkerClick = (marker: any) => {
    setSelectedPlayerId(marker.playerId || "ALL");
  };

  const getPlayerJersey = (pId: number | string) => {
    const tp = teamPlayers.find(t => t.playerId.toString() === pId.toString());
    return tp?.jerseyNumber || "";
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontFamily: "var(--serif)", mb: 1 }}>
        {game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {game?.date} | {game?.location}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Box Score" />
          <Tab label="Shot Chart" />
          <Tab label="Score Flow" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TableContainer component={Paper} className="moleskine-card">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                    <TableCell>PLAYER</TableCell>
                    <TableCell align="right">{STAT_ACRONYMS.POINTS}</TableCell>
                    <TableCell align="right">
                      {STAT_ACRONYMS.FIELD_GOALS_MADE}-
                      {STAT_ACRONYMS.FIELD_GOALS_ATTEMPTED}
                    </TableCell>
                    <TableCell align="right">
                      {STAT_ACRONYMS.FIELD_GOAL_PERCENTAGE}
                    </TableCell>
                    <TableCell align="right">
                      {STAT_ACRONYMS.REBOUNDS}
                    </TableCell>
                    <TableCell align="right">{STAT_ACRONYMS.ASSISTS}</TableCell>
                    <TableCell align="right">{STAT_ACRONYMS.STEALS}</TableCell>
                    <TableCell align="right">
                      {STAT_ACRONYMS.TURNOVERS}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerAggregates
                    .filter((p) => p.id !== "OPPONENT")
                    .map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: players.find(p => p.id === row.id)?.avatarColor || 'grey.500' }}>
                            {getPlayerJersey(row.id)}
                          </Avatar>
                          {row.name}
                        </TableCell>
                        <TableCell align="right">{row.points}</TableCell>
                        <TableCell align="right">
                          {row.makes}-{row.attempts}
                        </TableCell>
                        <TableCell align="right">{row.fgPct}%</TableCell>
                        <TableCell align="right">{row.rebounds}</TableCell>
                        <TableCell align="right">{row.assists}</TableCell>
                        <TableCell align="right">{row.steals}</TableCell>
                        <TableCell align="right">{row.turnovers}</TableCell>
                      </TableRow>
                    ))}
                  <TableRow sx={{ bgcolor: "secondary.light" }}>
                    <TableCell sx={{ fontWeight: 700 }}>OPPONENT</TableCell>
                    {playerAggregates.find((p) => p.id === "OPPONENT") ? (
                      (() => {
                        const opp = playerAggregates.find(
                          (p) => p.id === "OPPONENT",
                        );
                        return (
                          <>
                            <TableCell align="right">{opp.points}</TableCell>
                            <TableCell align="right">
                              {opp.makes}-{opp.attempts}
                            </TableCell>
                            <TableCell align="right">{opp.fgPct}%</TableCell>
                            <TableCell align="right">{opp.rebounds}</TableCell>
                            <TableCell align="right">{opp.assists}</TableCell>
                            <TableCell align="right">{opp.steals}</TableCell>
                            <TableCell align="right">{opp.turnovers}</TableCell>
                          </>
                        );
                      })()
                    ) : (
                      <TableCell colSpan={7} align="center">
                        No opponent data
                      </TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Paper className="moleskine-card" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Filters
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Player</InputLabel>
                  <Select
                    value={selectedPlayerId}
                    label="Player"
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                  >
                    <MenuItem value="ALL">All Players</MenuItem>
                    {players.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <MenuItem value="ALL">All Shots</MenuItem>
                    <MenuItem value="MAKE">Makes</MenuItem>
                    <MenuItem value="MISS">Misses</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Paper className="moleskine-card" sx={{ p: 1 }}>
              <BasketballCourt
                markers={filteredStats
                  .filter(
                    (s) =>
                      s.type === ACTION_TYPES.MAKE ||
                      s.type === ACTION_TYPES.MISS,
                  )
                  .map((s) => ({
                    id: s.id,
                    x: s.locationX || 0,
                    y: s.locationY || 0,
                    type: s.type,
                    label: s.playerId !== OPPONENT_PLAYER_ID ? getPlayerJersey(s.playerId) : undefined,
                    playerId: s.playerId,
                  }))}
                onMarkerClick={handleMarkerClick}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Paper className="moleskine-card" sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom align="center">
            Score Flow
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="Team"
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="Opponent"
                stroke={theme.palette.secondary.main}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
};

export default GameStats;
