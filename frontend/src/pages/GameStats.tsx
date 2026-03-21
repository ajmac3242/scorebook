import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
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
import { calculatePlayerAggregates, getPlayerJersey } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
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

const OPPONENT_PLAYER_ID = "OPPONENT";

const GameStats: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

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
  const teamPlayers =
    useLiveQuery(
      () =>
        game?.teamId
          ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
          : Promise.resolve([]),
      [game?.teamId],
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

  const playerAggregates = useMemo(
    () => calculatePlayerAggregates(players, stats, teamPlayers),
    [players, stats, teamPlayers],
  );

  const filteredStats = useMemo(() => {
    return stats.filter(
      (s) =>
        (selectedPlayerId === "ALL" || s.playerId === selectedPlayerId) &&
        (selectedType === "ALL" || s.type === selectedType),
    );
  }, [stats, selectedPlayerId, selectedType]);

  const scoreFlowData = useMemo(() => {
    let teamScore = 0,
      opponentScore = 0;
    const sortedStats = [...stats].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const data = sortedStats
      .filter((s) => s.type === ACTION_TYPES.MAKE)
      .map((s) => {
        s.playerId === OPPONENT_PLAYER_ID
          ? (opponentScore += s.points || 0)
          : (teamScore += s.points || 0);
        return {
          time: new Date(s.timestamp).toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          Team: teamScore,
          Opponent: opponentScore,
        };
      });
    return [{ time: "00:00", Team: 0, Opponent: 0 }, ...data];
  }, [stats]);

  const oppData = useMemo(() => {
    const oppStats = stats.filter((s) => s.playerId === OPPONENT_PLAYER_ID);
    const makes = oppStats.filter((s) => s.type === ACTION_TYPES.MAKE);
    const attempts =
      makes.length +
      oppStats.filter((s) => s.type === ACTION_TYPES.MISS).length;
    return {
      points: makes.reduce((sum, s) => sum + (s.points || 0), 0),
      makes: makes.length,
      attempts,
      fgPct:
        attempts > 0 ? ((makes.length / attempts) * 100).toFixed(1) : "0.0",
      rebounds: oppStats.filter((s) => s.type === ACTION_TYPES.REBOUND).length,
      assists: oppStats.filter((s) => s.type === ACTION_TYPES.ASSIST).length,
      steals: oppStats.filter((s) => s.type === ACTION_TYPES.STEAL).length,
      turnovers: oppStats.filter((s) => s.type === ACTION_TYPES.TURNOVER)
        .length,
    };
  }, [stats]);

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date || ""} | ${game?.location || ""}`}
      />

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
        <TableContainer component={MoleskineCard}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                <TableCell>PLAYER</TableCell>
                <TableCell align="right">PTS</TableCell>
                <TableCell align="right">FG</TableCell>
                <TableCell align="right">FG%</TableCell>
                <TableCell align="right">REB</TableCell>
                <TableCell align="right">AST</TableCell>
                <TableCell align="right">STL</TableCell>
                <TableCell align="right">TO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {playerAggregates
                .filter(
                  (p) => p.attempts > 0 || p.rebounds > 0 || p.assists > 0,
                )
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          bgcolor: row.avatarColor,
                        }}
                      >
                        {row.jerseyNumber}
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
                <TableCell align="right">{oppData.points}</TableCell>
                <TableCell align="right">
                  {oppData.makes}-{oppData.attempts}
                </TableCell>
                <TableCell align="right">{oppData.fgPct}%</TableCell>
                <TableCell align="right">{oppData.rebounds}</TableCell>
                <TableCell align="right">{oppData.assists}</TableCell>
                <TableCell align="right">{oppData.steals}</TableCell>
                <TableCell align="right">{oppData.turnovers}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <MoleskineCard>
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
            </MoleskineCard>
          </Grid>
          <Grid item xs={12} lg={8}>
            <MoleskineCard sx={{ p: 1 }}>
              <BasketballCourt
                markers={filteredStats
                  .filter((s) => s.type === "MAKE" || s.type === "MISS")
                  .map((s) => ({
                    id: s.id,
                    x: s.locationX || 0,
                    y: s.locationY || 0,
                    type: s.type,
                    label:
                      s.playerId !== OPPONENT_PLAYER_ID
                        ? getPlayerJersey(s.playerId, teamPlayers)
                        : undefined,
                    playerId: s.playerId,
                  }))}
                onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
              />
            </MoleskineCard>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <MoleskineCard sx={{ p: 3, height: 400 }}>
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
        </MoleskineCard>
      )}
    </Box>
  );
};

export default GameStats;
