import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  DialogContentText,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Warning,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS, ACTION_TYPES } from "../constants/stats";
import { calculatePlayerAggregates, getPlayerJersey } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import { syncService } from "../utils/syncService";
import dayjs from "dayjs";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as any)
        : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const season = useLiveQuery(
    () =>
      team?.seasonId
        ? db.seasons.get(team.seasonId)
        : Promise.resolve(undefined),
    [team?.seasonId],
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
  const allStats =
    useLiveQuery(
      () =>
        gameId !== undefined
          ? db.stats.where("gameId").equals(gameId).toArray()
          : Promise.resolve([]),
      [gameId],
    ) || [];

  useEffect(() => {
    if (game?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(game.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game?.deletedAt]);

  const stats = useMemo(() => {
    if (periodFilter === "ALL") return allStats;
    return allStats.filter((s) => s.period === parseInt(periodFilter));
  }, [allStats, periodFilter]);

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

  const handleDeleteGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      syncService.pushUpdates();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete game:", err);
    }
  };

  const handleRestoreGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, { deletedAt: undefined, synced: 0 });
      syncService.pushUpdates();
    } catch (err) {
      console.error("Failed to restore game:", err);
    }
  };

  const periodLabel = season?.periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = season?.periodType === "HALVES" ? 2 : 4;
  const periods = useMemo(() => {
    const p = ["ALL"];
    for (let i = 1; i <= maxPeriod; i++) p.push(i.toString());
    // Check for OT
    const otPeriods = Array.from(new Set(allStats.map((s) => s.period)))
      .filter((periodNum) => periodNum > maxPeriod)
      .sort((a, b) => a - b);
    otPeriods.forEach((periodNum) => p.push(periodNum.toString()));
    return p;
  }, [maxPeriod, allStats]);

  const boxScoreTable = (
    <TableContainer>
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
            .filter((p) => p.attempts > 0 || p.rebounds > 0 || p.assists > 0)
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
  );

  const shotChartFilters = (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Filters
      </Typography>
      <Stack direction="row" spacing={2}>
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
    </Box>
  );

  const shotChartCourt = (
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
  );

  const scoreFlowChart = (
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
  );

  const isDeleted =
    !!game?.deletedAt || !!team?.deletedAt || !!season?.deletedAt;

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <PageHeader
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date || ""} | ${game?.location || ""}`}
        showBack
        actions={
          <Stack direction="row" spacing={1} justifyContent="center">
            {!isDeleted ? (
              <Button
                startIcon={<Delete />}
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Game
              </Button>
            ) : game?.deletedAt && !team?.deletedAt && !season?.deletedAt ? (
              <Button
                startIcon={<Restore />}
                variant="contained"
                color="success"
                onClick={handleRestoreGame}
              >
                Restore Game
              </Button>
            ) : null}
          </Stack>
        }
      />

      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4 }}>
          <AlertTitle>Read Only Mode</AlertTitle>
          {game?.deletedAt
            ? `This game is scheduled for deletion in ${timeLeft}.`
            : "The associated team or season is pending deletion."}
        </Alert>
      )}

      <Box
        sx={{
          mb: 4,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {periods.map((p) => (
          <Chip
            key={p}
            label={p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}
            onClick={() => setPeriodFilter(p)}
            color={periodFilter === p ? "primary" : "default"}
            variant={periodFilter === p ? "filled" : "outlined"}
          />
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Box Score Card */}
        <Grid item xs={12}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Box Score{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton onClick={() => setExpandedSection("boxScore")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            {boxScoreTable}
          </MoleskineCard>
        </Grid>

        {/* Shot Chart Card */}
        <Grid item xs={12} md={6}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Shot Chart{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton onClick={() => setExpandedSection("shotChart")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            {shotChartFilters}
            <Box sx={{ p: 1 }}>{shotChartCourt}</Box>
          </MoleskineCard>
        </Grid>

        {/* Score Flow Card */}
        <Grid item xs={12} md={6}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Score Flow{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton onClick={() => setExpandedSection("scoreFlow")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 400 }}>{scoreFlowChart}</Box>
          </MoleskineCard>
        </Grid>
      </Grid>

      {/* Expanded Section Dialog */}
      <Dialog
        fullWidth
        maxWidth="lg"
        open={expandedSection !== null}
        onClose={() => setExpandedSection(null)}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--serif)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {expandedSection === "boxScore" && "Box Score"}
          {expandedSection === "shotChart" && "Shot Chart"}
          {expandedSection === "scoreFlow" && "Score Flow"}
          <IconButton onClick={() => setExpandedSection(null)}>
            <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {expandedSection === "boxScore" && boxScoreTable}
          {expandedSection === "shotChart" && (
            <>
              {shotChartFilters}
              <Box sx={{ p: 1, maxWidth: 800, mx: "auto" }}>
                {shotChartCourt}
              </Box>
            </>
          )}
          {expandedSection === "scoreFlow" && (
            <Box sx={{ height: 500 }}>{scoreFlowChart}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedSection(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Delete Game?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this game? You will have 24 hours to
            restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
