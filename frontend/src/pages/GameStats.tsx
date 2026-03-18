import React, { useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  Chip,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const GameStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get("gameId");
  const gameId = gameIdParam ? (isNaN(Number(gameIdParam)) ? gameIdParam : Number(gameIdParam)) : undefined;
  const navigate = useNavigate();

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const game = useLiveQuery(() => (gameId !== undefined ? db.games.get(gameId as any) : Promise.resolve(undefined)), [gameId]);

  const players = useLiveQuery(() => db.players.toArray()) || [];

  const stats = useLiveQuery(() =>
    gameId !== undefined ? db.stats.where("gameId").equals(gameId).toArray() : Promise.resolve([]),
  [gameId]) || [];

  const filteredStats = useMemo(() => {
    return stats.filter(s => {
      if (selectedPlayerId !== "ALL" && s.playerId !== selectedPlayerId) return false;
      if (selectedType !== "ALL" && s.type !== selectedType) return false;
      return true;
    });
  }, [stats, selectedPlayerId, selectedType]);

  const playerAggregates = useMemo(() => {
    const agg: Record<string, any> = {};

    stats.forEach(s => {
      const pId = s.playerId.toString();
      if (!agg[pId]) {
        agg[pId] = {
          id: s.playerId,
          name: players.find(p => p.id === s.playerId)?.name || "Unknown",
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          turnovers: 0,
          makes: 0,
          attempts: 0
        };
      }

      const p = agg[pId];
      if (s.type === "MAKE") {
        p.points += (s.points || 0);
        p.makes += 1;
        p.attempts += 1;
      } else if (s.type === "MISS") {
        p.attempts += 1;
      } else if (s.type === "REBOUND") {
        p.rebounds += 1;
      } else if (s.type === "ASSIST") {
        p.assists += 1;
      } else if (s.type === "STEAL") {
        p.steals += 1;
      } else if (s.type === "TURNOVER") {
        p.turnovers += 1;
      }
    });

    return Object.values(agg);
  }, [stats, players]);

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontFamily: "var(--serif)", mb: 1 }}>
        Game Stats
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        vs {game?.opponent} ({game?.date})
      </Typography>

      <Paper className="moleskine-card" sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Player</InputLabel>
            <Select
              value={selectedPlayerId}
              label="Filter by Player"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPlayerId(isNaN(Number(val)) || val === "" ? val : Number(val));
              }}
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
            <InputLabel>Action Type</InputLabel>
            <Select
              value={selectedType}
              label="Action Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="ALL">All Actions</MenuItem>
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
        <Grid item xs={12} lg={7}>
          <Paper className="moleskine-card" sx={{ p: 1 }}>
            <Typography variant="subtitle2" align="center" gutterBottom>
              Game Heat Map
            </Typography>
            <BasketballCourt
              markers={filteredStats.map(s => ({
                id: s.id,
                x: s.locationX || 0,
                y: s.locationY || 0,
                type: s.type,
                label: players.find(p => p.id === s.playerId)?.defaultNumber
              }))}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
            Box Score
          </Typography>
          <TableContainer component={Paper} className="moleskine-card">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">PTS</TableCell>
                  <TableCell align="right">FG</TableCell>
                  <TableCell align="right">REB</TableCell>
                  <TableCell align="right">AST</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playerAggregates.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell align="right">{row.points}</TableCell>
                    <TableCell align="right">{row.makes}/{row.attempts}</TableCell>
                    <TableCell align="right">{row.rebounds}</TableCell>
                    <TableCell align="right">{row.assists}</TableCell>
                  </TableRow>
                ))}
                {playerAggregates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No stats recorded for this game.</TableCell>
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

export default GameStats;
