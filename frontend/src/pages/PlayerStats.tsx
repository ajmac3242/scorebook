import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const PlayerStats: React.FC = () => {
  const { playerId: playerIdParam } = useParams<{ playerId: string }>();
  const playerId = playerIdParam ? Number(playerIdParam) : undefined;
  const navigate = useNavigate();

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | string>("");
  const [selectedGameId, setSelectedGameId] = useState<number | string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const player = useLiveQuery(() => (playerId ? db.players.get(playerId) : Promise.resolve(undefined)), [playerId]);

  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];

  const teams = useLiveQuery(async () => {
    if (!selectedSeasonId) return [];
    return await db.teams.where("seasonId").equals(selectedSeasonId).toArray();
  }, [selectedSeasonId]) || [];

  const games = useLiveQuery(async () => {
    if (selectedGameId) {
      const game = await db.games.get(Number(selectedGameId));
      return game ? [game] : [];
    }
    if (teams.length > 0) {
      const teamIds = teams.map((t) => t.id).filter(Boolean) as number[];
      return await db.games.where("teamId").anyOf(teamIds).toArray();
    }
    return await db.games.toArray();
  }, [selectedGameId, teams]) || [];

  const allStats = useLiveQuery(async () => {
    if (playerId === undefined) return [];
    return await db.stats.where("playerId").equals(playerId).toArray();
  }, [playerId]) || [];

  const filteredStats = useMemo(() => {
    return allStats.filter((stat) => {
      const gId = typeof stat.gameId === "string" && !isNaN(Number(stat.gameId)) ? Number(stat.gameId) : stat.gameId;
      const selGId = typeof selectedGameId === "string" && !isNaN(Number(selectedGameId)) ? Number(selectedGameId) : selectedGameId;

      if (selectedGameId !== "" && gId !== selGId) return false;
      if (selectedType !== "" && stat.type !== selectedType) return false;

      if (selectedSeasonId !== "" && selectedGameId === "") {
        const game = games.find((g) => g.id === gId);
        if (!game) return false;
      }

      return true;
    });
  }, [allStats, selectedGameId, selectedType, selectedSeasonId, games]);

  const aggregates = useMemo(() => {
    const makes = filteredStats.filter(s => s.type === "MAKE");
    const misses = filteredStats.filter(s => s.type === "MISS");
    const attempts = makes.length + misses.length;

    return {
      points: makes.reduce((acc, s) => acc + (s.points || 0), 0),
      rebounds: filteredStats.filter(s => s.type === "REBOUND").length,
      assists: filteredStats.filter(s => s.type === "ASSIST").length,
      steals: filteredStats.filter(s => s.type === "STEAL").length,
      turnovers: filteredStats.filter(s => s.type === "TURNOVER").length,
      fgPct: attempts > 0 ? ((makes.length / attempts) * 100).toFixed(1) : "0.0",
      makes: makes.length,
      attempts
    };
  }, [filteredStats]);

  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <Card sx={{ bgcolor: "#FFFDF5", border: "1px solid #D1D1D1" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontFamily: "var(--serif)", mb: 3 }}>
        {player?.name} - Stats
      </Typography>

      <Paper className="moleskine-card" sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Season</InputLabel>
            <Select
              value={selectedSeasonId}
              label="Season"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSeasonId(isNaN(Number(val)) || val === "" ? val : Number(val));
                setSelectedGameId("");
              }}
            >
              <MenuItem value="">All Seasons</MenuItem>
              {seasons.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Game</InputLabel>
            <Select
              value={selectedGameId}
              label="Game"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGameId(isNaN(Number(val)) || val === "" ? val : Number(val));
              }}
            >
              <MenuItem value="">All Games</MenuItem>
              {games.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.opponent} ({g.date})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Action Type</InputLabel>
            <Select
              value={selectedType}
              label="Action Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="MAKE">Makes</MenuItem>
              <MenuItem value="MISS">Misses</MenuItem>
              <MenuItem value="REBOUND">Rebounds</MenuItem>
              <MenuItem value="ASSIST">Assists</MenuItem>
              <MenuItem value="STEAL">Steals</MenuItem>
              <MenuItem value="TURNOVER">Turnovers</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <StatCard label="Total Points" value={aggregates.points} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <StatCard label="FG%" value={`${aggregates.fgPct}%`} />
              <StatCard label="FG" value={`${aggregates.makes}/${aggregates.attempts}`} />
              <StatCard label="REB" value={aggregates.rebounds} />
              <StatCard label="AST" value={aggregates.assists} />
              <StatCard label="STL" value={aggregates.steals} />
              <StatCard label="TO" value={aggregates.turnovers} />
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper className="moleskine-card" sx={{ p: 1 }}>
            <Typography variant="subtitle2" align="center" gutterBottom>
              Shot Map / Activity Heat Map
            </Typography>
            <BasketballCourt
               markers={filteredStats.map(s => ({
                 id: s.id,
                 x: s.locationX || 0,
                 y: s.locationY || 0,
                 type: s.type
               }))}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} className="moleskine-card">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Game</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStats.slice().reverse().map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell>{new Date(stat.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                       {games.find(g => g.id === (typeof stat.gameId === "string" && !isNaN(Number(stat.gameId)) ? Number(stat.gameId) : stat.gameId))?.opponent || "Unknown"}
                    </TableCell>
                    <TableCell>{stat.type}</TableCell>
                    <TableCell>{stat.points || 0}</TableCell>
                  </TableRow>
                ))}
                {filteredStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No actions found for filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayerStats;
