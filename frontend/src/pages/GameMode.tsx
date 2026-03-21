/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Allows users to record statistical events (makes, misses, rebounds, etc.)
 * on an interactive court, manage active lineups, and track opponent scoring.
 */

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Chip,
  DialogContentText,
  Stack,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
  Undo as UndoIcon,
  History,
  Check,
  Close,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  Edit,
  Delete,
  FlashOn,
  Warning,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES } from "../constants/stats";
import { getInitials, getPlayerJersey } from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import { useLocation } from "react-router-dom";

const OPPONENT_PLAYER_ID = "OPPONENT";

/**
 * GameMode page component.
 * Manages the state for live game tracking, including selections,
 * dialogs for recording actions, and real-time score calculation.
 */
const GameMode: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Extract game and team IDs from URL parameters
  const gameId = searchParams.get("gameId");
  const teamId = searchParams.get("teamId");

  // Ensure required parameters are present, otherwise redirect
  useEffect(() => {
    if (!gameId || !teamId) {
      navigate("/");
    }
  }, [gameId, teamId, navigate]);

  if (!gameId || !teamId) {
    return null;
  }

  // Local state for recording individual actions
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);

  // Filter for displaying court markers
  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

  // State for editing and deleting actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  // Game lifecycle state
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);

  // Roster and lineup state
  const [onCourtIds, setOnCourtIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<number>(1);
  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  // Fetch roster data for the current team
  const teamPlayers =
    useLiveQuery(
      () =>
        teamId
          ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
          : Promise.resolve([]),
      [teamId],
    ) || [];

  const players =
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!teamId) return [];
        const playerIds = teamPlayers.map((t) => t.playerId.toString());
        return await db.players.where("id").anyOf(playerIds).toArray();
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
    }, [teamId, teamPlayers]) || [];

  const game = useLiveQuery(() => db.games.get(gameId as any), [gameId]);
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

  // Show summary dialog automatically if game is completed
  useEffect(() => {
    if (game?.completed && !summaryDialogOpen && !endGameDialogOpen) {
      setSummaryDialogOpen(true);
    }
  }, [game?.completed]);

  // Periodic background sync during live tracking
  useEffect(() => {
    const interval = setInterval(() => {
      syncService.pushUpdates();
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Fetch recent actions for the history sidebar
  const recentStats =
    useLiveQuery(async () => {
      try {
        await db.open();
        const stats = await db.stats.where("gameId").equals(gameId).toArray();
        return stats
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);
      } catch (err) {
        console.error("Failed to fetch recent stats:", err);
        return [];
      }
    }, [gameId]) || [];

  // Fetch all game stats for score calculation and court markers
  const gameStats =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.stats.where("gameId").equals(gameId).toArray();
      } catch (err) {
        console.error("Failed to fetch game stats:", err);
        return [];
      }
    }, [gameId]) || [];

  // Derived scores
  const currentScore = gameStats
    .filter((s) => s.playerId !== OPPONENT_PLAYER_ID && !s.deletedAt)
    .reduce((sum, s) => sum + (s.points || 0), 0);
  const opponentScore = gameStats
    .filter((s) => s.playerId === OPPONENT_PLAYER_ID && !s.deletedAt)
    .reduce((sum, s) => sum + (s.points || 0), 0);

  /**
   * Undoes the most recent statistical action.
   */
  const handleUndo = async () => {
    if (recentStats.length === 0) return;
    const lastStat = recentStats[0];
    if (lastStat.id) {
      try {
        await db.open();
        await db.stats.delete(lastStat.id);
      } catch (err) {
        console.error("Failed to undo stat:", err);
      }
    }
  };

  /**
   * Finalizes the game, marking it as completed and triggering a sync.
   */
  const handleEndGame = async () => {
    try {
      await db.open();
      await db.games.update(gameId as any, { completed: 1, synced: 0 });
      syncService.pushUpdates();
      setEndGameDialogOpen(false);
      setSummaryDialogOpen(true);
    } catch (err) {
      console.error("Failed to end game:", err);
    }
  };

  /**
   * Handles a click on the court to start recording an action.
   * @param {number} x - The X coordinate on the court.
   * @param {number} y - The Y coordinate on the court.
   */
  const handleCourtClick = (x: number, y: number) => {
    if (isDeleted) return;
    setSelectedX(x);
    setSelectedY(y);
    // Auto-select opponent if in opponent tracking mode
    if (trackingMode === "OPPONENT") {
      setSelectedPlayerId(OPPONENT_PLAYER_ID);
    }
    setDialogOpen(true);
  };

  /**
   * Saves a new or edited statistical event to IndexedDB.
   * @param {string} currentType - (Optional) Overrides the stat type.
   */
  const handleSaveStat = async (currentType?: string) => {
    const typeToSave = currentType || statType;
    if (!selectedPlayerId || !typeToSave) return;

    try {
      if (!gameId) return;
      await db.open();
      if (isEditing && editingStatId) {
        await db.stats.update(editingStatId, {
          playerId: selectedPlayerId!,
          type: typeToSave,
          points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
        });
      } else {
        const newStat: StatEvent = {
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: selectedPlayerId!,
          type: typeToSave,
          points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
          locationX: selectedX || 0,
          locationY: selectedY || 0,
          period,
          timestamp: new Date().toISOString(),
          synced: 0,
        };
        await db.stats.add(newStat);
      }
    } catch (err) {
      console.error("Failed to save stat:", err);
    }
    // Reset state after save
    setDialogOpen(false);
    setStatType(null);
    setIsEditing(false);
    setEditingStatId(null);
    if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
  };

  /**
   * Toggles a player into or out of the active lineup.
   * Records a SUB_IN or SUB_OUT event.
   * @param {string} playerId - The player ID.
   */
  const toggleOnCourt = async (playerId: string) => {
    if (isDeleted) return;
    const newOnCourt = new Set(onCourtIds);
    const isNowOnCourt = !newOnCourt.has(playerId);
    isNowOnCourt ? newOnCourt.add(playerId) : newOnCourt.delete(playerId);
    setOnCourtIds(newOnCourt);

    try {
      if (!gameId) return;
      await db.open();
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId: playerId,
        type: isNowOnCourt ? ACTION_TYPES.SUB_IN : ACTION_TYPES.SUB_OUT,
        period,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
    } catch (err) {
      console.error("Failed to record sub event:", err);
    }
  };

  /**
   * Deletes a specific statistical event.
   */
  const handleDeleteStat = async () => {
    if (!statToDelete) return;
    try {
      await db.open();
      await db.stats.delete(statToDelete);
      setDeleteDialogOpen(false);
      setStatToDelete(null);
    } catch (err) {
      console.error("Failed to delete stat:", err);
    }
  };

  /**
   * Populates the dialog state with an existing stat for editing.
   * @param {StatEvent} stat - The stat event to edit.
   */
  const openEditDialog = (stat: StatEvent) => {
    if (isDeleted) return;
    setEditingStatId(stat.id ?? null);
    setSelectedPlayerId(stat.playerId as string);
    setStatType(stat.type);
    setPoints(stat.points || 2);
    setSelectedX(stat.locationX || 0);
    setSelectedY(stat.locationY || 0);
    setIsEditing(true);
    setDialogOpen(true);
  };

  /**
   * Reusable component for quick-action buttons in the recording dialog.
   */
  const QuickAction = ({ type, label, icon: Icon }: any) => (
    <Button
      variant={statType === type ? "contained" : "outlined"}
      color="inherit"
      onClick={() => {
        setStatType(type);
        // Automatically save for non-scoring actions to improve speed
        if (type !== ACTION_TYPES.MAKE) handleSaveStat(type);
      }}
      sx={{
        flexDirection: "column",
        py: 2,
        minWidth: 80,
        borderColor: "#D1D1D1",
        backgroundColor: statType === type ? "primary.main" : "transparent",
        color: statType === type ? "white" : "text.primary",
      }}
    >
      <Icon sx={{ mb: 1 }} />
      <Typography variant="caption">{label}</Typography>
    </Button>
  );

  const isDeleted =
    !!game?.deletedAt || !!team?.deletedAt || !!season?.deletedAt;
  const periodType = season?.periodType || "QUARTERS";
  const periodLabel = periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = periodType === "HALVES" ? 2 : 4;

  const handleNextPeriod = () => {
    setPeriod((p) => {
      // Allow going up to 10 (arbitrary max for OT)
      return p < 10 ? p + 1 : 1;
    });
  };

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          This game is in read-only mode because it or its parent is pending
          deletion.
        </Alert>
      )}
      <Grid container spacing={3}>
        {/* Main Content Area: Scoreboard and Court */}
        <Grid item xs={12} md={8}>
          <MoleskineCard>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                  {game?.opponent ? `vs ${game.opponent}` : "Live Tracker"}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
                >
                  <Chip
                    label={`TEAM: ${currentScore}`}
                    color="primary"
                    sx={{ fontWeight: "bold" }}
                  />
                  <Chip
                    label={`OPP: ${opponentScore}`}
                    color="secondary"
                    sx={{ fontWeight: "bold" }}
                  />
                  <Chip
                    label={`${periodLabel}: ${period > maxPeriod ? `OT ${period - maxPeriod}` : period}`}
                    onClick={isDeleted ? undefined : handleNextPeriod}
                    variant="outlined"
                    color={period > maxPeriod ? "warning" : "default"}
                  />
                  {!game?.completed && !isDeleted && (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => setEndGameDialogOpen(true)}
                    >
                      End Game
                    </Button>
                  )}
                </Stack>
              </Box>
              <ToggleButtonGroup
                value={trackingMode}
                exclusive
                onChange={(_, val) => val && setTrackingMode(val)}
                size="small"
                disabled={isDeleted}
                fullWidth={theme.breakpoints.down("sm") as any}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <ToggleButton value="TEAM">Our Team</ToggleButton>
                <ToggleButton value="OPPONENT">Opponent</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                mb: 2,
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={recentStats.length === 0 || isDeleted}
              >
                Undo
              </Button>
              {/* Markers filtering chips */}
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  overflowX: "auto",
                  pb: 1,
                  width: { xs: "100%", sm: "auto" },
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {["ALL", "MAKE", "MISS", "REBOUND", "ASSIST", "STEAL"].map(
                  (type) => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => setMarkerFilter(type)}
                      variant={markerFilter === type ? "filled" : "outlined"}
                      size="small"
                      color={markerFilter === type ? "primary" : "default"}
                    />
                  ),
                )}
              </Box>
            </Box>

            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={gameStats
                .filter(
                  (s) =>
                    !s.deletedAt &&
                    (markerFilter === "ALL" || s.type === markerFilter) &&
                    s.type !== ACTION_TYPES.SUB_IN &&
                    s.type !== ACTION_TYPES.SUB_OUT,
                )
                .map((s) => ({
                  id: s.id,
                  x: s.locationX || 0,
                  y: s.locationY || 0,
                  type: s.type,
                  label:
                    s.playerId !== OPPONENT_PLAYER_ID
                      ? getPlayerJersey(s.playerId, teamPlayers)
                      : undefined,
                  color:
                    s.playerId === OPPONENT_PLAYER_ID
                      ? theme.palette.secondary.main
                      : undefined,
                }))}
            />
          </MoleskineCard>
        </Grid>

        {/* Sidebar: Roster and Recent Actions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {trackingMode === "TEAM" ? (
              <MoleskineCard>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Team Roster
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(auto-fill, minmax(140px, 1fr))",
                      sm: "1fr",
                    },
                    gap: 1,
                  }}
                >
                  {players.map((p) => (
                    <Box
                      key={p.id}
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        alignItems: "center",
                      }}
                    >
                      <Button
                        fullWidth
                        disabled={isDeleted}
                        variant={
                          selectedPlayerId === p.id ? "contained" : "outlined"
                        }
                        onClick={() => setSelectedPlayerId(p.id ?? null)}
                        sx={{
                          justifyContent: "flex-start",
                          px: 1,
                          bgcolor:
                            selectedPlayerId === p.id
                              ? "primary.main"
                              : "transparent",
                          color:
                            selectedPlayerId === p.id
                              ? "white"
                              : "text.primary",
                          transform:
                            selectedPlayerId === p.id
                              ? "scale(1.02)"
                              : "scale(1)",
                          boxShadow:
                            selectedPlayerId === p.id
                              ? "0 4px 12px rgba(0,0,0,0.2)"
                              : "none",
                          transition: "all 0.1s ease",
                          borderWidth: "1.5px",
                          "&:hover": {
                            borderWidth: "1.5px",
                            transform: "scale(1.02)",
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 20,
                            height: 20,
                            fontSize: "0.65rem",
                            mr: 0.5,
                            bgcolor: p.avatarColor || "grey.500",
                          }}
                        >
                          {getPlayerJersey(p.id, teamPlayers)}
                        </Avatar>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </Typography>
                      </Button>
                      <IconButton
                        size="small"
                        disabled={isDeleted}
                        onClick={() => toggleOnCourt(p.id!)}
                        color={onCourtIds.has(p.id!) ? "primary" : "default"}
                        sx={{ p: 0.5 }}
                      >
                        {onCourtIds.has(p.id!) ? (
                          <RemoveCircleOutline fontSize="small" />
                        ) : (
                          <AddCircleOutline fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </MoleskineCard>
            ) : (
              <MoleskineCard
                sx={{
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText",
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Opponent Tracking
                </Typography>
                <Typography variant="body2">
                  Stats recorded in this mode will be assigned to the "Opponent"
                  player.
                </Typography>
              </MoleskineCard>
            )}

            <MoleskineCard>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <History sx={{ fontSize: 18, mr: 1 }} /> Recent Actions
              </Typography>
              <Stack spacing={1}>
                {recentStats
                  .filter((s) => !s.deletedAt)
                  .map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          <strong>
                            {s.playerId === OPPONENT_PLAYER_ID
                              ? "Opponent"
                              : players?.find((p) => p.id === s.playerId)
                                  ?.name || "Unknown"}
                          </strong>
                          : {s.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {periodLabel} {s.period || 1}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          disabled={isDeleted}
                          onClick={() => openEditDialog(s)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={isDeleted}
                          onClick={() => {
                            setStatToDelete(s.id ?? null);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
              </Stack>
            </MoleskineCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Record/Edit Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {isEditing ? "Edit Action" : "Record Action"}
          <Typography variant="body2" color="text.secondary">
            {selectedPlayerId === OPPONENT_PLAYER_ID
              ? "Opponent"
              : players?.find((p) => p.id === selectedPlayerId)?.name ||
                "Select Player"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            <QuickAction type={ACTION_TYPES.MAKE} label="Make" icon={Check} />
            <QuickAction type={ACTION_TYPES.MISS} label="Miss" icon={Close} />
            <QuickAction
              type={ACTION_TYPES.REBOUND}
              label="Rebound"
              icon={SportsBasketball}
            />
            <QuickAction
              type={ACTION_TYPES.STEAL}
              label="Steal"
              icon={FlashOn}
            />
            <QuickAction
              type={ACTION_TYPES.ASSIST}
              label="Assist"
              icon={PanTool}
            />
            <QuickAction
              type={ACTION_TYPES.TURNOVER}
              label="TO"
              icon={SwapHoriz}
            />
          </Box>
          {statType === ACTION_TYPES.MAKE && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Points
              </Typography>
              <Stack direction="row" spacing={1}>
                {[1, 2, 3].map((pts) => (
                  <Button
                    key={pts}
                    fullWidth
                    variant={points === pts ? "contained" : "outlined"}
                    onClick={() => setPoints(pts)}
                  >
                    {pts}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveStat()}
            variant="contained"
            disabled={!selectedPlayerId || !statType}
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm End Game Dialog */}
      <Dialog
        open={endGameDialogOpen}
        onClose={() => setEndGameDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>End Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Is the game finished? Once ended, the results will be finalized for
            team averages.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEndGameDialogOpen(false)} color="inherit">
            No, Continue
          </Button>
          <Button onClick={handleEndGame} color="error" variant="contained">
            Yes, Finish Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final Game Summary Dialog */}
      <Dialog
        open={summaryDialogOpen}
        onClose={() => setSummaryDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", textAlign: "center" }}>
          Game Summary
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {currentScore} - {opponentScore}
            </Typography>
            <Typography
              variant="h5"
              color={
                currentScore > opponentScore ? "success.main" : "error.main"
              }
              sx={{ fontWeight: 600, mb: 3 }}
            >
              {currentScore > opponentScore
                ? "WIN"
                : currentScore < opponentScore
                  ? "LOSS"
                  : "DRAW"}
            </Typography>
            <Typography variant="body1">
              The game has been finalized. You can view the full box score in
              the Game Stats page.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSummaryDialogOpen(false);
            }}
            sx={{ mr: 2 }}
          >
            Close & Review Actions
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSummaryDialogOpen(false);
              navigate(`/game/stats?gameId=${gameId}`);
            }}
          >
            View Box Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Stat Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this action?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteStat} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameMode;
