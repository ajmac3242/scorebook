/**
 * @file useGameModeActions.ts
 * @description Extracted DB-side action handlers for GameMode.
 * Keeps GameMode.tsx free of raw db/sync calls for all mutation operations.
 */
import { useCallback } from "react";
import { db, type StatEvent } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  WHISTLE_ACTION_TYPES,
} from "../../../constants/stats";
import { calculateGameResult } from "../../../utils/stats/aggregators";
import { getBonusStatus } from "../../../utils/stats/helpers";
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
    opponent?: string;
    activeDefensiveScheme?: string;
    matchups?: Record<string, string>;
    foulLimit?: number;
    possessionArrow?: "OUR_TEAM" | "OPPONENT" | "NONE";
    verifiedPeriods?: number[];
  } | null;
  gameData: {
    recentStats: StatEvent[];
    possessionStartClock: number;
    possessionState: string;
    onCourtIds: Set<string>;
    teamFoulStats?: {
      teamFouls: number;
      oppFouls: number;
    };
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
    action?: "UNDO" | "REAPPLY";
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
  ftAttempts?: number | "1-and-1";
  setFtAttempts?: (_v: number | "1-and-1") => void;
  setIsFtWorkflowOpen: (_v: boolean) => void;
  setFtShooterId: (_v: string | null) => void;
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
  setIsClockRunning: (_v: boolean) => void;
  statsMap: Map<string, PlayerAggregates>;
  team:
    | {
        name?: string;
        defaultFoulLimit?: number;
        periodType?: "QUARTERS" | "HALVES";
        teamFoulsToBonus?: number;
        teamFoulsToDoubleBonus?: number;
      }
    | null
    | undefined;
  setIsJumpBallOpen: (_v: boolean) => void;
  setIsReopening?: (_v: boolean) => void;
  setIsConfirmReopenOpen?: (_v: boolean) => void;
  undoneStatCache?: StatEvent | null;
  setUndoneStatCache?: (_v: StatEvent | null) => void;
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
    setFtAttempts,
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
    setFtShooterId,
    setIsSavingSub,
    setIsClockRunning,
    statsMap,
    team: teamRef,
    setIsJumpBallOpen,
    setIsReopening,
    setIsConfirmReopenOpen,
    undoneStatCache,
    setUndoneStatCache,
  } = params;

  const handleUndo = useCallback(async () => {
    if (gameData.recentStats.length === 0 || isReadOnly) return;
    const lastStat = gameData.recentStats[0];
    if (!lastStat.id) return;

    if (game?.verifiedPeriods?.includes(lastStat.period)) {
      setSnackbar({
        open: true,
        message: `Period ${lastStat.period} stats are verified and locked. Unlock period to undo.`,
        severity: "warning",
      });
      return;
    }

    try {
      setUndoneStatCache?.(lastStat);
      await db.stats.update(lastStat.id, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setSnackbar({
        open: true,
        message: "Action undone",
        severity: "success",
        action: "REAPPLY",
      });
    } catch (err) {
      logger.error("Failed to undo stat:", err);
      setSnackbar({
        open: true,
        message: "Failed to undo action",
        severity: "error",
      });
    }
  }, [
    gameData.recentStats,
    isReadOnly,
    setSnackbar,
    game?.verifiedPeriods,
    setUndoneStatCache,
  ]);

  const handleReapplyUndo = useCallback(async () => {
    if (!undoneStatCache || !undoneStatCache.id || isReadOnly) return;
    try {
      const { id } = undoneStatCache;
      await db.stats.update(id, {
        deletedAt: undefined,
        synced: 0,
      });
      await syncService.pushUpdates();
      setUndoneStatCache?.(null);
      setSnackbar({
        open: true,
        message: "Action restored",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to re-apply undone stat:", err);
      setSnackbar({
        open: true,
        message: "Failed to restore action",
        severity: "error",
      });
    }
  }, [undoneStatCache, isReadOnly, setUndoneStatCache, setSnackbar]);

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

  const handleReopenGame = useCallback(async () => {
    if (!gameId) return;
    setIsReopening?.(true);
    try {
      await db.games.update(gameId, {
        completed: 0,
        synced: 0,
      });
      await syncService.pushUpdates();
      setIsConfirmReopenOpen?.(false);
      setSnackbar({
        open: true,
        message: "Game re-opened successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to re-open game:", err);
      setSnackbar({
        open: true,
        message: "Failed to re-open game",
        severity: "error",
      });
    } finally {
      setIsReopening?.(false);
    }
  }, [gameId, setIsReopening, setIsConfirmReopenOpen, setSnackbar]);

  const handleDirectScoreOverride = useCallback(
    async (targetTeam: "TEAM" | "OPPONENT", pointsDelta: number) => {
      if (!gameId || isReadOnly || pointsDelta === 0) return;
      try {
        const playerId =
          targetTeam === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.OUR_TEAM;
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId,
          type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
          points: pointsDelta,
          period,
          clockTime: clockSeconds,
          timestamp: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        const targetName =
          targetTeam === "TEAM"
            ? teamRef?.name || "Our Team"
            : game?.opponent || "Opponent";
        setSnackbar({
          open: true,
          message: `Score adjusted for ${targetName} (${pointsDelta > 0 ? "+" : ""}${pointsDelta} pts)`,
          severity: "success",
          action: "UNDO",
        });
      } catch (err) {
        logger.error("Failed to apply score adjustment:", err);
        setSnackbar({
          open: true,
          message: "Failed to apply score adjustment",
          severity: "error",
        });
      }
    },
    [
      gameId,
      isReadOnly,
      period,
      clockSeconds,
      teamRef?.name,
      game?.opponent,
      setSnackbar,
    ],
  );

  const handleDirectFoulOverride = useCallback(
    async (targetTeam: "TEAM" | "OPPONENT", delta: number) => {
      if (!gameId || isReadOnly || delta === 0) return;
      const targetName =
        targetTeam === "TEAM"
          ? teamRef?.name || "Our Team"
          : game?.opponent || "Opponent";
      const currentFouls =
        targetTeam === "OPPONENT"
          ? gameData.teamFoulStats?.oppFouls || 0
          : gameData.teamFoulStats?.teamFouls || 0;

      if (delta < 0 && currentFouls <= 0) {
        setSnackbar({
          open: true,
          message: `${targetName} team fouls cannot be negative`,
          severity: "warning",
        });
        return;
      }

      try {
        const playerId =
          targetTeam === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.OUR_TEAM;
        const type = delta > 0 ? ACTION_TYPES.FOUL : ACTION_TYPES.REMOVE_FOUL;
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId,
          type,
          period,
          clockTime: clockSeconds,
          timestamp: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        setSnackbar({
          open: true,
          message: `Foul count adjusted for ${targetName} (${delta > 0 ? "+1" : "-1"})`,
          severity: "success",
          action: "UNDO",
        });
      } catch (err) {
        logger.error("Failed to apply foul adjustment:", err);
        setSnackbar({
          open: true,
          message: "Failed to apply foul adjustment",
          severity: "error",
        });
      }
    },
    [
      gameId,
      isReadOnly,
      period,
      clockSeconds,
      teamRef?.name,
      game?.opponent,
      gameData.teamFoulStats?.oppFouls,
      gameData.teamFoulStats?.teamFouls,
      setSnackbar,
    ],
  );

  const handleSaveStat = useCallback(
    async (currentType?: string) => {
      if (isReadOnly) return;
      const typeToSave = currentType || statType;
      if (!selectedPlayerId || !typeToSave) return;

      if (game?.verifiedPeriods?.includes(period)) {
        setSnackbar({
          open: true,
          message: `Period ${period} is verified and locked. Unlock the period to add new actions.`,
          severity: "warning",
        });
        setIsDialogOpen(false);
        return;
      }

      setIsSavingStat(true);
      try {
        if (!gameId) {
          setIsSavingStat(false);
          return;
        }
        setUndoneStatCache?.(null);

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
              "MAN" | "ZONE" | "PRESS" | "DOUBLE" | undefined,
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
              "MAN" | "ZONE" | "PRESS" | "DOUBLE" | undefined,
            period,
            clockTime: clockSeconds,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          if (WHISTLE_ACTION_TYPES.has(typeToSave)) {
            setIsClockRunning(false);
          }

          // Clock Auto-Stop on Successful Field Goal in Final Minute of Regulation/OT
          const maxPeriod =
            (teamRef?.periodType || "QUARTERS") === "HALVES" ? 2 : 4;
          const isSuccessfulFieldGoal =
            typeToSave === ACTION_TYPES.MAKE && points > 1;
          const isWinningTime = clockSeconds < 60 && period >= maxPeriod;
          if (isSuccessfulFieldGoal && isWinningTime) {
            setIsClockRunning(false);
          }

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
            if (trackingMode === "TEAM") {
              // We fouled opponent -> opponent is on offense -> shooter is OPPONENT
              setFtShooterId(SPECIAL_PLAYER_IDS.OPPONENT);
            } else {
              // Opponent fouled us -> we are on offense -> we need to pick a shooter
              setFtShooterId(null);
            }
            setFtAttempts?.(points === 3 ? 3 : 2);
            setIsFtWorkflowOpen(true);
          } else if (
            typeToSave === ACTION_TYPES.FOUL ||
            typeToSave === ACTION_TYPES.FOUL_NON_SHOOTING ||
            typeToSave === ACTION_TYPES.TECHNICAL_FOUL
          ) {
            const isOppFoul =
              selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT) ||
              selectedPlayerId === SPECIAL_PLAYER_IDS.OPPONENT;
            const currentFouls = isOppFoul
              ? gameData.teamFoulStats?.oppFouls || 0
              : gameData.teamFoulStats?.teamFouls || 0;
            const newCommittingFouls = currentFouls + (isEditing ? 0 : 1);
            const bonusStatus = getBonusStatus(
              newCommittingFouls,
              teamRef?.periodType || "QUARTERS",
              teamRef?.teamFoulsToBonus,
              teamRef?.teamFoulsToDoubleBonus,
            );

            if (bonusStatus.isBonus) {
              if (isOppFoul) {
                setFtShooterId(null);
              } else {
                setFtShooterId(SPECIAL_PLAYER_IDS.OPPONENT);
              }

              if (bonusStatus.isDouble) {
                setFtAttempts?.(2);
              } else {
                setFtAttempts?.("1-and-1");
              }
              setIsFtWorkflowOpen(true);
            }
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
            selectedPlayerId !== SPECIAL_PLAYER_IDS.OUR_TEAM &&
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

        const isNewWhistleAction =
          !isEditing && WHISTLE_ACTION_TYPES.has(typeToSave);

        setSnackbar({
          open: true,
          message: isNewWhistleAction
            ? "Clock Paused for Whistle."
            : isEditing
              ? "Action updated"
              : "Action recorded",
          severity: isNewWhistleAction ? "info" : "success",
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
      gameData.teamFoulStats?.oppFouls,
      gameData.teamFoulStats?.teamFouls,
      teamRef?.defaultFoulLimit,
      teamRef?.periodType,
      teamRef?.teamFoulsToBonus,
      teamRef?.teamFoulsToDoubleBonus,
      setIsSubDialogOpen,
      setSubOutPlayerId,
      setFtShooterId,
      setFtAttempts,
      setIsClockRunning,
      isReadOnly,
      game?.verifiedPeriods,
      setUndoneStatCache,
    ],
  );

  const handleDeleteStat = useCallback(async () => {
    if (!statToDelete || isReadOnly) return;

    const targetStat = gameData.recentStats.find((s) => s.id === statToDelete);
    if (targetStat && game?.verifiedPeriods?.includes(targetStat.period)) {
      setSnackbar({
        open: true,
        message: `Period ${targetStat.period} stats are verified and locked. Unlock period to delete actions.`,
        severity: "warning",
      });
      setIsDeleteDialogOpen(false);
      setStatToDelete(null);
      return;
    }

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
    isReadOnly,
    setStatToDelete,
    setSnackbar,
    gameData.recentStats,
    game?.verifiedPeriods,
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
      if (!chainPrompt || !gameId || isReadOnly) return;
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
    [chainPrompt, gameId, setChainPrompt, setSnackbar, isReadOnly],
  );

  return {
    handleUndo,
    handleReapplyUndo,
    handleEndGame,
    handleSaveStat,
    handleDeleteStat,
    handleQuickSub,
    handleTogglePossession,
    handleOpponentTurnover,
    handleChainAction,
    handleDirectScoreOverride,
    handleDirectFoulOverride,
    handleConfirmStartingLineup: useCallback(
      async (selectedIds: Set<string>) => {
        if (!gameId || isReadOnly) return;
        try {
          const timestamp = new Date().toISOString();
          for (const pId of Array.from(selectedIds)) {
            await db.stats.add({
              id: crypto.randomUUID(),
              gameId,
              playerId: pId,
              type: ACTION_TYPES.SUB_IN,
              period: 1,
              clockTime: clockSeconds,
              timestamp,
              synced: 0,
            });
          }
          await syncService.pushUpdates();
          setSnackbar({
            open: true,
            message: "Starting lineup confirmed!",
            severity: "success",
          });
          // Transition to jump-ball tip-off
          setIsJumpBallOpen(true);
        } catch (err) {
          logger.error("Failed to confirm starting lineup:", err);
          setSnackbar({
            open: true,
            message: "Failed to save starting lineup",
            severity: "error",
          });
        }
      },
      [gameId, isReadOnly, clockSeconds, setSnackbar, setIsJumpBallOpen],
    ),
    handleJumpBall: useCallback(
      async (winnerId: string) => {
        if (!gameId || isReadOnly) return;
        try {
          const timestamp = new Date().toISOString();
          // 1. Record POSSESSION event for winner
          await db.stats.add({
            id: crypto.randomUUID(),
            gameId,
            playerId: winnerId,
            type: ACTION_TYPES.POSSESSION,
            period: 1,
            clockTime: clockSeconds,
            timestamp,
            synced: 0,
          });

          // 2. Set arrow to LOSER
          const arrowDirection =
            winnerId === SPECIAL_PLAYER_IDS.OUR_TEAM ? "OPPONENT" : "OUR_TEAM";
          await db.games.update(gameId, {
            possessionArrow: arrowDirection,
            synced: 0,
          });

          await syncService.pushUpdates();
          setSnackbar({
            open: true,
            message: "Jump ball recorded. Arrow set.",
            severity: "success",
          });
        } catch (err) {
          logger.error("Failed to handle jump ball:", err);
        }
      },
      [gameId, isReadOnly, clockSeconds, setSnackbar],
    ),
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
    handleTimeout: useCallback(async () => {
      if (!gameId || isReadOnly) return;
      try {
        setIsClockRunning(false);
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId:
            trackingMode === "TEAM"
              ? SPECIAL_PLAYER_IDS.TEAM_TIMEOUT
              : SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TIMEOUT,
          period,
          clockTime: clockSeconds,
          points: 0,
          timestamp: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        setSnackbar({
          open: true,
          message: "Clock Paused for Whistle.",
          severity: "info",
          action: "UNDO",
        });
      } catch (error) {
        logger.error("Failed to record timeout", error);
        setSnackbar({
          open: true,
          message: "Failed to record timeout",
          severity: "error",
        });
      }
    }, [
      gameId,
      isReadOnly,
      trackingMode,
      period,
      clockSeconds,
      setIsClockRunning,
      setSnackbar,
    ]),
    handleReopenGame,
  };
}
