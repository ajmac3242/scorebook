/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Allows users to record statistical events (makes, misses, rebounds, etc.)
 * on an interactive court, manage active lineups, and track opponent scoring.
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
  DialogContentText,
  Stack,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Tooltip,
  Snackbar,
  Divider,
} from "@mui/material";

import {
  History,
  SportsBasketball,
  Undo as UndoIcon,
  Warning,
  PlayArrow,
  Pause,
  Check,
  Close,
  PanTool,
  SwapHoriz,
  FlashOn,
  Mic,
  MicOff,
  GridOn,
  Shield,
  ArrowBack,
  HelpOutline,
} from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  useMediaQuery,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import RecentActionItem from "../components/RecentActionItem";
import { MatchupMatrix } from "../components/MatchupMatrix";
import QuickSubDialog from "../components/QuickSubDialog";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../components/HalftimeReportDialog";
import { ClutchPerformanceHUD } from "../components/ClutchPerformanceHUD";
import DefensiveBreakdownDialog from "../components/DefensiveBreakdownDialog";
import PlaybookEfficiencyWidget from "../components/PlaybookEfficiencyWidget";
import { TacticalAlertsSidebar } from "../components/TacticalAlertsSidebar";
import { TacticalIdentityHUD } from "../components/TacticalIdentityHUD";
import { VerifiedPeriodModal } from "../components/VerifiedPeriodModal";
import { PlayerStatRow } from "../components/PlayerStatRow";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
  SITUATIONS,
} from "../constants/stats";
import { type PlayerAggregates, getPlayerDisplayName } from "../utils/stats";
import { formatClock, formatPlusMinus } from "../utils/mathUtils";
import { MoleskineCard } from "../components/SharedUI";

// Extracted modules
import { detectShotValueFromCoords } from "../utils/courtUtils";
import { pulse } from "../styles/animations";
import { EditClockDialog } from "../components/EditClockDialog";
import { Scoreboard } from "../components/Scoreboard";
import { TeamStatsCard } from "../components/TeamStatsCard";
import { ActionControls } from "../components/ActionControls";
import { useGameMode } from "../hooks/useGameMode";
import { QuickAction, LineupPlayerButton } from "./GameMode/GameModeComponents";

/**
 * GameMode page component.
 * Manages the state for live game tracking, including selections,
 * dialogs for recording actions, and real-time score calculation.
 */
const GameMode: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract game and team IDs from URL parameters
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
    isVerificationOpen,
    handleVerifyPeriod,
    situation,
    setSituation,
    opponentPlayType,
    setOpponentPlayType,
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
    isSavingSub,
    setIsSavingSub,
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
    sortedStatsGridData,
    statsMap,
    matchups,
    opponentStats,
    halftimeStats,
    playerStreaks,
    playbookEfficiency,
    markers,
    clockSecondsRef,
    shotROI,
    isClutchMode,
    clutchStats,
    paintTouchStats,
    haltAlerts,
  } = useGameMode(gameId, teamId);

  /**
   * Undoes the most recent statistical action.
   */
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

  // 🧠 Clarity: Keyboard shortcut for Undo (Ctrl+Z or Cmd+Z)
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

  /**
   * Finalizes the game, marking it as completed and triggering a sync.
   */
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

  /**
   * Handles a click on the court to start recording an action.
   * @param {number} x - The X coordinate on the court.
   * @param {number} y - The Y coordinate on the court.
   */
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

  /**
   * Saves a new or edited statistical event to IndexedDB.
   * @param {string} currentType - (Optional) Overrides the stat type.
   */
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
            opponentPlayType:
              (typeToSave === ACTION_TYPES.MAKE ||
                typeToSave === ACTION_TYPES.MISS) &&
              selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
                ? (opponentPlayType as StatEvent["opponentPlayType"])
                : undefined,
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
            opponentPlayType:
              (typeToSave === ACTION_TYPES.MAKE ||
                typeToSave === ACTION_TYPES.MISS) &&
              selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
                ? (opponentPlayType as StatEvent["opponentPlayType"])
                : undefined,
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
          action: "UNDO",
        });
        setIsDialogOpen(false);
        setStatType(null);
        setPlayName("");
        setSituation(null);
        setOpponentPlayType(null);
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
      opponentPlayType,
      setOpponentPlayType,
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
    if (!gameId || isReadOnly || isSavingSub) return;

    setIsSavingSub(true);
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
        message: `Lineup updated: substituted ${toSubIn.length} in, ${toSubOut.length} out`,
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to record quick sub:", err);
      setSnackbar({
        open: true,
        message: "Failed to record substitution",
        severity: "error",
      });
    } finally {
      setIsSavingSub(false);
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
    isSavingSub,
    setIsSavingSub,
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

    // Energy Alert Logic: Trigger snackbar if a player's composite index is very high
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

  const handleTogglePossession = useCallback(
    async (manualTarget?: string) => {
      if (!gameId || isReadOnly) return;

      const targetTeam =
        manualTarget ||
        (gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
          ? SPECIAL_PLAYER_IDS.OPPONENT
          : SPECIAL_PLAYER_IDS.OUR_TEAM);

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
    },
    [gameId, isReadOnly, period, gameData.possessionState, clockSeconds],
  );

  const handleOpponentTurnover = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        type: ACTION_TYPES.TURNOVER,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      // Auto-flip possession to Our Team after an opponent turnover
      await handleTogglePossession(SPECIAL_PLAYER_IDS.OUR_TEAM);
      setSnackbar({
        open: true,
        message: "Opponent turnover recorded",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to record opponent turnover:", err);
    }
  }, [gameId, isReadOnly, period, clockSeconds, handleTogglePossession]);

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

        if (type === ACTION_TYPES.ASSIST) {
          setChainPrompt({
            type: ACTION_TYPES.HOCKEY_ASSIST as "HOCKEY_ASSIST",
            originalStat,
          });
        } else {
          setChainPrompt(null);
        }

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

  /**
   * Handler for LineupPlayerButton clicks.
   * Memoized to prevent re-renders of LineupPlayerButton.
   */
  const handleLineupPlayerClick = useCallback(
    (playerId: string) => {
      setSubOutPlayerId(playerId);
      setIsSubDialogOpen(true);
    },
    [setSubOutPlayerId, setIsSubDialogOpen],
  );

  /**
   * Handler for QuickAction clicks.
   * Memoized to prevent re-renders of QuickAction.
   */
  const handleQuickActionClick = useCallback(
    (type: string | null) => {
      setStatType(type);
    },
    [setStatType],
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
        <Grid size={{ xs: 12 }} md={8}>
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

          <Box
            sx={{ mb: 2, bgcolor: "rgba(0,0,0,0.02)", p: 1, borderRadius: 2 }}
          >
            <TacticalIdentityHUD
              kpis={[
                {
                  name: "paint_touches",
                  label: "Paint Touches",
                  value: paintTouchStats.total,
                  target: 25,
                },
                {
                  name: "efg",
                  label: "eFG%",
                  value: Math.round(parseFloat(gameData.teamPpp) * 50), // Rough eFG estimate for demo
                  target: 52,
                  isPercentage: true,
                },
                {
                  name: "stop_pct",
                  label: "Stop %",
                  value: gameData.defensiveStats.stopPct,
                  target: 60,
                  isPercentage: true,
                },
              ]}
            />
          </Box>

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
                onOpponentTurnover={handleOpponentTurnover}
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
            {isMobile && !isReadOnly && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  textAlign: "center",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                Tip: Tap the court to record a play at that location
              </Typography>
            )}
          </MoleskineCard>
        </Grid>

        <Grid size={{ xs: 12 }} md={4}>
          <Stack spacing={3}>
            {isClutchMode && (
              <MoleskineCard
                sx={{
                  bgcolor: "rgba(211, 47, 47, 0.05)",
                  border: "2px solid",
                  borderColor: "error.main",
                  animation: `${pulse} 4s infinite ease-in-out`,
                }}
              >
                <ClutchPerformanceHUD
                  onCourtStats={clutchStats.filter((p) =>
                    gameData.onCourtIds.has(p.id.toString()),
                  )}
                  jerseyMap={jerseyMap}
                />
              </MoleskineCard>
            )}

            <MoleskineCard>
              <TacticalAlertsSidebar alerts={haltAlerts} />
            </MoleskineCard>

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
              {!showMatchupMatrix && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "rgba(255,152,0,0.05)",
                    border: "1px solid rgba(255,152,0,0.1)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "warning.dark",
                      textTransform: "uppercase",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Target Attack
                  </Typography>
                  {(() => {
                    const sorted = [...matchupEfficiency].sort(
                      (a, b) => a.stopPct - b.stopPct,
                    );
                    const target = sorted[0];
                    if (!target || target.possessions < 3) {
                      return (
                        <Typography variant="caption" color="text.secondary">
                          Collecting data... (min. 3 possessions)
                        </Typography>
                      );
                    }
                    return (
                      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.6rem",
                            bgcolor: "error.main",
                            fontWeight: 900,
                          }}
                        >
                          {target.oppPlayerJersey}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 800, display: "block" }}
                          >
                            Attack Opponent #{target.oppPlayerJersey}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 700 }}
                          >
                            Stop %: {target.stopPct}% ({target.possessions}{" "}
                            poss)
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })()}
                </Box>
              )}
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
                  fontWeight: 800,
                  color: "primary.main",
                  textTransform: "uppercase",
                  display: "block",
                  mb: 1,
                }}
              >
                Offensive Identity (KPIs)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {paintTouchStats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PAINT TOUCHES
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, color: "primary.main" }}
                  >
                    {paintTouchStats.pppt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PTS / TOUCH
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5, opacity: 0.1 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "primary.main",
                  textTransform: "uppercase",
                  display: "block",
                  mb: 1,
                }}
              >
                Quality Control (xPTS)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {shotROI.avgXPts}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    xPTS / POSS
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      color:
                        parseFloat(shotROI.roi) >= 0
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {parseFloat(shotROI.roi) > 0 ? "+" : ""}
                    {Math.round(parseFloat(shotROI.roi) * 100)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SHOT ROI
                  </Typography>
                </Grid>
              </Grid>
            </MoleskineCard>

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
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Player Performance
                  </Typography>
                  <TableContainer sx={{ mt: 2, mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        display: "block",
                        textTransform: "uppercase",
                        color: "primary.main",
                      }}
                    >
                      SPARK PLUG MOMENTUM INDEX
                    </Typography>
                    <Table size="small" aria-label="Spark Plug Momentum Index">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{ fontSize: "0.6rem", fontWeight: 800 }}
                          >
                            PLAYER
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontSize: "0.6rem", fontWeight: 800 }}
                          >
                            HUSTLE
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontSize: "0.6rem", fontWeight: 800 }}
                          >
                            RUN PTS
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontSize: "0.6rem", fontWeight: 800 }}
                          >
                            INDEX
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sparkPlugIndex.slice(0, 3).map((spi) => (
                          <TableRow key={spi.playerId}>
                            <TableCell
                              sx={{ fontSize: "0.65rem", fontWeight: 700 }}
                            >
                              #{jerseyMap.get(spi.playerId)}{" "}
                              {playerNamesMap.get(spi.playerId)?.split(" ")[0]}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {spi.hustleStats}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {spi.momentumScore}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={spi.compositeIndex}
                                size="small"
                                color={
                                  spi.compositeIndex >= 10
                                    ? "primary"
                                    : "default"
                                }
                                sx={{
                                  height: 18,
                                  fontSize: "0.6rem",
                                  fontWeight: 800,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TableContainer>
                    <Table size="small" aria-label="Player Performance">
                      <TableHead>
                        <TableRow>
                          {[
                            {
                              label: "#",
                              key: "jerseyNumber",
                              desc: "Jersey Number",
                            },
                            { label: "NAME", key: "name", desc: "Player Name" },
                            {
                              label: "MIN",
                              key: "min",
                              desc: "Minutes Played",
                            },
                            {
                              label: "PTS",
                              key: "points",
                              desc: "Points Scored",
                            },
                            {
                              label: "REB",
                              key: "rebounds",
                              desc: "Total Rebounds",
                            },
                            { label: "AST", key: "assists", desc: "Assists" },
                            {
                              label: "PF",
                              key: "fouls",
                              desc: "Personal Fouls",
                            },
                            {
                              label: "+/-",
                              key: "plusMinus",
                              desc: "Plus/Minus Rating",
                            },
                          ].map((head) => (
                            <TableCell
                              key={head.key}
                              sx={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                px: 0.5,
                              }}
                            >
                              <Tooltip title={head.desc} arrow placement="top">
                                <TableSortLabel
                                  active={sortConfig.key === head.key}
                                  direction={
                                    sortConfig.key === head.key
                                      ? sortConfig.direction
                                      : "asc"
                                  }
                                  onClick={() =>
                                    setSortConfig({
                                      key: head.key as keyof PlayerAggregates,
                                      direction:
                                        sortConfig.key === head.key &&
                                        sortConfig.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    })
                                  }
                                >
                                  {head.label}
                                </TableSortLabel>
                              </Tooltip>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedStatsGridData.map((row) => (
                          <PlayerStatRow
                            key={row.id}
                            jerseyNumber={row.jerseyNumber?.toString() ?? ""}
                            name={row.name}
                            min={row.min}
                            points={row.points}
                            threePM={row.threePM}
                            threePA={row.threePA}
                            threePPct={row.threePPct}
                            ftm={row.ftm}
                            fta={row.fta}
                            ftPct={row.ftPct}
                            rebounds={row.rebounds}
                            assists={row.assists}
                            steals={row.steals}
                            blocks={row.blocks}
                            turnovers={row.turnovers}
                            fouls={row.fouls}
                            plusMinus={row.plusMinus}
                            streak={playerStreaks.get(row.id.toString())}
                            isOnCourt={gameData.onCourtIds.has(
                              row.id.toString(),
                            )}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MoleskineCard>
              </>
            ) : (
              <MoleskineCard
                sx={{
                  bgcolor: "rgba(0,0,0,0.02)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{game?.opponent || "Opponent"} Scouting</span>
                  <Chip
                    label="Live Tracking"
                    size="small"
                    color="secondary"
                    sx={{ height: 18, fontSize: "0.6rem" }}
                  />
                </Typography>

                <Stack spacing={1} sx={{ mt: 2 }}>
                  {opponentStats.length > 0 ? (
                    opponentStats.map((opp) => (
                      <Box
                        key={opp.id}
                        sx={{
                          p: 1.5,
                          bgcolor: "white",
                          borderRadius: 2,
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "secondary.main",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              {opp.jersey}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                              >
                                Opponent #{opp.jersey}
                                {opp.isHot && (
                                  <Box
                                    component="span"
                                    sx={{ ml: 1, fontSize: "1rem" }}
                                  >
                                    🔥
                                  </Box>
                                )}
                                {opp.isClutchThreat && (
                                  <Chip
                                    label="CLUTCH THREAT"
                                    size="small"
                                    color="error"
                                    sx={{
                                      ml: 1,
                                      height: 16,
                                      fontSize: "0.55rem",
                                      fontWeight: 800,
                                    }}
                                  />
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {opp.points} pts | {opp.makes}-{opp.attempts} FG
                                | {opp.turnovers} TO
                              </Typography>
                            </Box>
                          </Box>
                          {opp.straightPoints >= 4 && (
                            <Chip
                              label={`${opp.straightPoints} STRAIGHT`}
                              size="small"
                              color="error"
                              sx={{
                                height: 16,
                                fontSize: "0.55rem",
                                fontWeight: 800,
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              display: "block",
                              mb: 0.5,
                              color: "text.secondary",
                            }}
                          >
                            Primary Defender
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(5, 1fr)",
                              gap: 0.5,
                            }}
                          >
                            {players
                              .filter((p) => gameData.onCourtIds.has(p.id!))
                              .map((p) => (
                                <Button
                                  key={p.id}
                                  variant={
                                    matchups[opp.id] === p.id
                                      ? "contained"
                                      : "outlined"
                                  }
                                  size="small"
                                  onClick={async () => {
                                    if (!gameId) return;
                                    const newMatchups = {
                                      ...(game?.matchups || {}),
                                      [opp.id]:
                                        matchups[opp.id] === p.id ? "" : p.id!,
                                    };
                                    await db.games.update(gameId, {
                                      matchups: newMatchups,
                                      synced: 0,
                                    });
                                    await syncService.pushUpdates();
                                  }}
                                  sx={{
                                    minWidth: 0,
                                    p: 0.5,
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    height: 24,
                                  }}
                                >
                                  #{jerseyMap.get(p.id!)}
                                </Button>
                              ))}
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box
                      sx={{
                        py: 3,
                        textAlign: "center",
                        border: "1px dashed #ccc",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No opponent players tracked yet.
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Box
                  sx={{
                    mt: 3,
                    p: 1.5,
                    bgcolor: "secondary.light",
                    borderRadius: 2,
                    color: "white",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                  >
                    QUICK TIP
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1.2, display: "block" }}
                  >
                    Tap the court in Opponent mode to record stats for specific
                    jersey numbers. Hot players will be highlighted here.
                  </Typography>
                </Box>
              </MoleskineCard>
            )}

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
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <History sx={{ fontSize: 18, mr: 1 }} /> Recent Actions
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, display: "block", mb: 0.5 }}
                      >
                        KEYBOARD SHORTCUTS
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1,
                        }}
                      >
                        <Typography variant="caption">M: Make</Typography>
                        <Typography variant="caption">X: Miss</Typography>
                        <Typography variant="caption">A: Assist</Typography>
                        <Typography variant="caption">O/D: Rebound</Typography>
                        <Typography variant="caption">T: Turnover</Typography>
                        <Typography variant="caption">S: Steal</Typography>
                        <Typography variant="caption">B: Block</Typography>
                        <Typography variant="caption">F: Foul</Typography>
                        <Typography variant="caption">P: Paint</Typography>
                        <Typography variant="caption">Space: Clock</Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 1, opacity: 0.8 }}
                      >
                        Ctrl+Z: Undo last
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton size="small" aria-label="Keyboard Shortcuts Help">
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Stack spacing={1}>
                {gameData.recentStats.filter((s) => !s.deletedAt).length ===
                0 ? (
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      border: "2px dashed rgba(0,0,0,0.08)",
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      bgcolor: "rgba(0,0,0,0.01)",
                    }}
                  >
                    <History
                      sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        opacity: 0.2,
                      }}
                    />
                    <Box sx={{ maxWidth: 200 }}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        Ready for Tip-off
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tap the court or use quick actions to record live game
                        stats.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SportsBasketball />}
                      onClick={() => setIsDialogOpen(true)}
                      sx={{ mt: 1, fontWeight: 800 }}
                    >
                      Record First Action
                    </Button>
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

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-describedby="stat-dialog-player-info"
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            selectedPlayerId &&
            statType &&
            !isSavingStat
          ) {
            e.preventDefault();
            handleSaveStat();
            return;
          }

          if (isSavingStat) return;

          const key = e.key.toLowerCase();
          const actionMap: Record<string, string> = {
            m: ACTION_TYPES.MAKE,
            x: ACTION_TYPES.MISS,
            o: ACTION_TYPES.OFF_REBOUND,
            d: ACTION_TYPES.DEF_REBOUND,
            a: ACTION_TYPES.ASSIST,
            t: ACTION_TYPES.TURNOVER,
            s: ACTION_TYPES.STEAL,
            b: ACTION_TYPES.BLOCK,
            f: ACTION_TYPES.FOUL_SHOOTING,
          };

          if (actionMap[key]) {
            setStatType(actionMap[key]);
          }

          if (key === "p") {
            setStatType(ACTION_TYPES.PAINT_TOUCH);
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {isEditing ? "Edit Action" : "Record Action"}
        </DialogTitle>
        <DialogContent>
          <Box
            id="stat-dialog-player-info"
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "rgba(0,0,0,0.03)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor:
                  trackingMode === "OPPONENT"
                    ? "secondary.main"
                    : "primary.main",
              }}
            >
              {selectedPlayerId
                ? trackingMode === "OPPONENT"
                  ? "OP"
                  : jerseyMap.get(selectedPlayerId) || "?"
                : "?"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {selectedPlayerId
                  ? getPlayerDisplayName(
                      selectedPlayerId,
                      playerNamesMap,
                      game?.opponent,
                      team?.name,
                    )
                  : "Select a player..."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {periodLabel} {period} | {formatClock(clockSeconds)}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            gutterBottom
            sx={{ display: "block", mb: 1 }}
          >
            Action Type
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mb: 3,
            }}
          >
            {[
              { type: ACTION_TYPES.MAKE, label: "Make (M)", icon: Check },
              { type: ACTION_TYPES.MISS, label: "Miss (X)", icon: Close },
              {
                type: ACTION_TYPES.OFF_REBOUND,
                label: "Off Reb (O)",
                icon: SportsBasketball,
              },
              {
                type: ACTION_TYPES.DEF_REBOUND,
                label: "Def Reb (D)",
                icon: SportsBasketball,
              },
              { type: ACTION_TYPES.ASSIST, label: "Assist (A)", icon: PanTool },
              {
                type: ACTION_TYPES.TURNOVER,
                label: "Turnover (T)",
                icon: SwapHoriz,
              },
              { type: ACTION_TYPES.STEAL, label: "Steal (S)", icon: FlashOn },
              { type: ACTION_TYPES.BLOCK, label: "Block (B)", icon: ArrowBack },
              {
                type: ACTION_TYPES.FOUL_SHOOTING,
                label: "S. Foul (F)",
                icon: Warning,
              },
              {
                type: ACTION_TYPES.FLOOR_DIVE,
                label: "Floor Dive",
                icon: SportsBasketball,
              },
              {
                type: ACTION_TYPES.CHARGE_TAKEN,
                label: "Charge",
                icon: PanTool,
              },
              {
                type: ACTION_TYPES.GREAT_CONTEST,
                label: "Contest",
                icon: Shield,
              },
              {
                type: ACTION_TYPES.PAINT_TOUCH,
                label: "Paint Touch (P)",
                icon: SportsBasketball,
              },
            ].map((action) => (
              <QuickAction
                key={action.type}
                type={action.type}
                label={action.label}
                icon={action.icon}
                statType={statType}
                onClick={handleQuickActionClick}
              />
            ))}
          </Box>

          {trackingMode === "TEAM" && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Who?
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 1,
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
                      size="small"
                      onClick={() => setSelectedPlayerId(p.id!)}
                      sx={{
                        minWidth: 0,
                        fontWeight: 700,
                        borderColor: "#D1D1D1",
                      }}
                    >
                      {jerseyMap.get(p.id!)}
                    </Button>
                  ))}
              </Box>
            </Box>
          )}

          {trackingMode === "OPPONENT" && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Opponent Jersey # (Optional)
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {[
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "10",
                  "11",
                  "12",
                  "23",
                  "24",
                  "30",
                  "32",
                  "33",
                  "34",
                  "35",
                ].map((num) => {
                  const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
                  return (
                    <Button
                      key={num}
                      variant={
                        selectedPlayerId === oppId ? "contained" : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        setSelectedPlayerId(
                          selectedPlayerId === oppId
                            ? SPECIAL_PLAYER_IDS.OPPONENT
                            : oppId,
                        )
                      }
                      sx={{
                        minWidth: 40,
                        fontWeight: 700,
                        borderColor: "#D1D1D1",
                      }}
                    >
                      {num}
                    </Button>
                  );
                })}
              </Box>
              {(() => {
                const pId = selectedPlayerId || "";
                const isOpp =
                  pId === SPECIAL_PLAYER_IDS.OPPONENT ||
                  pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
                if (!isOpp) return null;

                const foulsRequiredForBonus = periodType === "QUARTERS" ? 5 : 7;
                const foulsForWarning = foulsRequiredForBonus - 1;
                const fouls = gameData.teamFoulStats.oppFouls;

                if (fouls >= foulsRequiredForBonus) {
                  return (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        color: "error.main",
                        fontWeight: 900,
                        fontSize: "0.55rem",
                        mt: 0.5,
                      }}
                    >
                      IN BONUS
                    </Typography>
                  );
                } else if (fouls === foulsForWarning) {
                  return (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        color: "warning.main",
                        fontWeight: 700,
                        fontSize: "0.55rem",
                        mt: 0.5,
                      }}
                    >
                      NEXT: BONUS
                    </Typography>
                  );
                }
                return null;
              })()}
            </Box>
          )}
          {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
            trackingMode === "TEAM" &&
            team?.playbook &&
            team.playbook.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  gutterBottom
                  sx={{ display: "block", mb: 1 }}
                >
                  Offensive Play
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {team.playbook.map((play) => (
                    <Chip
                      key={play}
                      label={play}
                      size="small"
                      onClick={() => setPlayName(playName === play ? "" : play)}
                      color={playName === play ? "primary" : "default"}
                      variant={playName === play ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
              </Box>
            )}
          {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
            trackingMode === "OPPONENT" && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  gutterBottom
                  sx={{ display: "block", mb: 1 }}
                >
                  Opponent Play Type
                </Typography>
                <ToggleButtonGroup
                  value={opponentPlayType}
                  exclusive
                  onChange={(_, val) => setOpponentPlayType(val)}
                  size="small"
                  fullWidth
                  sx={{ flexWrap: "wrap" }}
                >
                  <ToggleButton value="PnR" sx={{ fontSize: "0.6rem" }}>
                    PnR
                  </ToggleButton>
                  <ToggleButton value="ISO" sx={{ fontSize: "0.6rem" }}>
                    ISO
                  </ToggleButton>
                  <ToggleButton value="POST" sx={{ fontSize: "0.6rem" }}>
                    POST
                  </ToggleButton>
                  <ToggleButton value="TRANSITION" sx={{ fontSize: "0.6rem" }}>
                    TRANS
                  </ToggleButton>
                  <ToggleButton value="OFF_SCREEN" sx={{ fontSize: "0.6rem" }}>
                    SCREEN
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

          {(statType === ACTION_TYPES.MAKE ||
            statType === ACTION_TYPES.MISS) && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Situation
              </Typography>
              <ToggleButtonGroup
                value={situation}
                exclusive
                onChange={(_, val) => setSituation(val)}
                size="small"
                fullWidth
              >
                {Object.values(SITUATIONS).map((sit) => (
                  <ToggleButton key={sit} value={sit}>
                    {sit}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {(statType === ACTION_TYPES.MAKE ||
            statType === ACTION_TYPES.MISS) && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Shot Quality
              </Typography>
              <ToggleButtonGroup
                value={shotQuality}
                exclusive
                onChange={(_, val) => setShotQuality(val)}
                size="small"
                fullWidth
              >
                <ToggleButton value={SHOT_QUALITY.OPEN}>Open</ToggleButton>
                <ToggleButton value={SHOT_QUALITY.CONTESTED}>
                  Contested
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

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
                    aria-label={`${pts} point shot`}
                  >
                    {pts}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {(selectedPlayerId || statType) && (
            <Button
              onClick={() => {
                setSelectedPlayerId(null);
                setStatType(null);
                setPlayName("");
                setSituation(null);
                setOpponentPlayType(null);
              }}
              color="warning"
              sx={{ mr: "auto" }}
            >
              Clear Selection
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Tooltip title="Save Action (Enter)">
            <span>
              <Button
                onClick={() => handleSaveStat()}
                variant="contained"
                disabled={!selectedPlayerId || !statType || isSavingStat}
              >
                {isSavingStat ? "Saving..." : isEditing ? "Update" : "Save"}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEndGameDialogOpen}
        onClose={() => setIsEndGameDialogOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isEnding) {
            handleEndGame();
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>End Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Is the game finished? Once ended, the results will be finalized for
            team averages.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setIsEndGameDialogOpen(false)}
            color="inherit"
            disabled={isEnding}
          >
            No, Continue
          </Button>
          <Button
            onClick={handleEndGame}
            color="error"
            variant="contained"
            disabled={isEnding}
          >
            {isEnding ? "Ending..." : "Yes, Finish Game"}
          </Button>
        </DialogActions>
      </Dialog>

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
        isSaving={isSavingSub}
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

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isDeleting) {
            handleDeleteStat();
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {(() => {
              const s = gameStats.find((st) => st.id === statToDelete);
              if (!s) return "Are you sure you want to delete this action?";

              const getOppName = (pId: string) => {
                if (pId === SPECIAL_PLAYER_IDS.OPPONENT)
                  return game?.opponent || "Opponent";
                if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
                  const jersey = pId.split(":")[1];
                  return `${game?.opponent || "Opponent"} #${jersey}`;
                }
                return "Opponent";
              };

              const playerName = s.playerId.startsWith(
                SPECIAL_PLAYER_IDS.OPPONENT,
              )
                ? getOppName(s.playerId)
                : playerNamesMap.get(s.playerId) || "Player";

              return `Delete ${s.type} by ${playerName} at ${formatClock(s.clockTime)}?`;
            })()}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteStat}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Action"}
          </Button>
        </DialogActions>
      </Dialog>

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

      <VerifiedPeriodModal
        open={isVerificationOpen}
        period={period}
        periodLabel={periodLabel}
        appScore={{
          team: gameData.currentScore,
          opp: gameData.opponentScore,
        }}
        appFouls={{
          team: gameData.teamFoulStats.teamFouls,
          opp: gameData.teamFoulStats.oppFouls,
        }}
        onVerify={handleVerifyPeriod}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
          action={
            snackbar.action === "UNDO" ? (
              <Button
                color="inherit"
                size="small"
                onClick={handleUndo}
                startIcon={<UndoIcon />}
              >
                UNDO
              </Button>
            ) : undefined
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GameMode;
