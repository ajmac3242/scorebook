import React, { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { getShotZone } from "../utils/shotZones";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { useLiveQuery } from "dexie-react-hooks";
import { calculatePlayerAggregates } from "../utils/stats";
import { MoleskineCard, StatCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { useTeams } from "../hooks/useTeams";
import { AVATAR_COLORS } from "../constants/colors";
import {
  Warning,
  Edit as EditIcon,
  Check,
  Close,
  SportsBasketball,
  PanTool,
  FlashOn,
  ArrowBack,
  SwapHoriz,
} from "@mui/icons-material";
import dayjs from "dayjs";
import IconButton from "@mui/material/IconButton";

/**
 * PlayerStats page component.
 * Displays detailed statistics for an individual player,
 * including a shot chart and a detailed action log.
 */
const PlayerStats: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();

  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const player = useLiveQuery(
    async () => (playerId ? await db.players.get(playerId) : undefined),
    [playerId],
  );

  useEffect(() => {
    if (player?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(player.deletedAt).add(24, "hour");
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
  }, [player?.deletedAt]);

  // Use shared hooks
  const teams = useTeams();

  const teamPlayers =
    useLiveQuery(
      async () =>
        playerId
          ? await db.teamPlayers
              .where("playerId")
              .equals(playerId.toString())
              .toArray()
          : [],
      [playerId],
    ) || [];

  const gamesQueryResult = useLiveQuery(async () => {
    if (selectedGameId) {
      const g = await db.games.get(selectedGameId);
      return g ? [g] : [];
    }
    if (teamIdParam) {
      return await db.games.where("teamId").equals(teamIdParam).toArray();
    }
    if (teams.length > 0)
      return await db.games
        .where("teamId")
        .anyOf(teams.map((t) => t.id!).filter(Boolean))
        .toArray();
    return await db.games.toArray();
  }, [selectedGameId, teams, teamIdParam]);
  const games = useMemo(() => gamesQueryResult || [], [gamesQueryResult]);

  const allStatsResult = useLiveQuery(
    async () =>
      playerId !== undefined
        ? await db.stats.where("playerId").equals(playerId).toArray()
        : [],
    [playerId],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  // Optimization: Extract gameIdSet into its own useMemo to prevent redundant creations within filteredStats.
  const gameIdSet = useMemo(() => {
    const set = new Set<string | undefined>();
    for (let i = 0; i < games.length; i++) {
      set.add(games[i].id);
    }
    return set;
  }, [games]);

  const filteredStats = useMemo(() => {
    const stats = allStats as StatEvent[];
    // Optimization: Use a standard for loop instead of .filter() to reduce function call overhead and improve performance.
    const result = [];
    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      if (selectedGameId !== "" && stat.gameId !== selectedGameId) continue;
      if (selectedType !== "" && stat.type !== selectedType) continue;
      if (selectedGameId === "" && !gameIdSet.has(stat.gameId)) continue;
      result.push(stat);
    }
    return result;
  }, [allStats, selectedGameId, selectedType, gameIdSet]);

  /**
   * Updates player-level metadata.
   */
  const handleUpdatePlayer = async () => {
    if (!playerId) return;
    await db.players.update(playerId, {
      name: editName,
      avatarColor: editColor,
      synced: 0,
    });
    await syncService.pushUpdates();
    setOpenEditDialog(false);
  };

  const heatmapData = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number }> = {};
    for (let i = 0; i < filteredStats.length; i++) {
      const s = filteredStats[i];
      if (s.type !== "MAKE" && s.type !== "MISS") continue;

      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
      data[zone].attempts++;
      if (s.type === "MAKE") data[zone].makes++;
    }
    return data;
  }, [filteredStats]);

  const aggregates = useMemo(() => {
    const activeGame = games.find(
      (g) => g.id === selectedGameId && !g.completed,
    );
    const res = calculatePlayerAggregates(
      [player].filter((p): p is NonNullable<typeof p> => p !== undefined),
      filteredStats,
      [],
      "total",
      {
        periodLength: activeGame?.periodLength,
        liveContext: activeGame
          ? {
              clockTime: activeGame.clockTime || 0,
              period: activeGame.currentPeriod || 1,
            }
          : undefined,
      },
    );
    return (
      res[0] || {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        turnovers: 0,
        blocks: 0,
        offRebounds: 0,
        defRebounds: 0,
        fgPct: "0.0",
        efgPct: "0.0",
        plusMinus: 0,
        min: 0,
        makes: 0,
        attempts: 0,
      }
    );
  }, [player, filteredStats, games, selectedGameId]);

  /**
   * Retrieves the jersey number for the current player within the filtered team context.
   */
  const getJerseyNumber = () => {
    if (teamIdParam) {
      const tp = teamPlayers.find(
        (t) => t.teamId.toString() === teamIdParam.toString(),
      );
      return tp?.jerseyNumber ?? "";
    }
    return "";
  };

  const isDeleted = !!player?.deletedAt;

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={player?.name || "Player"}
        subtitle={
          teamIdParam
            ? teams.find((t) => t.id?.toString() === teamIdParam)?.name
            : "Career Stats"
        }
        avatarColor={player?.avatarColor}
        backTo="/players"
        primaryColor={player?.avatarColor}
        jerseyNumber={getJerseyNumber()}
        stats={[
          { label: "MIN", value: aggregates.min },
          { label: "PTS", value: aggregates.points },
          { label: "FG%", value: `${aggregates.fgPct}%` },
          { label: "eFG%", value: `${aggregates.efgPct}%` },
          { label: "+/-", value: aggregates.plusMinus },
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted && (
              <IconButton
                onClick={() => {
                  setEditName(player?.name || "");
                  setEditColor(player?.avatarColor || "#154C56");
                  setOpenEditDialog(true);
                }}
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
            )}
          </Stack>
        }
      />

      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mt: 3 }}>
          <AlertTitle>Pending Deletion</AlertTitle>
          This player is scheduled for deletion in <strong>{timeLeft}</strong>.
          Restore them from the Players list.
        </Alert>
      )}

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit Player Details</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Player Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Avatar Color
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {AVATAR_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setEditColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: editColor === color ? "3px solid #000" : "none",
                      boxSizing: "border-box",
                      "&:hover": { transform: "scale(1.1)" },
                      transition: "transform 0.1s",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdatePlayer}
            variant="contained"
            disabled={!editName}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <MoleskineCard sx={{ mb: 3, mt: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="subtitle2">Filters</Typography>
          <ToggleButtonGroup
            value={shotChartView}
            exclusive
            onChange={(_, val) => val && setShotChartView(val)}
            size="small"
          >
            <ToggleButton value="markers">Markers</ToggleButton>
            <ToggleButton value="heatmap">Heatmap</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Game</InputLabel>
            <Select
              value={selectedGameId}
              label="Game"
              onChange={(e) => setSelectedGameId(e.target.value as string)}
            >
              <MenuItem value="">All Games</MenuItem>
              {games.map((g) => (
                <MenuItem key={g.id} value={g.id!}>
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
              <MenuItem value="MAKE">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Check sx={{ fontSize: 18, color: "success.main" }} /> Makes
                </Box>
              </MenuItem>
              <MenuItem value="MISS">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Close sx={{ fontSize: 18, color: "error.main" }} /> Misses
                </Box>
              </MenuItem>
              <MenuItem value="REBOUND">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SportsBasketball sx={{ fontSize: 18, color: "primary.main" }} />{" "}
                  Total Rebounds
                </Box>
              </MenuItem>
              <MenuItem value="OFF_REBOUND">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SportsBasketball sx={{ fontSize: 18, color: "primary.main" }} />{" "}
                  Off. Rebounds
                </Box>
              </MenuItem>
              <MenuItem value="DEF_REBOUND">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SportsBasketball sx={{ fontSize: 18, color: "primary.main" }} />{" "}
                  Def. Rebounds
                </Box>
              </MenuItem>
              <MenuItem value="ASSIST">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PanTool sx={{ fontSize: 18, color: "info.main" }} /> Assists
                </Box>
              </MenuItem>
              <MenuItem value="STEAL">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FlashOn sx={{ fontSize: 18, color: "warning.main" }} /> Steals
                </Box>
              </MenuItem>
              <MenuItem value="BLOCK">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ArrowBack sx={{ fontSize: 18, color: "secondary.main" }} />{" "}
                  Blocks
                </Box>
              </MenuItem>
              <MenuItem value="TURNOVER">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SwapHoriz sx={{ fontSize: 18, color: "warning.dark" }} />{" "}
                  Turnovers
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </MoleskineCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <StatCard label="Total Minutes" value={aggregates.min} />
            <StatCard label="Total Points" value={aggregates.points} />
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <StatCard label="FG%" value={`${aggregates.fgPct}%`} />
              <StatCard label="eFG%" value={`${aggregates.efgPct}%`} />
              <StatCard
                label="FG"
                value={`${aggregates.makes}/${aggregates.attempts}`}
              />
              <StatCard
                label="+/-"
                value={
                  aggregates.plusMinus > 0
                    ? `+${aggregates.plusMinus}`
                    : aggregates.plusMinus
                }
              />
              <StatCard label="REB" value={aggregates.rebounds} />
              <StatCard label="AST" value={aggregates.assists} />
              <StatCard label="STL" value={aggregates.steals} />
              <StatCard label="BLK" value={aggregates.blocks} />
              <StatCard label="TO" value={aggregates.turnovers} />
              <StatCard
                label="OREB/DREB"
                value={`${aggregates.offRebounds}/${aggregates.defRebounds}`}
              />
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <MoleskineCard sx={{ p: 1 }}>
            <BasketballCourt
              markers={
                shotChartView === "markers"
                  ? filteredStats.map((s) => ({
                      id: s.id,
                      x: s.locationX || 0,
                      y: s.locationY || 0,
                      type: s.type,
                    }))
                  : []
              }
              heatmapData={
                shotChartView === "heatmap" ? heatmapData : undefined
              }
            />
          </MoleskineCard>
        </Grid>
        <Grid item xs={12}>
          <TableContainer
            component={MoleskineCard}
            sx={{
              mx: { xs: -2, sm: 0 },
              width: { xs: "calc(100% + 32px)", sm: "100%" },
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700, p: { xs: 1, sm: 2 } }}>
                    Period
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, p: { xs: 1, sm: 2 } }}>
                    Game
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, p: { xs: 1, sm: 2 } }}>
                    Clock
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, p: { xs: 1, sm: 2 } }}>
                    Action
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, p: { xs: 1, sm: 2 } }}
                    align="right"
                  >
                    Pts
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStats
                  .slice()
                  .reverse()
                  .map((stat) => {
                    const g = games.find((g) => g.id === stat.gameId);
                    const formatClock = (totalSeconds: number) => {
                      const mins = Math.floor(totalSeconds / 60);
                      const secs = totalSeconds % 60;
                      return `${mins}:${secs.toString().padStart(2, "0")}`;
                    };
                    return (
                      <TableRow key={stat.id} hover>
                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                          P{stat.period || 1}
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                          {stat.clockTime !== undefined
                            ? formatClock(stat.clockTime)
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              fontWeight: 500,
                            }}
                          >
                            {g?.opponent || "Unknown"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                          >
                            {stat.type}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>
                          {stat.points || 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayerStats;
