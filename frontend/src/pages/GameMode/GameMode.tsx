/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 */

import React, { useEffect, useCallback } from "react";
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
  Stack,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Tooltip,
  Snackbar,
} from "@mui/material";

import {
  History,
  Warning,
  PlayArrow,
  Pause,
  Mic,
  MicOff,
  GridOn,
} from "@mui/icons-material";
import BasketballCourt from "../../components/BasketballCourt";
import RecentActionItem from "../../components/RecentActionItem";
import { MatchupMatrix } from "../../components/MatchupMatrix";
import QuickSubDialog from "../../components/QuickSubDialog";
import SubstitutionAuditDialog from "../../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../../components/HalftimeReportDialog";
import DefensiveBreakdownDialog from "../../components/DefensiveBreakdownDialog";
import PlaybookEfficiencyWidget from "../../components/PlaybookEfficiencyWidget";
import { db, type StatEvent } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
} from "../../constants/stats";
import { getPlayerDisplayName } from "../../utils/stats";
import { formatClock, formatPlusMinus } from "../../utils/mathUtils";
import { MoleskineCard } from "../../components/SharedUI";

// Extracted modules
import { detectShotValueFromCoords } from "../../utils/courtUtils";
import { pulse } from "../../styles/animations";
import { EditClockDialog } from "../../components/EditClockDialog";
import { Scoreboard } from "../../components/Scoreboard";
import { TeamStatsCard } from "../../components/TeamStatsCard";
import { ActionControls } from "../../components/ActionControls";
import { useGameMode } from "../../hooks/useGameMode";
import { LineupPlayerButton } from "./GameModeComponents";

import OpponentScoutingSection from "./OpponentScoutingSection";
import StatEntryDialog from "./StatEntryDialog";
import { EndGameDialog, DeleteStatDialog } from "./GameModeDialogs";
import SparkPlugTable from "./SparkPlugTable";
import PlayerPerformanceTable from "./PlayerPerformanceTable";

const GameMode: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const gameId = searchParams.get("gameId");
  const teamId = searchParams.get("teamId");

  const lastEnergyAlertRef = React.useRef<string | null>(null);
  const {
    selectedX,
    setSelectedX,
    selectedY,
    setSelectedY,
    isDialogOpen,
    setIsDialogOpen,
    selectedPlayerId,
    setSelectedPlayerId,
    statType,
    setStatType,
    points,
    setPoints,
    playName,
    setPlayName,
    shotQuality,
    setShotQuality,
    clockSeconds,
    setClockSeconds,
    isClockRunning,
    setIsClockRunning,
    sortConfig,
    setSortConfig,
    markerFilter,
    setMarkerFilter,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    statToDelete,
    setStatToDelete,
    isEditing,
    setIsEditing,
    editingStatId,
    setEditingStatId,
    isEndGameDialogOpen,
    setIsEndGameDialogOpen,
    isClockEditDialogOpen,
    setIsClockEditDialogOpen,
    isSummaryDialogOpen,
    setIsSummaryDialogOpen,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isFtWorkflowOpen,
    setIsFtWorkflowOpen,
    situation,
    setSituation,
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    lastOpponentStatId,
    voiceEnabled,
    setVoiceEnabled,
    isListening,
    lastTranscript,
    matchupEfficiency,
    sparkPlugIndex,
    showMatchupMatrix,
    setShowMatchupMatrix,
    setLastOpponentStatId,
    isDeleting,
    setIsDeleting,
    isEnding,
    setIsEnding,
    isSavingStat,
    setIsSavingStat,
    chainPrompt,
    setChainPrompt,
    snackbar,
    setSnackbar,
    isSubDialogOpen,
    setIsSubDialogOpen,
    setSubOutPlayerId,
    draftOnCourtIds,
    setDraftOnCourtIds,
    selectedSwapId,
    setSelectedSwapId,
    period,
    setPeriod,
    trackingMode,
    setTrackingMode,
    gameStats,
    players,
    playerNamesMap,
    game,
    team,
    teamSeasonStats,
    isReadOnly,
    periodType,
    periodLabel,
    maxPeriod,
    sortedGameStats,
    gameData,
    jerseyMap,
    statsGridData,
    sortedStatsGridData,
    statsMap,
    matchups,
    opponentStats,
    halftimeStats,
    playerStreaks,
    playbookEfficiency,
    markers,
    clockSecondsRef,
  } = useGameMode(gameId, teamId);

  const handleUndo = useCallback(async () => {
    if (gameData.recentStats.length === 0) return;
    const lastStat = gameData.recentStats[0];
    if (lastStat.id) {
      try {
        await db.stats.update(lastStat.id, {
          deletedAt: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        setSnackbar({
          open: true,
          message: "Action undone",
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to undo stat:", err);
        setSnackbar({
          open: true,
          message: "Failed to undo action",
          severity: "error",
        });
      }
    }
  }, [gameData.recentStats, setSnackbar]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const handleEndGame = useCallback(async () => {
    setIsEnding(true);
    try {
      await db.games.update(gameId as string, { completed: 1, synced: 0 });
      await syncService.pushUpdates();
      setIsEndGameDialogOpen(false);
      setIsSummaryDialogOpen(true);
      setSnackbar({
        open: true,
        message: "Game finalized successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to end game:", err);
      setSnackbar({
        open: true,
        message: "Failed to finalize game",
        severity: "error",
      });
    } finally {
      setIsEnding(false);
    }
  }, [
    gameId,
    setIsEnding,
    setIsEndGameDialogOpen,
    setIsSummaryDialogOpen,
    setSnackbar,
  ]);

  const handleCourtClick = useCallback(
    (x: number, y: number) => {
      if (isReadOnly) return;
      setSelectedX(x);
      setSelectedY(y);
      setPoints(detectShotValueFromCoords(x, y));

      if (trackingMode === "OPPONENT") {
        setSelectedPlayerId(SPECIAL_PLAYER_IDS.OPPONENT);
      } else {
        setSelectedPlayerId(null);
      }
      setIsDialogOpen(true);
    },
    [
      isReadOnly,
      trackingMode,
      setSelectedX,
      setSelectedY,
      setPoints,
      setSelectedPlayerId,
      setIsDialogOpen,
    ],
  );

  const handleSaveStat = useCallback(
    async (currentType?: string) => {
      const typeToSave = currentType || statType;
      if (!selectedPlayerId || !typeToSave) return;

      setIsSavingStat(true);
      try {
        if (!gameId) {
          setIsSavingStat(false);
          return;
        }

        let primaryDefenderId: string | undefined = undefined;
        let derivedShotClockPhase: "EARLY" | "MID" | "LATE" | undefined =
          undefined;

        if (
          typeToSave === ACTION_TYPES.MAKE ||
          typeToSave === ACTION_TYPES.MISS
        ) {
          if (selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)) {
            primaryDefenderId = matchups[selectedPlayerId];
          }

          const elapsed = gameData.possessionStartClock - clockSeconds;
          if (elapsed <= 10) derivedShotClockPhase = "EARLY";
          else if (elapsed >= 20) derivedShotClockPhase = "LATE";
          else derivedShotClockPhase = "MID";
        }

        if (isEditing && editingStatId) {
          await db.stats.update(editingStatId, {
            playerId: selectedPlayerId!,
            type: typeToSave,
            points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
            playName:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? playName
                : undefined,
            shotQuality:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? (shotQuality ?? undefined)
                : undefined,
            situation: situation ?? undefined,
            shotClockPhase: derivedShotClockPhase,
            primaryDefenderId,
            defensiveScheme: game?.activeDefensiveScheme,
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
            playName:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? playName
                : undefined,
            shotQuality:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? (shotQuality ?? undefined)
                : undefined,
            situation: situation ?? undefined,
            shotClockPhase: derivedShotClockPhase,
            primaryDefenderId,
            defensiveScheme: game?.activeDefensiveScheme,
            period,
            clockTime: clockSeconds,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          const savedId = (await db.stats.add(newStat)) as string;
          await syncService.pushUpdates();

          if (trackingMode === "OPPONENT" && typeToSave === ACTION_TYPES.MAKE) {
            setLastOpponentStatId(savedId);
            setIsBreakdownDialogOpen(true);
          }

          if (
            trackingMode === "TEAM" &&
            !selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
          ) {
            if (typeToSave === ACTION_TYPES.MAKE && points > 1) {
              setChainPrompt({ type: "ASSIST", originalStat: newStat });
            } else if (typeToSave === ACTION_TYPES.MISS) {
              setChainPrompt({ type: "REBOUND", originalStat: newStat });
            }
          }

          if (typeToSave === ACTION_TYPES.FOUL_SHOOTING) {
            setIsFtWorkflowOpen(true);
          }
        }
        setSnackbar({
          open: true,
          message: isEditing ? "Action updated" : "Action recorded",
          severity: "success",
        });
        setIsDialogOpen(false);
        setStatType(null);
        setPlayName("");
        setSituation(null);
        setIsEditing(false);
        setEditingStatId(null);
        if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
      } catch (err) {
        logger.error("Failed to save stat:", err);
        setSnackbar({
          open: true,
          message: "Failed to save action",
          severity: "error",
        });
      } finally {
        setIsSavingStat(false);
      }
    },
    [
      statType,
      selectedPlayerId,
      gameId,
      isEditing,
      editingStatId,
      points,
      playName,
      selectedX,
      selectedY,
      period,
      trackingMode,
      clockSeconds,
      shotQuality,
      setIsSavingStat,
      setChainPrompt,
      setIsFtWorkflowOpen,
      setSnackbar,
      setIsDialogOpen,
      setStatType,
      setPlayName,
      setSituation,
      setIsEditing,
      setEditingStatId,
      setSelectedPlayerId,
      setLastOpponentStatId,
      setIsBreakdownDialogOpen,
      gameData.possessionStartClock,
      matchups,
      game?.activeDefensiveScheme,
      situation,
    ],
  );

  const handleSwapClick = useCallback(
    (id: string) => {
      if (!selectedSwapId || selectedSwapId === id) {
        setSelectedSwapId(selectedSwapId === id ? null : id);
        return;
      }

      const isAOnCourt =
        draftOnCourtIds.has(selectedSwapId) ||
        selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");

      if (isAOnCourt === isBOnCourt) {
        setSelectedSwapId(id);
        return;
      }

      setDraftOnCourtIds((prev) => {
        const next = new Set(prev);
        const [onCourt, bench] = isAOnCourt
          ? [selectedSwapId, id]
          : [id, selectedSwapId];

        if (!onCourt.startsWith("EMPTY")) next.delete(onCourt);
        if (!bench.startsWith("EMPTY")) next.add(bench);
        return next;
      });
      setSelectedSwapId(null);
    },
    [selectedSwapId, draftOnCourtIds, setSelectedSwapId, setDraftOnCourtIds],
  );

  const handleQuickSub = useCallback(async () => {
    if (!gameId || isReadOnly) return;

    try {
      const timestamp = new Date().toISOString();

      const originalOnCourt = gameData.onCourtIds;
      const finalOnCourt = draftOnCourtIds;

      const toSubOut = Array.from(originalOnCourt).filter(
        (id) => !finalOnCourt.has(id),
      );
      const toSubIn = Array.from(finalOnCourt).filter(
        (id) => !originalOnCourt.has(id) && !id.startsWith("EMPTY"),
      );

      for (const pId of toSubOut) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_OUT,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }

      for (const pId of toSubIn) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_IN,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }

      setIsSubDialogOpen(false);
      await syncService.pushUpdates();
      setSnackbar({
        open: true,
        message: "Substitution recorded",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to record quick sub:", err);
      setSnackbar({
        open: true,
        message: "Failed to record substitution",
        severity: "error",
      });
    }
  }, [
    gameId,
    isReadOnly,
    gameData.onCourtIds,
    draftOnCourtIds,
    period,
    clockSeconds,
    setIsSubDialogOpen,
    setSnackbar,
  ]);

  const handleDeleteStat = useCallback(async () => {
    if (!statToDelete) return;
    setIsDeleting(true);
    try {
      await db.stats.update(statToDelete, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setIsDeleteDialogOpen(false);
      setStatToDelete(null);
      setSnackbar({
        open: true,
        message: "Action deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to delete stat:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete action",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    statToDelete,
    setIsDeleting,
    setIsDeleteDialogOpen,
    setStatToDelete,
    setSnackbar,
  ]);

  const openEditDialog = useCallback(
    (stat: StatEvent) => {
      if (isReadOnly) return;
      setEditingStatId(stat.id ?? null);
      setSelectedPlayerId(stat.playerId as string);
      setStatType(stat.type);
      setPoints(stat.points || 2);
      setPlayName(stat.playName || "");
      setShotQuality(stat.shotQuality || null);
      setSituation(stat.situation || null);
      setSelectedX(stat.locationX || 0);
      setSelectedY(stat.locationY || 0);
      setIsEditing(true);
      setIsDialogOpen(true);
    },
    [
      isReadOnly,
      setEditingStatId,
      setSelectedPlayerId,
      setStatType,
      setPoints,
      setPlayName,
      setShotQuality,
      setSituation,
      setSelectedX,
      setSelectedY,
      setIsEditing,
      setIsDialogOpen,
    ],
  );

  useEffect(() => {
    if (!gameId || !teamId) {
      navigate("/");
      return;
    }

    const topSpark = sparkPlugIndex[0];
    if (topSpark && topSpark.compositeIndex >= 12 && !isReadOnly) {
      const alertKey = `${topSpark.playerId}-${topSpark.compositeIndex}`;
      if (lastEnergyAlertRef.current !== alertKey) {
        lastEnergyAlertRef.current = alertKey;
        const pName =
          playerNamesMap.get(topSpark.playerId)?.split(" ")[0] || "Player";
        const jersey = jerseyMap.get(topSpark.playerId);

        setSnackbar({
          open: true,
          message: `🔥 ENERGY ALERT: #${jersey} ${pName} is providing a massive Spark Plug impact!`,
          severity: "info",
        });
      }
    }
  }, [
    gameId,
    teamId,
    navigate,
    sparkPlugIndex,
    playerNamesMap,
    jerseyMap,
    isReadOnly,
    setSnackbar,
  ]);

  const handleToggleClock = useCallback(() => {
    setIsClockRunning((prev) => {
      const next = !prev;
      if (gameId) {
        db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }
      return next;
    });
  }, [gameId, setIsClockRunning, clockSecondsRef]);

  const handleEditClock = useCallback(
    async (mins: number, secs: number) => {
      const totalSeconds = mins * 60 + secs;
      setClockSeconds(totalSeconds);
      if (gameId) {
        try {
          await db.games.update(gameId, {
            clockTime: totalSeconds,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
      setIsClockEditDialogOpen(false);
    },
    [gameId, setClockSeconds, setIsClockEditDialogOpen],
  );

  const handleNextPeriod = useCallback(async () => {
    const nextPeriod = period < 10 ? period + 1 : 1;
    setPeriod(nextPeriod);

    const defaultMins = periodType === "QUARTERS" ? 10 : 20;
    const nextSeconds = defaultMins * 60;
    setClockSeconds(nextSeconds);
    setIsClockRunning(false);

    if (gameId) {
      try {
        await db.games.update(gameId, {
          currentPeriod: nextPeriod,
          clockTime: nextSeconds,
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to update game period:", err);
      }
    }
  }, [
    gameId,
    period,
    periodType,
    setPeriod,
    setClockSeconds,
    setIsClockRunning,
  ]);

  const handleTimeout = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId:
          trackingMode === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        type: ACTION_TYPES.TIMEOUT,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record timeout:", err);
    }
  }, [gameId, isReadOnly, trackingMode, period, clockSeconds]);

  const handleAuditSubs = useCallback(() => {
    setIsAuditDialogOpen(true);
  }, [setIsAuditDialogOpen]);

  const handleTogglePossession = useCallback(async () => {
    if (!gameId || isReadOnly) return;

    const targetTeam =
      gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
        ? SPECIAL_PLAYER_IDS.OPPONENT
        : SPECIAL_PLAYER_IDS.OUR_TEAM;

    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId: targetTeam,
        type: ACTION_TYPES.POSSESSION,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle possession:", err);
    }
  }, [gameId, isReadOnly, period, gameData.possessionState, clockSeconds]);

  const handleChainAction = useCallback(
    async (pId: string, type: string) => {
      if (!chainPrompt || !gameId) return;
      const { originalStat } = chainPrompt;

      try {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId: pId,
          type,
          period: originalStat.period,
          clockTime: originalStat.clockTime,
          timestamp: originalStat.timestamp,
          synced: 0,
        });
        await syncService.pushUpdates();
        setChainPrompt(null);
        setSnackbar({
          open: true,
          message: `${type} recorded`,
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to save chained stat:", err);
      }
    },
    [chainPrompt, gameId, setChainPrompt, setSnackbar],
  );

  const handleLineupPlayerClick = useCallback(
    (playerId: string) => {
      setSubOutPlayerId(playerId);
      setIsSubDialogOpen(true);
    },
    [setSubOutPlayerId, setIsSubDialogOpen],
  );

  if (!gameId || !teamId) {
    return null;
  }

  return (
    <Box sx={{ pb: 4, opacity: isReadOnly ? 0.7 : 1 }}>
      {isReadOnly && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          This game is in read-only mode because it or its parent is pending
          deletion.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {voiceEnabled && (
            <Alert
              severity={isListening ? "info" : "warning"}
              icon={
                isListening ? (
                  <Mic sx={{ animation: `${pulse} 2s infinite` }} />
                ) : (
                  <MicOff />
                )
              }
              sx={{ mb: 2, borderRadius: 2, fontWeight: 700 }}
            >
              {isListening
                ? "Voice Mode Active: Listening for commands..."
                : "Voice Mode Paused"}
              {lastTranscript && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                >
                  Last heard: "{lastTranscript}"
                </Typography>
              )}
            </Alert>
          )}

          <Scoreboard
            game={game}
            team={team}
            gameData={gameData}
            period={period}
            periodLabel={periodLabel}
            maxPeriod={maxPeriod}
            isReadOnly={isReadOnly}
            clockSeconds={clockSeconds}
            isClockRunning={isClockRunning}
            onEditClock={() => {
              if (!isReadOnly) {
                setIsClockEditDialogOpen(true);
              }
            }}
          />

          <MoleskineCard
            sx={{
              border:
                trackingMode === "OPPONENT"
                  ? `2px solid ${theme.palette.secondary.main}`
                  : "1px solid rgba(0,0,0,0.12)",
              transition: "border 0.3s ease",
            }}
          >
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <ActionControls
                isReadOnly={isReadOnly}
                onUndo={handleUndo}
                onQuickSub={() => setIsSubDialogOpen(true)}
                onFtWorkflow={() => {
                  if (selectedPlayerId) {
                    setIsFtWorkflowOpen(true);
                  } else {
                    setSnackbar({
                      open: true,
                      message: "Select a player first",
                      severity: "warning",
                    });
                  }
                }}
                onAuditSubs={handleAuditSubs}
                onTimeout={handleTimeout}
                onNextPeriod={handleNextPeriod}
                onTogglePossession={() => handleTogglePossession()}
                possessionState={gameData.possessionState}
                recentStatsLength={gameData.recentStats.length}
                onEndGame={() => setIsEndGameDialogOpen(true)}
                isGameCompleted={!!game?.completed}
                isEnding={isEnding}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <Tooltip
                  title={
                    voiceEnabled ? "Disable Voice Mode" : "Enable Voice Mode"
                  }
                >
                  <IconButton
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    color={voiceEnabled ? "primary" : "default"}
                    sx={{
                      border: "1px solid",
                      borderColor: voiceEnabled ? "primary.main" : "divider",
                      borderRadius: 1,
                    }}
                  >
                    {voiceEnabled ? <Mic /> : <MicOff />}
                  </IconButton>
                </Tooltip>

                <ToggleButtonGroup
                  value={trackingMode}
                  exclusive
                  aria-label="Tracking Mode"
                  onChange={(_, val) => val && setTrackingMode(val)}
                  size="small"
                  disabled={isReadOnly}
                  fullWidth={theme.breakpoints.down("sm") !== null}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <ToggleButton value="TEAM">
                    {team?.name || "Our Team"}
                  </ToggleButton>
                  <ToggleButton value="OPPONENT">
                    {game?.opponent || "Opponent"}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
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
                {[
                  "ALL",
                  "MAKE",
                  "MISS",
                  "REBOUND",
                  "ASSIST",
                  "STEAL",
                  "BLOCK",
                ].map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => setMarkerFilter(type)}
                    variant={markerFilter === type ? "filled" : "outlined"}
                    size="small"
                    color={markerFilter === type ? "primary" : "default"}
                  />
                ))}
              </Box>
            </Box>

            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={markers}
            />
          </MoleskineCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <MoleskineCard>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, color: "text.secondary" }}
                >
                  MATCHUP ANALYTICS
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowMatchupMatrix(!showMatchupMatrix)}
                  color={showMatchupMatrix ? "primary" : "default"}
                >
                  <GridOn fontSize="small" />
                </IconButton>
              </Box>
              {showMatchupMatrix && (
                <MatchupMatrix
                  teamActiveIds={Array.from(gameData.onCourtIds)}
                  oppActiveIds={opponentStats.slice(0, 5).map((o) => o.id)}
                  matchupData={matchupEfficiency}
                  jerseyMap={jerseyMap}
                  currentMatchups={matchups}
                  onReassign={async (oId, tId) => {
                    if (!gameId) return;
                    const newMatchups = {
                      ...(matchups || {}),
                      [oId]: matchups[oId] === tId ? "" : tId,
                    };
                    await db.games.update(gameId, {
                      matchups: newMatchups,
                      synced: 0,
                    });
                    await syncService.pushUpdates();
                  }}
                />
              )}
            </MoleskineCard>

            <TeamStatsCard
              defensiveStats={gameData.defensiveStats}
              teamPpp={gameData.teamPpp}
              oppPpp={gameData.oppPpp}
              livePace={gameData.livePace}
              refTightness={gameData.refTightness}
              activeSchemePpp={
                gameData.schemeEfficiency.find(
                  (s) => s.name === game?.activeDefensiveScheme,
                )?.ppp
              }
            />

            <MoleskineCard>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  display: "block",
                  color: "text.secondary",
                }}
              >
                ACTIVE DEFENSIVE SCHEME
              </Typography>
              <ToggleButtonGroup
                value={game?.activeDefensiveScheme || "MAN"}
                exclusive
                onChange={async (_, val) => {
                  if (val && gameId) {
                    await db.games.update(gameId, {
                      activeDefensiveScheme: val,
                      synced: 0,
                    });
                    await syncService.pushUpdates();
                  }
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="MAN" sx={{ fontSize: "0.65rem" }}>
                  MAN
                </ToggleButton>
                <ToggleButton value="ZONE" sx={{ fontSize: "0.65rem" }}>
                  ZONE
                </ToggleButton>
                <ToggleButton value="PRESS" sx={{ fontSize: "0.65rem" }}>
                  PRESS
                </ToggleButton>
                <ToggleButton value="DOUBLE" sx={{ fontSize: "0.65rem" }}>
                  DOUBLE
                </ToggleButton>
              </ToggleButtonGroup>
            </MoleskineCard>

            {trackingMode === "TEAM" && (
              <PlaybookEfficiencyWidget
                plays={playbookEfficiency}
                teamPpp={parseFloat(gameData.teamPpp)}
                gameStats={sortedGameStats}
              />
            )}

            {trackingMode === "TEAM" ? (
              <>
                <MoleskineCard>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          color: "primary.main",
                        }}
                      >
                        Live Lineup
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          fontFamily: "'Courier New', monospace",
                          opacity: 0.9,
                        }}
                      >
                        STINT:{" "}
                        {formatClock(gameData.currentLineupStintDuration)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="h6"
                        data-testid="lineup-plus-minus"
                        sx={{
                          fontWeight: 900,
                          color:
                            gameData.currentLineupPlusMinus >= 0
                              ? "success.main"
                              : "error.main",
                          lineHeight: 1,
                          fontSize: "1.2rem",
                        }}
                      >
                        {formatPlusMinus(gameData.currentLineupPlusMinus)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          opacity: 0.6,
                        }}
                      >
                        Net Impact
                      </Typography>
                    </Box>
                  </Box>
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
                        <LineupPlayerButton
                          key={p.id}
                          player={p}
                          stats={statsMap.get(p.id!)}
                          jerseyNumber={jerseyMap.get(p.id!) || ""}
                          isReadOnly={isReadOnly}
                          period={period}
                          game={game}
                          team={team}
                          stintSecs={gameData.stintDurations.get(p.id!) || 0}
                          periodFouls={
                            gameData.onCourtPeriodFouls.get(p.id!) || 0
                          }
                          streak={playerStreaks.get(p.id!)}
                          onClick={handleLineupPlayerClick}
                        />
                      ))}
                    {Array.from({
                      length: Math.max(0, 5 - gameData.onCourtIds.size),
                    }).map((_, i) => {
                      const emptyId = `EMPTY-${i}`;
                      return (
                        <Button
                          key={emptyId}
                          variant="outlined"
                          disabled={isReadOnly}
                          aria-label={`Empty lineup slot ${i + 1}, click to assign player`}
                          onClick={() => {
                            setSubOutPlayerId(emptyId);
                            setIsSubDialogOpen(true);
                          }}
                          fullWidth
                          sx={{
                            justifyContent: "flex-start",
                            borderStyle: "dashed",
                            color: "text.secondary",
                            px: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: "0.65rem",
                              mr: 1,
                              bgcolor: "transparent",
                              border: "1px dashed #ccc",
                              color: "text.secondary",
                            }}
                          >
                            +
                          </Avatar>
                          <Typography variant="caption">Empty Slot</Typography>
                        </Button>
                      );
                    })}
                  </Box>
                </MoleskineCard>

                {chainPrompt && (
                  <MoleskineCard
                    sx={{
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        WHO GOT THE {chainPrompt.type}?
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setChainPrompt(null)}
                        sx={{ color: "white" }}
                      >
                        <History fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                      }}
                    >
                      {players
                        .filter((p) => gameData.onCourtIds.has(p.id!))
                        .map((p) => (
                          <Button
                            key={p.id}
                            variant="contained"
                            size="small"
                            onClick={() =>
                              handleChainAction(p.id!, chainPrompt.type)
                            }
                            sx={{
                              bgcolor: "white",
                              color: "primary.main",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                            }}
                          >
                            #{jerseyMap.get(p.id!)}
                          </Button>
                        ))}
                    </Box>
                  </MoleskineCard>
                )}

                <MoleskineCard>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Player Performance
                  </Typography>
                  <SparkPlugTable
                    sparkPlugIndex={sparkPlugIndex}
                    jerseyMap={jerseyMap}
                    playerNamesMap={playerNamesMap}
                  />
                  <PlayerPerformanceTable
                    sortedStatsGridData={sortedStatsGridData}
                    sortConfig={sortConfig}
                    onSort={(key) =>
                      setSortConfig({
                        key,
                        direction:
                          sortConfig.key === key && sortConfig.direction === "asc"
                            ? "desc"
                            : "asc",
                      })
                    }
                    playerStreaks={playerStreaks}
                    onCourtIds={gameData.onCourtIds}
                  />
                </MoleskineCard>
              </>
            ) : (
              <OpponentScoutingSection
                opponentStats={opponentStats}
                opponentName={game?.opponent || "Opponent"}
                players={statsGridData}
                onCourtIds={gameData.onCourtIds}
                matchups={matchups}
                jerseyMap={jerseyMap}
                onAssignDefender={async (oppId, pId) => {
                  if (!gameId) return;
                  const newMatchups = {
                    ...(game?.matchups || {}),
                    [oppId]: matchups[oppId] === pId ? "" : pId,
                  };
                  await db.games.update(gameId, {
                    matchups: newMatchups,
                    synced: 0,
                  });
                  await syncService.pushUpdates();
                }}
              />
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
                {gameData.recentStats.filter((s) => !s.deletedAt).length ===
                0 ? (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      border: "1px dashed #D1D1D1",
                      borderRadius: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <History sx={{ color: "text.secondary", opacity: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      No actions recorded yet. Tap the court or use quick
                      actions to start tracking.
                    </Typography>
                  </Box>
                ) : (
                  gameData.recentStats.map((s, index) => (
                    <RecentActionItem
                      key={s.id}
                      stat={s}
                      playerName={getPlayerDisplayName(
                        s.playerId,
                        playerNamesMap,
                        game?.opponent,
                        team?.name,
                      )}
                      periodLabel={periodLabel}
                      isReadOnly={isReadOnly}
                      isLatest={index === 0}
                      onEdit={openEditDialog}
                      onDelete={(id) => {
                        setStatToDelete(id);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  ))
                )}
              </Stack>
            </MoleskineCard>
          </Stack>
        </Grid>
      </Grid>

      <StatEntryDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedPlayerId={selectedPlayerId}
        statType={statType}
        points={points}
        playName={playName}
        shotQuality={shotQuality}
        situation={situation}
        trackingMode={trackingMode}
        players={statsGridData}
        onCourtIds={gameData.onCourtIds}
        jerseyMap={jerseyMap}
        onSave={handleSaveStat}
        onSetStatType={setStatType}
        onSetSelectedPlayerId={setSelectedPlayerId}
        onSetPoints={setPoints}
        onSetPlayName={setPlayName}
        onSetShotQuality={setShotQuality}
        onSetSituation={setSituation}
        isEditing={isEditing}
        isSavingStat={isSavingStat}
        playerName={selectedPlayerId ? getPlayerDisplayName(selectedPlayerId, playerNamesMap, game?.opponent, team?.name) : "Select Player"}
        periodLabel={periodLabel}
        period={period}
        clockSeconds={clockSeconds}
        teamPlaybook={team?.playbook || []}
        periodType={periodType}
        oppFouls={gameData.teamFoulStats.oppFouls}
      />

      <EndGameDialog
        open={isEndGameDialogOpen}
        onClose={() => setIsEndGameDialogOpen(false)}
        onConfirm={handleEndGame}
        isEnding={isEnding}
      />

      <Dialog
        open={isSummaryDialogOpen}
        onClose={() => setIsSummaryDialogOpen(false)}
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
              setIsSummaryDialogOpen(false);
            }}
            sx={{ mr: 2 }}
          >
            Close & Review Actions
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setIsSummaryDialogOpen(false);
              navigate(`/game/stats?gameId=${gameId}`);
            }}
          >
            View Box Score
          </Button>
        </DialogActions>
      </Dialog>

      <QuickSubDialog
        open={isSubDialogOpen}
        onClose={() => setIsSubDialogOpen(false)}
        players={players}
        team={team}
        game={game}
        draftOnCourtIds={draftOnCourtIds}
        selectedSwapId={selectedSwapId}
        statsMap={statsMap}
        jerseyMap={jerseyMap}
        handleSwapClick={handleSwapClick}
        handleQuickSub={handleQuickSub}
      />

      {gameId && (
        <SubstitutionAuditDialog
          open={isAuditDialogOpen}
          onClose={() => setIsAuditDialogOpen(false)}
          gameId={gameId}
          players={players}
          jerseyMap={jerseyMap}
        />
      )}

      {gameId && selectedPlayerId && (
        <FreeThrowWorkflowDialog
          open={isFtWorkflowOpen}
          onClose={() => setIsFtWorkflowOpen(false)}
          gameId={gameId}
          playerId={selectedPlayerId}
          player={players.find((p) => p.id === selectedPlayerId)}
          jerseyNumber={jerseyMap.get(selectedPlayerId)}
          period={period}
          clockTime={clockSeconds}
        />
      )}

      <DefensiveBreakdownDialog
        open={isBreakdownDialogOpen}
        onClose={async (reason) => {
          setIsBreakdownDialogOpen(false);
          if (reason && lastOpponentStatId) {
            try {
              await db.stats.update(lastOpponentStatId, {
                breakdownReason: reason,
                synced: 0,
              });
              await syncService.pushUpdates();
              setSnackbar({
                open: true,
                message: "Breakdown reason attributed",
                severity: "success",
              });
            } catch (err) {
              logger.error("Failed to update breakdown reason:", err);
            }
          }
          setLastOpponentStatId(null);
        }}
      />

      <HalftimeReportDialog
        open={isHalftimeReportOpen}
        onClose={() => setIsHalftimeReportOpen(false)}
        teamPpp={gameData.teamPpp}
        oppPpp={gameData.oppPpp}
        seasonPpp={teamSeasonStats?.ppp || "0.00"}
        topLineups={halftimeStats.lineupStats}
        bottomLineups={[...halftimeStats.lineupStats].reverse()}
        opponentThreats={gameData.momentumAlerts.opponentThreats}
        schemeEfficiency={halftimeStats.schemeEfficiency}
        jerseyMap={jerseyMap}
      />

      <DeleteStatDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteStat}
        isDeleting={isDeleting}
        statToDelete={statToDelete}
        gameStats={gameStats}
        playerNamesMap={playerNamesMap}
        gameOpponent={game?.opponent}
      />

      {!isReadOnly && !game?.completed && (
        <Tooltip
          title={isClockRunning ? "Pause Clock (Space)" : "Start Clock (Space)"}
        >
          <IconButton
            onClick={handleToggleClock}
            sx={{
              position: "fixed",
              bottom: 32,
              right: 32,
              width: 64,
              height: 64,
              bgcolor: isClockRunning ? "warning.main" : "success.main",
              color: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              zIndex: theme.zIndex.speedDial,
              "&:hover": {
                bgcolor: isClockRunning ? "warning.dark" : "success.dark",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease-in-out",
            }}
            aria-label={isClockRunning ? "Pause Clock" : "Start Clock"}
          >
            {isClockRunning ? (
              <Pause sx={{ fontSize: 32 }} />
            ) : (
              <PlayArrow sx={{ fontSize: 32 }} />
            )}
          </IconButton>
        </Tooltip>
      )}

      <EditClockDialog
        open={isClockEditDialogOpen}
        onClose={() => setIsClockEditDialogOpen(false)}
        onSave={handleEditClock}
        initialMinutes={Math.floor(clockSeconds / 60)}
        initialSeconds={clockSeconds % 60}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GameMode;
