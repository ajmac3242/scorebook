/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Allows users to record statistical events (makes, misses, rebounds, etc.)
 * on an interactive court, manage active lineups, and track opponent scoring.
 */

import React, { useState, useEffect, useMemo } from "react";
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
  Tooltip,
} from "@mui/material";
import {
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
  ArrowForward,
  ArrowBack,
} from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent, type Player } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  type PlayerAggregates,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";

/**
 * Determines bonus status labels and colors based on foul counts and period type.
 * @param fouls - Current foul count.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
const getBonusStatus = (fouls: number, periodType: string) => {
  if (periodType === "QUARTERS") {
    if (fouls >= 5) return { label: " (B)", color: "error.main" };
    if (fouls === 4) return { label: "", color: "warning.main" };
    return { label: "", color: "default" };
  } else {
    if (fouls >= 10) return { label: " (DB)", color: "error.main" };
    if (fouls >= 7) return { label: " (B)", color: "error.main" };
    if (fouls === 6) return { label: "", color: "warning.main" };
    return { label: "", color: "default" };
  }
};

/**
 * GameMode page component.
 * Manages the state for live game tracking, including selections,
 * dialogs for recording actions, and real-time score calculation.
 */
const GameMode: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract game and team IDs from URL parameters
  const gameId = searchParams.get("gameId");
  const teamId = searchParams.get("teamId");

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

  // Derived data from StatEvents
  const gameStatsQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      return await db.stats.where("gameId").equals(gameId).toArray();
    } catch (err) {
      logger.error("Failed to fetch game stats:", err);
      return [];
    }
  }, [gameId]);
  const gameStats = useMemo(
    () => gameStatsQueryResult || [],
    [gameStatsQueryResult],
  );
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);
  const [subInPlayerId, setSubInPlayerId] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(1);
  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  // Fetch roster data for the current team
  const teamPlayersQueryResult = useLiveQuery(
    () =>
      teamId
        ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersQueryResult || [],
    [teamPlayersQueryResult],
  );

  const playersQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      if (!teamId) return [];
      const playerIds = teamPlayers.map((t) => t.playerId.toString());
      return await db.players.where("id").anyOf(playerIds).toArray();
    } catch (err) {
      logger.error("Failed to fetch players:", err);
      return [];
    }
  }, [teamId, teamPlayers]);
  const players = useMemo(() => playersQueryResult || [], [playersQueryResult]);

  const game = useLiveQuery(() => db.games.get(gameId as string), [gameId]);
  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  // Show summary dialog automatically if game is completed
  useEffect(() => {
    if (game?.completed && !summaryDialogOpen && !endGameDialogOpen) {
      setTimeout(() => setSummaryDialogOpen(true), 0);
    }
  }, [game?.completed, summaryDialogOpen, endGameDialogOpen]);

  // Periodic background sync during live tracking
  useEffect(() => {
    const interval = setInterval(() => {
      syncService.pushUpdates();
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  /**
   * ⚡ Bolt: Consolidate statistical derivations.
   * Performance: Sort gameStats once and perform a single-pass derivation for
   * scores, fouls, timeouts, possession, lineups, and recent history.
   * This reduces database queries and minimizes redundant array traversals.
   */
  const gameData = useMemo(() => {
    const sorted = [...gameStats].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );

    let curScore = 0;
    let oppScore = 0;
    let teamFouls = 0;
    let oppFouls = 0;
    let teamTimeouts = 0;
    let oppTimeouts = 0;
    let posState = null;
    const onCourt = new Set<string>();
    const pType = team?.periodType || "QUARTERS";

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      if (s.deletedAt) continue;

      // Score
      if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
        oppScore += s.points || 0;
      } else {
        curScore += s.points || 0;
      }

      // Fouls (Period-aware)
      if (s.type === ACTION_TYPES.FOUL) {
        const isCurrentPeriodFoul =
          pType === "QUARTERS"
            ? s.period === period
            : period === 1
              ? s.period === 1
              : s.period >= 2;

        if (isCurrentPeriodFoul) {
          if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
            oppFouls++;
          } else {
            teamFouls++;
          }
        }
      }

      // Timeouts
      if (s.type === ACTION_TYPES.TIMEOUT) {
        if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
          oppTimeouts++;
        } else {
          teamTimeouts++;
        }
      }

      // Possession
      if (s.type === ACTION_TYPES.POSSESSION) {
        posState = s.playerId;
      }

      // Lineup
      if (s.type === ACTION_TYPES.SUB_IN) {
        onCourt.add(s.playerId);
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
      }
    }

    const MAX_TIMEOUTS = 5;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);

    return {
      currentScore: curScore,
      opponentScore: oppScore,
      teamFoulStats: {
        teamFouls,
        oppFouls,
        teamBonusLabel: teamBonus.label,
        teamBonusColor: teamBonus.color,
        oppBonusLabel: oppBonus.label,
        oppBonusColor: oppBonus.color,
      },
      timeoutStats: {
        teamTOL: Math.max(0, MAX_TIMEOUTS - teamTimeouts),
        oppTOL: Math.max(0, MAX_TIMEOUTS - oppTimeouts),
      },
      possessionState: posState,
      onCourtIds: onCourt,
      recentStats: [...sorted].reverse().slice(0, 10),
    };
  }, [gameStats, period, team?.periodType]);

  const jerseyMap = useMemo(
    () =>
      new Map<string, string | undefined>(
        teamPlayers.map((tp) => [tp.playerId, tp.jerseyNumber]),
      ),
    [teamPlayers],
  );

  const statsGridData = useMemo(() => {
    return calculatePlayerAggregates(players, gameStats, teamPlayers);
  }, [players, gameStats, teamPlayers]);

  const markers = useMemo(() => {
    const res = [];
    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (
        !s.deletedAt &&
        (markerFilter === "ALL" || s.type === markerFilter) &&
        s.type !== ACTION_TYPES.SUB_IN &&
        s.type !== ACTION_TYPES.SUB_OUT
      ) {
        res.push({
          id: s.id,
          x: s.locationX || 0,
          y: s.locationY || 0,
          type: s.type,
          label:
            s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT
              ? jerseyMap.get(s.playerId) || ""
              : undefined,
          color:
            s.playerId === SPECIAL_PLAYER_IDS.OPPONENT
              ? theme.palette.secondary.main
              : undefined,
        });
      }
    }
    return res;
  }, [gameStats, markerFilter, jerseyMap, theme.palette.secondary.main]);

  /**
   * Undoes the most recent statistical action.
   */
  const handleUndo = async () => {
    if (gameData.recentStats.length === 0) return;
    const lastStat = gameData.recentStats[0];
    if (lastStat.id) {
      try {
        await db.open();
        await db.stats.update(lastStat.id, {
          deletedAt: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to undo stat:", err);
      }
    }
  };

  /**
   * Finalizes the game, marking it as completed and triggering a sync.
   */
  const handleEndGame = async () => {
    try {
      await db.open();
      await db.games.update(gameId as string, { completed: 1, synced: 0 });
      await syncService.pushUpdates();
      setEndGameDialogOpen(false);
      setSummaryDialogOpen(true);
    } catch (err) {
      logger.error("Failed to end game:", err);
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
      setSelectedPlayerId(SPECIAL_PLAYER_IDS.OPPONENT);
    } else {
      setSelectedPlayerId(null);
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
          synced: 0,
        });
        await syncService.pushUpdates();
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
        await syncService.pushUpdates();
      }
    } catch (err) {
      logger.error("Failed to save stat:", err);
    }
    // Reset state after save
    setDialogOpen(false);
    setStatType(null);
    setIsEditing(false);
    setEditingStatId(null);
    if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
  };

  /**
   * 🏀 CoachBoard: handleQuickSub
   * Why: Allows scorekeepers to swap players in/out in one action during live play.
   * Notes: Records both SUB_OUT and SUB_IN events to maintain accurate play-by-play.
   */
  const handleQuickSub = async () => {
    if (!subInPlayerId || !gameId || isDeleted) return;

    try {
      await db.open();
      const timestamp = new Date().toISOString();

      // Record SUB_OUT for outgoing player if not an "Empty" slot
      if (subOutPlayerId && !subOutPlayerId.startsWith("EMPTY")) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: subOutPlayerId,
          type: ACTION_TYPES.SUB_OUT,
          period,
          timestamp,
          synced: 0,
        });
      }

      // Record SUB_IN for incoming player
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId: subInPlayerId,
        type: ACTION_TYPES.SUB_IN,
        period,
        timestamp,
        synced: 0,
      });

      setSubDialogOpen(false);
      setSubOutPlayerId(null);
      setSubInPlayerId(null);
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record quick sub:", err);
    }
  };

  /**
   * Deletes a specific statistical event.
   */
  const handleDeleteStat = async () => {
    if (!statToDelete) return;
    try {
      await db.open();
      await db.stats.update(statToDelete, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
      setStatToDelete(null);
    } catch (err) {
      logger.error("Failed to delete stat:", err);
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
   * @param root0
   * @param root0.type
   * @param root0.label
   * @param root0.icon
   */

  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;
  const periodType = team?.periodType || "QUARTERS";
  const periodLabel = periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = periodType === "HALVES" ? 2 : 4;

  // Ensure required parameters are present, otherwise redirect
  useEffect(() => {
    if (!gameId || !teamId) {
      navigate("/");
    }
  }, [gameId, teamId, navigate]);

  if (!gameId || !teamId) {
    return null;
  }

  const handleNextPeriod = () => {
    setPeriod((p) => {
      // Allow going up to 10 (arbitrary max for OT)
      return p < 10 ? p + 1 : 1;
    });
  };

  /**
   * 🏀 CoachBoard: handleTimeout
   * Why: Quick recording of a timeout for the current team.
   * Notes: Records a TIMEOUT event tied to either Our Team or Opponent.
   */
  const handleTimeout = async () => {
    if (!gameId || isDeleted) return;
    try {
      await db.open();
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId:
          trackingMode === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        type: ACTION_TYPES.TIMEOUT,
        period,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record timeout:", err);
    }
  };

  /**
   * 🏀 CoachBoard: handleTogglePossession
   * Why: Quick toggle for the possession arrow.
   * Notes: Records a POSSESSION event for the specified team.
   */
  const handleTogglePossession = async (targetTeam: string) => {
    if (!gameId || isDeleted) return;
    try {
      await db.open();
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId: targetTeam,
        type: ACTION_TYPES.POSSESSION,
        period,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle possession:", err);
    }
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
                  <ScoreboardChip
                    label={`TEAM: ${gameData.currentScore}`}
                    color="primary"
                  />
                  <ScoreboardChip
                    label={`OPP: ${gameData.opponentScore}`}
                    color="secondary"
                  />
                  <ScoreboardChip
                    label={`TF: ${gameData.teamFoulStats.teamFouls}${gameData.teamFoulStats.teamBonusLabel}`}
                    variant="outlined"
                    sx={{
                      color:
                        gameData.teamFoulStats.teamBonusColor === "default"
                          ? "inherit"
                          : (gameData.teamFoulStats.teamBonusColor as string),
                      borderColor:
                        gameData.teamFoulStats.teamBonusColor === "default"
                          ? "divider"
                          : (gameData.teamFoulStats.teamBonusColor as string),
                    }}
                  />
                  <ScoreboardChip
                    label={`OF: ${gameData.teamFoulStats.oppFouls}${gameData.teamFoulStats.oppBonusLabel}`}
                    variant="outlined"
                    sx={{
                      color:
                        gameData.teamFoulStats.oppBonusColor === "default"
                          ? "inherit"
                          : (gameData.teamFoulStats.oppBonusColor as string),
                      borderColor:
                        gameData.teamFoulStats.oppBonusColor === "default"
                          ? "divider"
                          : (gameData.teamFoulStats.oppBonusColor as string),
                    }}
                  />
                  <ScoreboardChip
                    label={`TOL: ${gameData.timeoutStats.teamTOL} | ${gameData.timeoutStats.oppTOL}`}
                    variant="outlined"
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      px: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      disabled={isDeleted}
                      onClick={() =>
                        handleTogglePossession(SPECIAL_PLAYER_IDS.OUR_TEAM)
                      }
                      color={
                        gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                          ? "primary"
                          : "default"
                      }
                      sx={{
                        p: 0.5,
                        bgcolor:
                          gameData.possessionState ===
                          SPECIAL_PLAYER_IDS.OUR_TEAM
                            ? "primary.light"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            gameData.possessionState ===
                            SPECIAL_PLAYER_IDS.OUR_TEAM
                              ? "primary.light"
                              : "action.hover",
                        },
                      }}
                    >
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: "bold", mx: 0.5, fontSize: "0.65rem" }}
                    >
                      POSS
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={isDeleted}
                      onClick={() =>
                        handleTogglePossession(SPECIAL_PLAYER_IDS.OPPONENT)
                      }
                      color={
                        gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
                          ? "secondary"
                          : "default"
                      }
                      sx={{
                        p: 0.5,
                        bgcolor:
                          gameData.possessionState ===
                          SPECIAL_PLAYER_IDS.OPPONENT
                            ? "secondary.light"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            gameData.possessionState ===
                            SPECIAL_PLAYER_IDS.OPPONENT
                              ? "secondary.light"
                              : "action.hover",
                        },
                      }}
                    >
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  </Box>
                  <ScoreboardChip
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
                fullWidth={theme.breakpoints.down("sm") !== null}
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
                disabled={gameData.recentStats.length === 0 || isDeleted}
              >
                Undo
              </Button>
              <Tooltip title="Quick Substitution">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  onClick={() => setSubDialogOpen(true)}
                  disabled={isDeleted}
                  aria-label="quick substitution"
                >
                  Quick Sub
                </Button>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                startIcon={<History />}
                onClick={handleTimeout}
                disabled={isDeleted}
              >
                Timeout
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
              markers={markers}
            />
          </MoleskineCard>
        </Grid>

        {/* Panel: Roster and Recent Actions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {trackingMode === "TEAM" ? (
              <>
                <MoleskineCard>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Live Lineup
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 1,
                    }}
                  >
                    {players
                      .filter((p) => gameData.onCourtIds.has(p.id!))
                      .map((p) => (
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
                            disabled={true}
                            variant="contained"
                            sx={{
                              justifyContent: "flex-start",
                              px: 1,
                              bgcolor: "primary.main",
                              color: "white",
                              borderWidth: "1.5px",
                              "&.Mui-disabled": {
                                bgcolor: "primary.main",
                                color: "white",
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
                              {jerseyMap.get(p.id!) || ""}
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
                        </Box>
                      ))}
                    {gameData.onCourtIds.size === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No players on court. Use Quick Sub to add players.
                      </Typography>
                    )}
                  </Box>
                </MoleskineCard>

                <MoleskineCard sx={{ p: 0, overflow: "hidden" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, p: 2, pb: 1 }}
                  >
                    Player Stats
                  </Typography>
                  <TableContainer component={Box}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                          <TableCell
                            sx={{ fontSize: "0.65rem", fontWeight: 700, px: 1 }}
                          >
                            PLAYER
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            PTS
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            REB
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            AST
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            STL
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            TO
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.65rem", fontWeight: 700, px: 1 }}
                          >
                            PF
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {statsGridData.map((row) => (
                          <PlayerStatRow key={row.id} row={row} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MoleskineCard>
              </>
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
                {gameData.recentStats
                  .filter((s) => !s.deletedAt)
                  .map((s) => (
                    <RecentActionItem
                      key={s.id}
                      stat={s}
                      players={players}
                      periodLabel={periodLabel}
                      isDeleted={isDeleted}
                      onEdit={openEditDialog}
                      onDelete={(id) => {
                        setStatToDelete(id);
                        setDeleteDialogOpen(true);
                      }}
                    />
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
            {selectedPlayerId === SPECIAL_PLAYER_IDS.OPPONENT
              ? "Opponent"
              : players?.find((p) => p.id === selectedPlayerId)?.name ||
                "Select Player"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {trackingMode === "TEAM" && !isEditing && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1, fontWeight: 600 }}
              >
                Select Player
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  pb: 1,
                  "&::-webkit-scrollbar": { height: 4 },
                }}
              >
                {players
                  .filter((p) => gameData.onCourtIds.has(p.id!))
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        selectedPlayerId === p.id ? "contained" : "outlined"
                      }
                      onClick={() => setSelectedPlayerId(p.id!)}
                      sx={{
                        minWidth: 80,
                        flexShrink: 0,
                        flexDirection: "column",
                        py: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mb: 0.5,
                          bgcolor: p.avatarColor || "grey.500",
                        }}
                      >
                        {jerseyMap.get(p.id!) || ""}
                      </Avatar>
                      <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                        {p.name.split(" ")[0]}
                      </Typography>
                    </Button>
                  ))}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            <QuickAction
              type={ACTION_TYPES.MAKE}
              label="Make"
              icon={Check}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.MISS}
              label="Miss"
              icon={Close}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.REBOUND}
              label="Rebound"
              icon={SportsBasketball}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.STEAL}
              label="Steal"
              icon={FlashOn}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.ASSIST}
              label="Assist"
              icon={PanTool}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.TURNOVER}
              label="Turnover"
              icon={SwapHoriz}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.FOUL}
              label="Foul"
              icon={Warning}
              statType={statType}
              setStatType={setStatType}
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
              {gameData.currentScore} - {gameData.opponentScore}
            </Typography>
            <Typography
              variant="h5"
              color={
                gameData.currentScore > gameData.opponentScore
                  ? "success.main"
                  : "error.main"
              }
              sx={{ fontWeight: 600, mb: 3 }}
            >
              {gameData.currentScore > gameData.opponentScore
                ? "WIN"
                : gameData.currentScore < gameData.opponentScore
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

      {/* Quick Substitution Dialog */}
      <Dialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Quick Substitution
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom align="center">
                ON COURT
              </Typography>
              <Stack spacing={1}>
                {/* Active players */}
                {players
                  .filter((p) => gameData.onCourtIds.has(p.id!))
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        subOutPlayerId === p.id ? "contained" : "outlined"
                      }
                      onClick={() => setSubOutPlayerId(p.id!)}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: p.avatarColor || "grey.500",
                        }}
                      >
                        {jerseyMap.get(p.id!) || ""}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {p.name}
                      </Typography>
                    </Button>
                  ))}
                {/* Placeholder "Empty" slots to reach 5 total */}
                {Array.from({
                  length: Math.max(0, 5 - gameData.onCourtIds.size),
                }).map((_, i) => {
                  const emptyId = `EMPTY-${i}`;
                  return (
                    <Button
                      key={emptyId}
                      variant={
                        subOutPlayerId === emptyId ? "contained" : "outlined"
                      }
                      onClick={() => setSubOutPlayerId(emptyId)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderStyle: "dashed",
                        color: "text.secondary",
                        bgcolor:
                          subOutPlayerId === emptyId
                            ? "rgba(0,0,0,0.05)"
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: "transparent",
                          border: "1px dashed #bdbdbd",
                          color: "#bdbdbd",
                        }}
                      >
                        ?
                      </Avatar>
                      <Typography variant="body2">Empty</Typography>
                    </Button>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom align="center">
                BENCH
              </Typography>
              <Stack spacing={1}>
                {players
                  .filter((p) => !gameData.onCourtIds.has(p.id!))
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        subInPlayerId === p.id ? "contained" : "outlined"
                      }
                      onClick={() => setSubInPlayerId(p.id!)}
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: p.avatarColor || "grey.500",
                        }}
                      >
                        {jerseyMap.get(p.id!) || ""}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {p.name}
                      </Typography>
                    </Button>
                  ))}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSubDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleQuickSub}
            variant="contained"
            disabled={!subInPlayerId || !subOutPlayerId}
            startIcon={<SwapHoriz />}
          >
            Sub In
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

/**
 * Sub-component for displaying a chip in the scoreboard.
 */
const ScoreboardChip: React.FC<{
  label: string;
  color?: "primary" | "secondary" | "warning" | "error" | "default";
  variant?: "filled" | "outlined";
  sx?: object;
  onClick?: () => void;
}> = ({ label, color = "default", variant = "filled", sx, onClick }) => (
  <Chip
    label={label}
    color={color}
    variant={variant}
    onClick={onClick}
    sx={{ fontWeight: "bold", ...sx }}
  />
);

/**
 * Sub-component for displaying a player's statistical row in the table.
 */
const PlayerStatRow: React.FC<{
  row: PlayerAggregates;
}> = ({ row }) => (
  <TableRow>
    <TableCell sx={{ py: 1, px: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          display: "block",
          lineHeight: 1.1,
        }}
      >
        #{row.jerseyNumber}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          display: "block",
          color: "text.secondary",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "60px",
        }}
      >
        {row.name.split(" ")[0]}
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.points}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.rebounds}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.assists}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.steals}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.turnovers}
    </TableCell>
    <TableCell
      align="right"
      sx={{
        px: 1,
        fontSize: "0.75rem",
        fontWeight: row.fouls >= 4 ? 700 : 400,
        bgcolor:
          row.fouls >= 5
            ? "error.main"
            : row.fouls === 4
              ? "warning.main"
              : "transparent",
        color: row.fouls >= 4 ? "white" : "inherit",
      }}
    >
      {row.fouls}
    </TableCell>
  </TableRow>
);

/**
 * Sub-component for displaying a single item in the recent actions history.
 */
const RecentActionItem: React.FC<{
  stat: StatEvent;
  players: Player[];
  periodLabel: string;
  isDeleted: boolean;
  onEdit: (_s: StatEvent) => void;
  onDelete: (_id: string) => void;
}> = ({ stat: s, players, periodLabel, isDeleted, onEdit, onDelete }) => (
  <Box
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
          {s.playerId === SPECIAL_PLAYER_IDS.OPPONENT
            ? "Opponent"
            : s.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
                s.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
              ? "Our Team"
              : players?.find((p) => p.id === s.playerId)?.name || "Unknown"}
        </strong>
        : {s.type}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {periodLabel} {s.period || 1}
      </Typography>
    </Box>
    <Box>
      <IconButton size="small" disabled={isDeleted} onClick={() => onEdit(s)}>
        <Edit fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        disabled={isDeleted}
        onClick={() => onDelete(s.id!)}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

const QuickAction: React.FC<{
  type: string;
  label: string;
  icon: React.ElementType;
  statType: string | null;
  setStatType: (_type: string | null) => void;
}> = ({ type, label, icon: Icon, statType, setStatType }) => (
  <Button
    variant={statType === type ? "contained" : "outlined"}
    color="inherit"
    onClick={() => {
      setStatType(type);
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

export default GameMode;
