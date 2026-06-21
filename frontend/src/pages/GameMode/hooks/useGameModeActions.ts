/**
 * @file useGameModeActions.ts
 * @description Extracted DB-side action handlers for GameMode.
 * Keeps GameMode.tsx free of raw db/sync calls for all mutation operations.
 */
import { useCallback } from "react";
import { db, type StatEvent } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { calculateGameResult } from "../../../utils/stats/aggregators";
import { PlayerAggregates } from "../../../utils/stats/types";

interface UseGameModeActionsParams {
  gameId: string | null;
  period: number;
  clockSeconds: number;
  isReadOnly: boolean;
  trackingMode: string;
  isEditing: boolean;
  editingStatId: string | null;
  selectedPlayerId: string | null;
  statType: string | null;
  points: number;
  playName: string;
  shotQuality: string | null;
  situation: string | null;
  opponentPlayType: string | null;
  selectedX: number;
  selectedY: number;
  matchups: Record<string, string>;
  game: {
    activeDefensiveScheme?: string;
    matchups?: Record<string, string>;
    foulLimit?: number;
    possessionArrow?: "OUR_TEAM" | "OPPONENT";
  } | null;
  gameData: {
    recentStats: StatEvent[];
    possessionStartClock: number;
    possessionState: string;
    onCourtIds: Set<string>;
  };
  draftOnCourtIds: Set<string>;
  chainPrompt: {
    type: "REBOUND" | "ASSIST" | "HOCKEY_ASSIST";
    originalStat: StatEvent;
  } | null;
  statToDelete: string | null;
  isSavingSub: boolean;
  // setters
  setSnackbar: (_s: {
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
    action?: "UNDO";
  }) => void;
  setIsDialogOpen: (_v: boolean) => void;
  setStatType: (_v: string | null) => void;
  setPlayName: (_v: string) => void;
  setSituation: (_v: string | null) => void;
  setOpponentPlayType: (_v: string | null) => void;
  setIsEditing: (_v: boolean) => void;
  setEditingStatId: (_v: string | null) => void;
  setSelectedPlayerId: (_v: string | null) => void;
  setLastOpponentStatId: (_v: string | null) => void;
  setIsBreakdownDialogOpen: (_v: boolean) => void;
  setChainPrompt: (
    _v: {
      type: "REBOUND" | "ASSIST" | "HOCKEY_ASSIST";
      originalStat: StatEvent;
    } | null,
  ) => void;
  setIsFtWorkflowOpen: (_v: boolean) => void;
  setIsSavingStat: (_v: boolean) => void;
  setIsEnding: (_v: boolean) => void;
  setIsEndGameDialogOpen: (_v: boolean) => void;
  setIsSummaryDialogOpen: (_v: boolean) => void;
  setIsDeleting: (_v: boolean) => void;
  setIsDeleteDialogOpen: (_v: boolean) => void;
  setStatToDelete: (_v: string | null) => void;
  setIsSubDialogOpen: (_v: boolean) => void;
  setSubOutPlayerId: (_v: string | null) => void;
  setIsSavingSub: (_v: boolean) => void;
  statsMap: Map<string, PlayerAggregates>;
  team: { defaultFoulLimit?: number } | null | undefined;
}

export function useGameModeActions(params: UseGameModeActionsParams) {
  const {
    gameId,
    period,
    clockSeconds,
    isReadOnly,
    trackingMode,
    isEditing,
    editingStatId,
    selectedPlayerId,
    statType,
    points,
    playName,
    shotQuality,
    situation,
    opponentPlayType,
    selectedX,
    selectedY,
    matchups,
    game,
    gameData,
    draftOnCourtIds,
    chainPrompt,
    statToDelete,
    isSavingSub,
    setSnackbar,
    setIsDialogOpen,
    setStatType,
    setPlayName,
    setSituation,
    setOpponentPlayType,
    setIsEditing,
    setEditingStatId,
    setSelectedPlayerId,
    setLastOpponentStatId,
    setIsBreakdownDialogOpen,
    setChainPrompt,
    setIsFtWorkflowOpen,
    setIsSavingStat,
    setIsEnding,
    setIsEndGameDialogOpen,
    setIsSummaryDialogOpen,
    setIsDeleting,
    setIsDeleteDialogOpen,
    setStatToDelete,
    setIsSubDialogOpen,
    setSubOutPlayerId,
    setIsSavingSub,
    statsMap,
    team: teamRef,
  } = params;

  const handleUndo = useCallback(async () => {
    if (gameData.recentStats.length === 0) return;
    const lastStat = gameData.recentStats[0];
    if (!lastStat.id) return;
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
  }, [gameData.recentStats, setSnackbar]);

  const handleEndGame = useCallback(async () => {
    setIsEnding(true);
    try {
      const _endStats = await db.stats
        .where("gameId")
        .equals(gameId as string)
        .toArray();
      const { teamScore: _ts, oppScore: _os } = calculateGameResult(
        gameId as string,
        _endStats,
      );
      await db.games.update(gameId as string, {
        completed: 1,
        teamScore: _ts,
        oppScore: _os,
        synced: 0,
      });
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

  const handleSaveStat = useCallback(
    async (currentType?: string) => {
      const typeToSave = currentType || statType;
      if (!selectedPlayerId || !typeToSave) return;
      setIsSavingStat(true);
      try {
        if (!gameId) {
          setIsSavingStat(false);
          return;
        } // ← fix: reset before early return

        let primaryDefenderId: string | undefined;
        let derivedShotClockPhase: "EARLY" | "MID" | "LATE" | undefined;

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
            playerId: selectedPlayerId,
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
            defensiveScheme: game?.activeDefensiveScheme as
              | "MAN"
              | "ZONE"
              | "PRESS"
              | "DOUBLE"
              | undefined,
            synced: 0,
          });
          await syncService.pushUpdates();
        } else {
          const newStat: StatEvent = {
            id: crypto.randomUUID(),
            gameId,
            playerId: selectedPlayerId,
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
            defensiveScheme: game?.activeDefensiveScheme as
              | "MAN"
              | "ZONE"
              | "PRESS"
              | "DOUBLE"
              | undefined,
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

          if (typeToSave === ACTION_TYPES.HELD_BALL) {
            const nextArrow =
              game?.possessionArrow === "OUR_TEAM" ? "OPPONENT" : "OUR_TEAM";
            await db.games.update(gameId, {
              possessionArrow: nextArrow,
              synced: 0,
            });
          }

          // Strict Foul-Out Enforcement
          const isFoul =
            typeToSave === ACTION_TYPES.FOUL ||
            typeToSave === ACTION_TYPES.FOUL_SHOOTING ||
            typeToSave === ACTION_TYPES.FOUL_NON_SHOOTING ||
            typeToSave === ACTION_TYPES.TECHNICAL_FOUL;

          if (
            isFoul &&
            !selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
          ) {
            const stats = statsMap.get(selectedPlayerId);
            const currentFouls = (stats?.fouls || 0) + (isEditing ? 0 : 1);
            const foulLimit = game?.foulLimit || teamRef?.defaultFoulLimit || 5;

            if (currentFouls >= foulLimit) {
              setSubOutPlayerId(selectedPlayerId);
              setIsSubDialogOpen(true);
              setSnackbar({
                open: true,
                message: "PLAYER FOULED OUT: Replacement required.",
                severity: "warning",
              });
            }
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
      situation,
      opponentPlayType,
      matchups,
      game?.activeDefensiveScheme,
      gameData.possessionStartClock,
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
      setOpponentPlayType,
      statsMap,
      game?.foulLimit,
      game?.possessionArrow,
      teamRef?.defaultFoulLimit,
      setIsSubDialogOpen,
      setSubOutPlayerId,
    ],
  );

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

  const handleQuickSub = useCallback(async () => {
    if (!gameId || isReadOnly || isSavingSub) return;
    setIsSavingSub(true);
    try {
      const timestamp = new Date().toISOString();
      const originalOnCourt = gameData.onCourtIds;
      const toSubOut = Array.from(originalOnCourt).filter(
        (id) => !draftOnCourtIds.has(id),
      );
      const toSubIn = Array.from(draftOnCourtIds).filter(
        (id) => !originalOnCourt.has(id) && !id.startsWith("EMPTY"),
      );
      for (const pId of toSubOut) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
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
          gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_IN,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }
      setIsSubDialogOpen(false);
      setSubOutPlayerId(null);
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
    setSubOutPlayerId,
    setSnackbar,
    isSavingSub,
    setIsSavingSub,
  ]);

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
          gameId,
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
      await handleTogglePossession(SPECIAL_PLAYER_IDS.OUR_TEAM);
      setSnackbar({
        open: true,
        message: "Opponent turnover recorded",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to record opponent turnover:", err);
    }
  }, [
    gameId,
    isReadOnly,
    period,
    clockSeconds,
    handleTogglePossession,
    setSnackbar,
  ]);

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

  return {
    handleUndo,
    handleEndGame,
    handleSaveStat,
    handleDeleteStat,
    handleQuickSub,
    handleTogglePossession,
    handleOpponentTurnover,
    handleChainAction,
    handleFlipPossessionArrow: useCallback(async () => {
      if (!gameId || isReadOnly) return;
      const nextArrow =
        game?.possessionArrow === "OUR_TEAM" ? "OPPONENT" : "OUR_TEAM";
      try {
        await db.games.update(gameId, {
          possessionArrow: nextArrow,
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to flip possession arrow:", err);
      }
    }, [gameId, isReadOnly, game?.possessionArrow]),
  };
}
