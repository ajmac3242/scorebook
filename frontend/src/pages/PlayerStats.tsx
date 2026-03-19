import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  Avatar,
  Divider,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const PlayerStats: React.FC = () => {
  const { playerId: playerIdParam } = useParams<{ playerId: string }>();
  const playerId = playerIdParam ? Number(playerIdParam) : undefined;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teamIdParam = searchParams.get("teamId");
  const seasonIdParam = searchParams.get("seasonId");

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | string>(
    seasonIdParam
      ? isNaN(Number(seasonIdParam))
        ? seasonIdParam
        : Number(seasonIdParam)
      : "",
  );
  const [selectedGameId, setSelectedGameId] = useState<number | string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const player = useLiveQuery(
    () => (playerId ? db.players.get(playerId) : Promise.resolve(undefined)),
    [playerId],
  );

  const teamPlayers =
    useLiveQuery(
      () =>
        playerId
          ? db.teamPlayers
              .where("playerId")
              .equals(playerId.toString())
              .toArray()
          : Promise.resolve([]),
      [playerId],
    ) || [];

  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];

  const teams =
    useLiveQuery(async () => {
      if (!selectedSeasonId) return [];
      return await db.teams
        .where("seasonId")
        .equals(selectedSeasonId.toString())
        .toArray();
    }, [selectedSeasonId]) || [];

  const games =
    useLiveQuery(async () => {
      if (selectedGameId) {
        const game = await db.games.get(Number(selectedGameId));
        return game ? [game] : [];
      }
      if (teams.length > 0) {
        const teamIds = teams
          .map((t) => t.id?.toString())
          .filter(Boolean) as string[];
        return await db.games.where("teamId").anyOf(teamIds).toArray();
      }
      return await db.games.toArray();
    }, [selectedGameId, teams]) || [];

  const allStats =
    useLiveQuery(async () => {
      if (playerId === undefined) return [];
      return await db.stats.where("playerId").equals(playerId).toArray();
    }, [playerId]) || [];

  const filteredStats = useMemo(() => {
    return allStats.filter((stat) => {
      const gId =
        typeof stat.gameId === "string" && !isNaN(Number(stat.gameId))
          ? Number(stat.gameId)
          : stat.gameId;
      const selGId =
        typeof selectedGameId === "string" && !isNaN(Number(selectedGameId))
          ? Number(selectedGameId)
          : selectedGameId;

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
    const makes = filteredStats.filter((s) => s.type === "MAKE");
    const misses = filteredStats.filter((s) => s.type === "MISS");
    const attempts = makes.length + misses.length;

    return {
      points: makes.reduce((acc, s) => acc + (s.points || 0), 0),
      rebounds: filteredStats.filter((s) => s.type === "REBOUND").length,
      assists: filteredStats.filter((s) => s.type === "ASSIST").length,
      steals: filteredStats.filter((s) => s.type === "STEAL").length,
      turnovers: filteredStats.filter((s) => s.type === "TURNOVER").length,
      fgPct:
        attempts > 0 ? ((makes.length / attempts) * 100).toFixed(1) : "0.0",
      makes: makes.length,
      attempts,
    };
  }, [filteredStats]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getJerseyNumber = () => {
    if (teamIdParam) {
      const tp = teamPlayers.find(
        (t) => t.teamId.toString() === teamIdParam.toString(),
      );
      if (tp) return tp.jerseyNumber;
    }
    return "";
  };

  const StatCard = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: player?.avatarColor || "grey.500",
              fontSize: "2rem",
              fontFamily: "var(--serif)",
            }}
          >
            {player ? getInitials(player.name) : ""}
          </Avatar>
          {getJerseyNumber() && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                bgcolor: "var(--midnight)",
                color: "white",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: "bold",
                border: "2px solid white",
              }}
            >
              {getJerseyNumber()}
            </Box>
          )}
        </Box>
        <Box>
          <Typography
            variant="h3"
            sx={{ fontFamily: "var(--serif)", fontWeight: 700 }}
          >
            {player?.name}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {teamIdParam
              ? teams.find((t) => t.id?.toString() === teamIdParam.toString())
                  ?.name
              : "Player Career Stats"}
          </Typography>
        </Box>
      </Box>

      <Paper className="moleskine-card" sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Season</InputLabel>
            <Select
              value={selectedSeasonId}
              label="Season"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSeasonId(val);
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
                setSelectedGameId(
                  isNaN(Number(val)) || val === "" ? val : Number(val),
                );
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
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <StatCard label="FG%" value={`${aggregates.fgPct}%`} />
              <StatCard
                label="FG"
                value={`${aggregates.makes}/${aggregates.attempts}`}
              />
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
              markers={filteredStats.map((s) => ({
                id: s.id,
                x: s.locationX || 0,
                y: s.locationY || 0,
                type: s.type,
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
                {filteredStats
                  .slice()
                  .reverse()
                  .map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        {new Date(stat.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {games.find(
                          (g) =>
                            g.id ===
                            (typeof stat.gameId === "string" &&
                            !isNaN(Number(stat.gameId))
                              ? Number(stat.gameId)
                              : stat.gameId),
                        )?.opponent || "Unknown"}
                      </TableCell>
                      <TableCell>{stat.type}</TableCell>
                      <TableCell>{stat.points || 0}</TableCell>
                    </TableRow>
                  ))}
                {filteredStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No actions found for filters.
                    </TableCell>
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
