// frontend/src/pages/PlayerStats.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  LocalFireDepartment as FireIcon,
  Warning,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";
import BasketballCourt from "../components/BasketballCourt";
import { getShotZone } from "../utils/shotZones";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { calculatePlayerAggregates, getInitials } from "../utils/stats";
import { useTeams } from "../hooks/useTeams";
import { AVATAR_COLORS } from "../constants/colors";
import { logger } from "../utils/logger";

const ACTION_TYPES = [
  "MAKE",
  "MISS",
  "REBOUND",
  "ASSIST",
  "STEAL",
  "TURNOVER",
  "BLOCK",
  "FOUL",
];

const PlayerStats: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const radius = theme.shape.borderRadius;
  const shellRadius = radius * 1.5;
  const sectionRadius = radius * 1.5;
  const controlRadius = radius * 1.25;

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [timeLeft, setTimeLeft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const player = useLiveQuery(
    () => (playerId ? db.players.get(playerId) : undefined),
    [playerId],
  );

  useEffect(() => {
    if (!player?.deletedAt) {
      setTimeLeft("");
      return;
    }

    const updateCountdown = () => {
      const deleteTime = dayjs(player.deletedAt).add(24, "hour");
      const diff = deleteTime.diff(dayjs());

      if (diff <= 0) {
        setTimeLeft("Deleting now...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [player?.deletedAt]);

  const teams = useTeams();

  const teamPlayers =
    useLiveQuery(
      () =>
        playerId
          ? db.teamPlayers
              .where("playerId")
              .equals(playerId.toString())
              .toArray()
          : [],
      [playerId],
    ) || [];

  const gamesQueryResult = useLiveQuery(
    () =>
      teamIdParam ? db.games.where("teamId").equals(teamIdParam).toArray() : [],
    [teamIdParam],
  );
  const games = useMemo(() => gamesQueryResult || [], [gamesQueryResult]);

  const allStatsResult = useLiveQuery(
    () =>
      playerId !== undefined
        ? db.stats.where("playerId").equals(playerId).toArray()
        : [],
    [playerId],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const gameIdSet = useMemo(() => {
    const set = new Set<string | undefined>();
    for (let i = 0; i < games.length; i++) {
      set.add(games[i].id);
    }
    return set;
  }, [games]);

  const filteredStats = useMemo(() => {
    const stats = allStats as StatEvent[];
    const result: StatEvent[] = [];

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      if (selectedGameId !== "" && stat.gameId !== selectedGameId) continue;
      if (selectedType !== "" && stat.type !== selectedType) continue;
      if (selectedGameId === "" && !gameIdSet.has(stat.gameId)) continue;
      result.push(stat);
    }

    return result;
  }, [allStats, selectedGameId, selectedType, gameIdSet]);

  const heatmapData = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number }> = {};

    for (let i = 0; i < filteredStats.length; i++) {
      const stat = filteredStats[i];
      if (stat.type !== "MAKE" && stat.type !== "MISS") continue;

      const zone = getShotZone(stat.locationX || 0, stat.locationY || 0);
      if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
      data[zone].attempts++;
      if (stat.type === "MAKE") data[zone].makes++;
    }

    return data;
  }, [filteredStats]);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId),
    [games, selectedGameId],
  );

  const currentTeam = useMemo(
    () => teams.find((team) => team.id?.toString() === teamIdParam?.toString()),
    [teams, teamIdParam],
  );

  const aggregates = useMemo(() => {
    const activeGame = games.find(
      (game) => game.id === selectedGameId && !game.completed,
    );

    const result = calculatePlayerAggregates(
      [player].filter((p): p is NonNullable<typeof p> => p !== undefined),
      filteredStats,
      [],
      "total",
      {
        periodLength: activeGame?.periodLength,
        clutchOnly: clutchFilter,
        periodType: currentTeam?.periodType || "QUARTERS",
        liveContext: activeGame
          ? {
              clockTime: activeGame.clockTime || 0,
              period: activeGame.currentPeriod || 1,
            }
          : undefined,
      },
    );

    return (
      result[0] || {
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
  }, [player, filteredStats, games, selectedGameId, clutchFilter, currentTeam]);

  const getJerseyNumber = () => {
    if (!teamIdParam) return "";

    return (
      teamPlayers.find(
        (teamPlayer) => teamPlayer.teamId.toString() === teamIdParam.toString(),
      )?.jerseyNumber ?? ""
    );
  };

  const isDeleted = !!player?.deletedAt;
  const accent = player?.avatarColor || theme.palette.primary.main;
  const accentSoft = alpha(accent, 0.12);
  const accentSoftStrong = alpha(accent, 0.18);
  const accentBorder = alpha(accent, 0.3);
  const accentFocus = alpha(accent, 0.22);
  const jerseyNumber = getJerseyNumber();

  const filteredEvents = filteredStats;

  const courtMarkers = useMemo(() => {
    return filteredStats
      .filter(
        (stat) =>
          (stat.type === "MAKE" || stat.type === "MISS") &&
          stat.locationX !== undefined &&
          stat.locationY !== undefined,
      )
      .map((stat, index) => ({
        id: `${stat.gameId}-${index}`,
        x: stat.locationX ?? 0,
        y: stat.locationY ?? 0,
        type: stat.type,
        label: stat.type,
        color: stat.type === "MAKE" ? accent : theme.palette.error.main,
        playerId,
        playerName: player?.name || "Player",
      }));
  }, [filteredStats, accent, theme.palette.error.main, playerId, player?.name]);

  const handleOpenEdit = () => {
    setEditName(player?.name || "");
    setEditColor(player?.avatarColor || AVATAR_COLORS[0]);
    setOpenEditDialog(true);
  };

  const handleUpdatePlayer = async () => {
    if (!playerId) return;

    setIsSaving(true);

    try {
      await db.players.update(playerId, {
        name: editName,
        avatarColor: editColor,
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpenEditDialog(false);
    } catch (err) {
      logger.error("Failed to update player", err, { playerId, editName });
    } finally {
      setIsSaving(false);
    }
  };

  const statLabelSx = {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    mb: 0.5,
    fontFamily: theme.typography.body2.fontFamily,
  };

  const statValueSx = {
    fontSize: "1.5rem",
    lineHeight: 1,
    fontWeight: 700,
    color: "text.primary",
    fontFamily: theme.typography.h4.fontFamily,
  };

  const summaryStats = [
    { label: "Minutes", value: aggregates.min },
    { label: "Points", value: aggregates.points },
    { label: "Rebounds", value: aggregates.rebounds },
    { label: "Assists", value: aggregates.assists },
    { label: "Steals", value: aggregates.steals },
    { label: "Blocks", value: aggregates.blocks },
    { label: "FG%", value: `${aggregates.fgPct}%` },
    { label: "eFG%", value: `${aggregates.efgPct}%` },
    { label: "FG", value: `${aggregates.makes}/${aggregates.attempts}` },
    { label: "+/-", value: aggregates.plusMinus },
  ];

  return (
    <Box sx={{ pb: 6, opacity: isDeleted ? 0.78 : 1 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: shellRadius,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", lg: "center" }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton
                aria-label="back to players"
                onClick={() => navigate("/players")}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: accentSoft,
                  color: accent,
                  border: "1px solid",
                  borderColor: accentBorder,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {player?.name ? getInitials(player.name) : "P"}
              </Avatar>

              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: "wrap", mb: 0.5 }}
                >
                  <Typography variant="h4">
                    {player?.name || "Player"}
                  </Typography>

                  {jerseyNumber !== "" && (
                    <Chip
                      label={`#${jerseyNumber}`}
                      size="small"
                      sx={{
                        borderRadius: controlRadius,
                        bgcolor: accentSoft,
                        border: "1px solid",
                        borderColor: accentBorder,
                        color: "text.primary",
                      }}
                    />
                  )}

                  {isDeleted && (
                    <Chip
                      label="Pending deletion"
                      size="small"
                      color="warning"
                      sx={{ borderRadius: controlRadius }}
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {currentTeam?.name || "Career Stats"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Chip
                label={`MIN ${aggregates.min}`}
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Chip
                label={`PTS ${aggregates.points}`}
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Chip
                label={`FG% ${aggregates.fgPct}%`}
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Chip
                label={`eFG% ${aggregates.efgPct}%`}
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Tooltip title="Edit player">
                <span>
                  <IconButton
                    aria-label="edit player"
                    onClick={handleOpenEdit}
                    disabled={isDeleted}
                    sx={{
                      color: accent,
                      bgcolor: accentSoft,
                      border: "1px solid",
                      borderColor: accentBorder,
                      "&:hover": {
                        bgcolor: accentSoftStrong,
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", xl: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", xl: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{ flex: 1 }}
              >
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="player-game-filter-label">Game</InputLabel>
                  <Select
                    labelId="player-game-filter-label"
                    value={selectedGameId}
                    label="Game"
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    sx={{
                      borderRadius: controlRadius,
                      bgcolor: "background.paper",
                    }}
                  >
                    <MenuItem value="">All Games</MenuItem>
                    {games.map((game) => (
                      <MenuItem key={game.id} value={game.id}>
                        {game.opponent || game.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="player-action-filter-label">
                    Action Type
                  </InputLabel>
                  <Select
                    labelId="player-action-filter-label"
                    value={selectedType}
                    label="Action Type"
                    onChange={(e) => setSelectedType(e.target.value)}
                    sx={{
                      borderRadius: controlRadius,
                      bgcolor: "background.paper",
                    }}
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    {ACTION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  variant={clutchFilter ? "contained" : "outlined"}
                  onClick={() => setClutchFilter((prev) => !prev)}
                  startIcon={<FireIcon />}
                  sx={{
                    borderRadius: controlRadius,
                    boxShadow: "none",
                  }}
                >
                  Clutch
                </Button>

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={shotChartView}
                  onChange={(_, value) => {
                    if (value) setShotChartView(value);
                  }}
                  aria-label="shot chart view"
                  sx={{
                    "& .MuiToggleButton-root": {
                      borderRadius: `${controlRadius}px !important`,
                      px: 1.5,
                      textTransform: "none",
                    },
                  }}
                >
                  <ToggleButton value="markers" aria-label="markers">
                    Markers
                  </ToggleButton>
                  <ToggleButton value="heatmap" aria-label="heatmap">
                    Heatmap
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            {selectedGame && (
              <Chip
                label={`Selected game: ${selectedGame.opponent || selectedGame.id}`}
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: controlRadius,
                  bgcolor: accentSoft,
                  border: "1px solid",
                  borderColor: accentBorder,
                }}
              />
            )}
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          {isDeleted && (
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
              <AlertTitle>Pending Deletion</AlertTitle>
              This player is scheduled for deletion in{" "}
              <strong>{timeLeft}</strong>. Restore them from the Players list.
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }} xl={4}>
              <Stack spacing={2.5}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: sectionRadius,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    p: 2.25,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Summary
                  </Typography>

                  <Grid container spacing={1.5}>
                    {summaryStats.map((stat) => (
                      <Grid item xs={6} key={stat.label}>
                        <Box
                          sx={{
                            borderRadius: controlRadius,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                            px: 1.5,
                            py: 1.5,
                            minHeight: 84,
                          }}
                        >
                          <Typography sx={statLabelSx}>{stat.label}</Typography>
                          <Typography sx={statValueSx}>{stat.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: sectionRadius,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    p: 2.25,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Context
                  </Typography>

                  <Stack spacing={1.25}>
                    <Box>
                      <Typography sx={statLabelSx}>Scope</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentTeam?.name ||
                          "Career totals across visible games"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={statLabelSx}>Filters</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedType || "All action types"} ·{" "}
                        {selectedGameId ? "Single game selected" : "All games"}{" "}
                        · {clutchFilter ? "Clutch only" : "All situations"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={statLabelSx}>Shot chart</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {shotChartView === "markers"
                          ? "Marker view for individual attempts."
                          : "Heatmap view by shot zone efficiency."}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }} xl={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: sectionRadius,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  p: 2.25,
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h6">Shot Chart</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shotChartView === "markers"
                        ? "Review each recorded shot location."
                        : "See makes and attempts grouped by zone."}
                    </Typography>
                  </Box>

                  <Chip
                    label={`${filteredStats.length} tracked events`}
                    size="small"
                    sx={{
                      borderRadius: controlRadius,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    borderRadius: sectionRadius,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                    p: { xs: 1, sm: 2 },
                  }}
                >
                  <BasketballCourt
                    markers={shotChartView === "markers" ? courtMarkers : []}
                    heatmapData={
                      shotChartView === "heatmap" ? heatmapData : undefined
                    }
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: sectionRadius,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 2.25,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="h6">Action Log</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed event history for the current player and filter
                    set.
                  </Typography>
                </Box>

                <TableContainer>
                  <Table size="small" aria-label="player action log">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Game</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Clock</TableCell>
                        <TableCell align="right">X</TableCell>
                        <TableCell align="right">Y</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEvents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Box sx={{ py: 4, textAlign: "center" }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No actions match the current filters.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEvents.map((event, index) => {
                          const game = games.find((g) => g.id === event.gameId);

                          return (
                            <TableRow key={`${event.gameId}-${index}`}>
                              <TableCell>{event.type}</TableCell>
                              <TableCell>
                                {game?.opponent || event.gameId}
                              </TableCell>
                              <TableCell>{event.period || "-"}</TableCell>
                              <TableCell>{event.clockTime || "-"}</TableCell>
                              <TableCell align="right">
                                {event.locationX ?? "-"}
                              </TableCell>
                              <TableCell align="right">
                                {event.locationY ?? "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: shellRadius,
          },
        }}
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
                {AVATAR_COLORS.map((color) => {
                  const selected = editColor === color;

                  return (
                    <Box
                      key={color}
                      role="button"
                      tabIndex={0}
                      aria-label={`select avatar color ${color}`}
                      onClick={() => setEditColor(color)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setEditColor(color);
                        }
                      }}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: color,
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor: selected ? "text.primary" : "divider",
                        boxSizing: "border-box",
                        display: "grid",
                        placeItems: "center",
                        transition: theme.transitions.create(
                          ["transform", "box-shadow", "border-color"],
                          { duration: theme.transitions.duration.shorter },
                        ),
                        "&:hover": { transform: "scale(1.08)" },
                        "&:focus-visible": {
                          outline: "none",
                          boxShadow: `0 0 0 3px ${accentFocus}`,
                        },
                      }}
                    >
                      {selected && (
                        <CheckIcon sx={{ color: "#fff", fontSize: 16 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePlayer}
            variant="contained"
            disabled={isSaving}
            sx={{ boxShadow: "none" }}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerStats;
