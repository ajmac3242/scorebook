import React, { useState, useMemo, useEffect } from "react";
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Warning,
  Edit as EditIcon,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES } from "../constants/stats";
import { calculatePlayerAggregates, getPlayerJersey } from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
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

/**
 * GameStats page component.
 * Displays detailed box score, shot charts, and score flow for a specific game.
 */
const GameStats: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as string)
        : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamPlayersResult = useLiveQuery(
    () =>
      game?.teamId
        ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
        : Promise.resolve([]),
    [game?.teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersResult || [],
    [teamPlayersResult],
  );

  const playersResult = useLiveQuery(() => db.players.toArray());
  const players = useMemo(() => playersResult || [], [playersResult]);

  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent || "");
      setEditDate(game.date || "");
      setEditLocation(game.location || "");
      setEditOpponentLogoUrl(game.opponentLogoUrl || "");
    }
  }, [game]);

  const allStatsResult = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.stats.where("gameId").equals(gameId).toArray()
        : Promise.resolve([]),
    [gameId],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

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

  // Filter stats based on the selected period (Quarter/Half)
  const stats = useMemo(() => {
    if (periodFilter === "ALL") return allStats;
    return allStats.filter((s) => s.period === parseInt(periodFilter));
  }, [allStats, periodFilter]);

  const playerAggregates = useMemo(() => {
    // Only include players who are assigned to this team
    const teamPlayerIds = new Set(teamPlayers.map((tp) => tp.playerId));
    const rosteredPlayers = players.filter((p) => teamPlayerIds.has(p.id!));
    return calculatePlayerAggregates(rosteredPlayers, stats, teamPlayers);
  }, [players, stats, teamPlayers]);

  const filteredStats = useMemo(() => {
    return stats.filter(
      (s) =>
        (selectedPlayerId === "ALL" || s.playerId === selectedPlayerId) &&
        (selectedType === "ALL" || s.type === selectedType),
    );
  }, [stats, selectedPlayerId, selectedType]);

  const scoreFlowData = useMemo(() => {
    let tScore = 0;
    let oScore = 0;
    const sortedStats = [...stats].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
    const resultArr = [{ time: "00:00", Team: 0, Opponent: 0 }];
    sortedStats
      .filter((s) => s.type === ACTION_TYPES.MAKE)
      .forEach((s) => {
        if (s.playerId === OPPONENT_PLAYER_ID) {
          oScore += s.points || 0;
        } else {
          tScore += s.points || 0;
        }
        resultArr.push({
          time: new Date(s.timestamp).toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          Team: tScore,
          Opponent: oScore,
        });
      });
    return resultArr;
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

  const handleUpdateGame = async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, {
        opponent: editOpponent,
        date: editDate,
        location: editLocation,
        opponentLogoUrl: editOpponentLogoUrl,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpenEditDialog(false);
    } catch (err) {
      console.error("Failed to update game:", err);
    }
  };

  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = team?.periodType === "HALVES" ? 2 : 4;
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
    <TableContainer
      sx={{
        mx: { xs: -2, sm: 0 },
        width: { xs: "calc(100% + 32px)", sm: "100%" },
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableCell sx={{ minWidth: 100 }}>PLAYER</TableCell>
            <TableCell align="right">PTS</TableCell>
            <TableCell align="right">FG</TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              FG%
            </TableCell>
            <TableCell align="right">REB</TableCell>
            <TableCell align="right">AST</TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              STL
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              TO
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {playerAggregates.map((row) => (
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
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {row.name}
                </Typography>
              </TableCell>
              <TableCell align="right">{row.points}</TableCell>
              <TableCell align="right">
                {row.makes}-{row.attempts}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {row.fgPct}%
              </TableCell>
              <TableCell align="right">{row.rebounds}</TableCell>
              <TableCell align="right">{row.assists}</TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {row.steals}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {row.turnovers}
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: "secondary.light" }}>
            <TableCell sx={{ fontWeight: 700 }}>OPPONENT</TableCell>
            <TableCell align="right">{oppData.points}</TableCell>
            <TableCell align="right">
              {oppData.makes}-{oppData.attempts}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.fgPct}%
            </TableCell>
            <TableCell align="right">{oppData.rebounds}</TableCell>
            <TableCell align="right">{oppData.assists}</TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.steals}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.turnovers}
            </TableCell>
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
          type: s.type as "MAKE" | "MISS",
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

  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date || ""} | ${game?.location || ""}`}
        avatarSrc={game?.opponentLogoUrl}
        avatarColor="rgba(255,255,255,0.1)"
        backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
        primaryColor={team?.primaryColor}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted ? (
              <IconButton
                onClick={() => setOpenEditDialog(true)}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            ) : game?.deletedAt && !team?.deletedAt ? (
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
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mt: 3 }}>
          <AlertTitle>Read Only Mode</AlertTitle>
          {game?.deletedAt
            ? `This game is scheduled for deletion in ${timeLeft}.`
            : "The associated team is pending deletion."}
        </Alert>
      )}

      <Box
        sx={{
          mb: 4,
          mt: 3,
        }}
      >
        <ToggleButtonGroup
          value={periodFilter}
          exclusive
          onChange={(_, val) => val && setPeriodFilter(val)}
          size="small"
          fullWidth={Boolean(isMobile)}
        >
          {periods.map((p) => (
            <ToggleButton key={p} value={p}>
              {p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
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
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--serif)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Edit Game Details
          <IconButton
            color="error"
            onClick={() => {
              setOpenEditDialog(false);
              setDeleteDialogOpen(true);
            }}
          >
            <Delete />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Opponent"
              value={editOpponent}
              onChange={(e) => setEditOpponent(e.target.value)}
            />
            <TextField
              fullWidth
              label="Opponent Logo URL"
              value={editOpponentLogoUrl}
              onChange={(e) => setEditOpponentLogoUrl(e.target.value)}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <TextField
              fullWidth
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateGame} variant="contained" sx={{ ml: 1 }}>
            Save
          </Button>
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
