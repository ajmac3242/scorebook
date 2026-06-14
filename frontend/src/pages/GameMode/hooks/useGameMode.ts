import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { db, type StatEvent } from "../../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import {
  calculatePlayerAggregates,
  calculatePlayerStreaks,
  calculatePlayEfficiency,
  calculatePossessions,
  calculatePpp,
  calculateLineupStats,
  calculateTeamSeasonAverages,
  calculateOpponentAggregates,
  isOpponentId,
  calculateHaltAlerts,
  calculateMatchupEfficiency,
  calculateSparkPlugIndex,
  calculateShotROI,
  calculatePaintTouchStats,
  calculateArchetypeEfficiency,
  isClutchEvent,
  type PlayerAggregates,
} from "../../../utils/stats";
import { roundToOne } from "../../../utils/mathUtils";
import { useTheme } from "@mui/material";

import { useGameClock } from "../../../hooks/useGameClock";
import { useLineupState } from "./useLineupState";
import { useStatWriter } from "../../../hooks/useStatWriter";
import { usePossessionTracker } from "./usePossessionTracker";
import { useVoiceRecognition } from "../../../hooks/useVoiceRecognition";
import { useGameAggregator } from "../../../hooks/useGameAggregator";
import { ParsedVoiceCommand } from "../../../utils/voiceParser";
import { type MarkerFilter } from "../CourtMarkerFilters";
import { logger } from "../../../utils/logger";

export const useGameMode = (gameId: string | null, teamId: string | null) => {
  const theme = useTheme();

  // 1. Data Retrieval
  const gameStatsQueryResult = useLiveQuery(
    () => (gameId ? db.stats.where("gameId").equals(gameId).toArray() : []),
    [gameId],
  );
  const gameStats = useMemo(
    () => gameStatsQueryResult || [],
    [gameStatsQueryResult],
  );

  const rawRosterData = useLiveQuery(() => {
    if (!teamId) return { teamPlayers: [], players: [] };
    return db.teamPlayers
      .where("teamId")
      .equals(teamId.toString())
      .toArray()
      .then((tp) => {
        const pIds = tp.map((t) => t.playerId.toString());
        return db.players
          .where("id")
          .anyOf(pIds)
          .toArray()
          .then((p) => ({ teamPlayers: tp, players: p }));
      });
  }, [teamId]);

  const rosterData = useMemo(
    () => rawRosterData || { teamPlayers: [], players: [] },
    [rawRosterData],
  );
  const teamPlayers = rosterData.teamPlayers;
  const players = rosterData.players;

  const gameAndTeam = useLiveQuery(() => {
    return db.games.get(gameId || "").then((g) => {
      if (g?.teamId) {
        return db.teams.get(g.teamId).then((t) => ({ game: g, team: t }));
      }
      return { game: g, team: undefined };
    });
  }, [gameId]) || { game: undefined, team: undefined };

  const { game, team } = gameAndTeam;

  const teamSeasonStats = useLiveQuery(() => {
    if (!teamId)
      return { ppp: "0.00", ftPct: "0.0", turnoverRate: "0.0", orebPct: "0.0" };
    return db.games
      .where("teamId")
      .equals(teamId)
      .toArray()
      .then((games) => {
        const gameIds = games.map((g) => g.id!).filter(Boolean);
        return db.stats
          .where("gameId")
          .anyOf(gameIds)
          .toArray()
          .then((allStats) => calculateTeamSeasonAverages(games, allStats));
      });
  }, [teamId]);

  // 2. Domain Hooks
  const {
    clockSeconds,
    setClockSeconds,
    clockSecondsRef,
    isClockRunning,
    setIsClockRunning,
    period,
    setPeriod,
    handleToggleClock,
    handleEditClock,
    handleNextPeriod: originalHandleNextPeriod,
  } = useGameClock(
    gameId,
    team?.defaultPeriodLength,
    game?.currentPeriod,
    game?.clockTime,
  );

  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  const {
    isSavingStat,
    setIsSavingStat,
    isDeleting,
    setIsDeleting,
    isEnding,
    setIsEnding,
    writeStat,
    deleteStat,
    quickSub,
    endHighGame,
  } = useStatWriter(gameId);

  const { togglePossession } = usePossessionTracker(gameId);

  // 3. Derived State & Local UI State
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false);
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [lastOpponentStatId, setLastOpponentStatId] = useState<string | null>(
    null,
  );
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
    action?: "UNDO";
  }>({ open: false, message: "", severity: "success" });

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [lastVerifiedPeriod, setLastVerifiedPeriod] = useState(0);

  const [points, setPoints] = useState<number>(2);
  const [playName, setPlayName] = useState<string>("");
  const [shotQuality, setShotQuality] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [opponentPlayType, setOpponentPlayType] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  }>({ key: "jerseyNumber", direction: "asc" });

  const [markerFilter, setMarkerFilter] = useState<MarkerFilter>("ALL");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  const [isEndGameDialogOpen, setIsEndGameDialogOpen] = useState(false);
  const [isClockEditDialogOpen, setIsClockEditDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isFtWorkflowOpen, setIsFtWorkflowOpen] = useState(false);
  const [isHalftimeReportOpen, setIsHalftimeReportOpen] = useState(false);
  const [lastViewedHalftimePeriod, setLastViewedHalftimePeriod] =
    useState<number>(0);
  const [showMatchupMatrix, setShowMatchupMatrix] = useState(false);
  const [chainPrompt, setChainPrompt] = useState<{
    type: "ASSIST" | "REBOUND" | "HOCKEY_ASSIST";
    originalStat: StatEvent;
  } | null>(null);

  // 4. More Domain Derived State
  const sortedGameStats = useMemo(() => {
    return [...gameStats].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }, [gameStats]);

  const { eventAggregates, gameData } = useGameAggregator(
    sortedGameStats,
    period,
    clockSeconds,
    team,
    game,
  );

  const handleVoiceCommand = useCallback(
    async (command: ParsedVoiceCommand) => {
      if (!gameId) return;

      // Detect Substitution Pair
      const subInAction = command.actions.find(
        (a) => a.action === ACTION_TYPES.SUB_IN,
      );
      const subOutAction = command.actions.find(
        (a) => a.action === ACTION_TYPES.SUB_OUT,
      );

      if (
        subInAction &&
        subOutAction &&
        subInAction.isOpponent === subOutAction.isOpponent
      ) {
        const isOpp = subInAction.isOpponent;
        let inId = "";
        let outId = "";

        if (isOpp) {
          inId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${subInAction.jerseyNumber}`;
          outId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${subOutAction.jerseyNumber}`;
        } else {
          const inPlayer = teamPlayers.find(
            (tp) => tp.jerseyNumber === subInAction.jerseyNumber,
          );
          const outPlayer = teamPlayers.find(
            (tp) => tp.jerseyNumber === subOutAction.jerseyNumber,
          );
          if (inPlayer && outPlayer) {
            inId = inPlayer.playerId;
            outId = outPlayer.playerId;
          }
        }

        if (inId && outId) {
          try {
            const newLineup = new Set(gameData.onCourtIds);
            newLineup.delete(outId);
            newLineup.add(inId);

            await quickSub(
              gameData.onCourtIds,
              newLineup,
              period,
              clockSeconds,
            );

            setSnackbar({
              open: true,
              message: `Lineup Updated: #${subInAction.jerseyNumber} IN, #${subOutAction.jerseyNumber} OUT.`,
              severity: "success",
            });
            return;
          } catch (err) {
            logger.error("Voice substitution failed:", err);
            setSnackbar({
              open: true,
              message: "Voice substitution failed",
              severity: "error",
            });
            return;
          }
        }
      }

      for (const action of command.actions) {
        let pId = "";
        if (action.isOpponent) {
          pId = action.jerseyNumber
            ? `${SPECIAL_PLAYER_IDS.OPPONENT}:${action.jerseyNumber}`
            : SPECIAL_PLAYER_IDS.OPPONENT;
        } else if (action.jerseyNumber) {
          const player = teamPlayers.find(
            (tp) => tp.jerseyNumber === action.jerseyNumber,
          );
          if (player) {
            pId = player.playerId;
          } else {
            logger.warn(
              `Voice command for unknown jersey: ${action.jerseyNumber}`,
            );
            continue;
          }
        } else {
          continue;
        }

        try {
          const saved = await writeStat({
            playerId: pId,
            type: action.action,
            points: action.points,
            period,
            clockTime: clockSeconds,
            locationX: 0,
            locationY: 0,
          });

          if (
            saved &&
            action.isOpponent &&
            action.action === ACTION_TYPES.MAKE
          ) {
            setLastOpponentStatId(saved.id!);
            setIsBreakdownDialogOpen(true);
          }

          setSnackbar({
            open: true,
            message: `Voice Recorded: #${action.jerseyNumber} ${action.action}`,
            severity: "success",
          });
        } catch {
          setSnackbar({
            open: true,
            message: "Voice command failed",
            severity: "error",
          });
        }
      }
    },
    [
      gameId,
      teamPlayers,
      period,
      clockSeconds,
      writeStat,
      setLastOpponentStatId,
      setIsBreakdownDialogOpen,
      setSnackbar,
      gameData.onCourtIds,
      quickSub,
    ],
  );

  const { isListening, lastTranscript } = useVoiceRecognition({
    onCommand: handleVoiceCommand,
    enabled: voiceEnabled,
  });

  const lastKillCount = useRef<number | null>(null);
  useEffect(() => {
    if (
      lastKillCount.current !== null &&
      gameData.defensiveStats.totalKills > lastKillCount.current
    ) {
      setSnackbar({
        open: true,
        message: "🛡️ KILL ACHIEVED! 3 Consecutive Defensive Stops.",
        severity: "success",
      });
    }
    lastKillCount.current = gameData.defensiveStats.totalKills;
  }, [gameData.defensiveStats.totalKills, setSnackbar]);

  const handleNextPeriod = useCallback(async () => {
    if (lastVerifiedPeriod < period) {
      setIsVerificationOpen(true);
      return;
    }
    originalHandleNextPeriod(team?.periodType || "QUARTERS");
  }, [period, lastVerifiedPeriod, originalHandleNextPeriod, team?.periodType]);

  const handleVerifyPeriod = useCallback(
    async (adjustments: {
      teamScore: number;
      oppScore: number;
      teamFouls: number;
      oppFouls: number;
    }) => {
      if (!gameId) return;

      const teamScoreDiff =
        adjustments.teamScore - eventAggregates.currentScore;
      const oppScoreDiff = adjustments.oppScore - eventAggregates.opponentScore;
      const teamFoulDiff =
        adjustments.teamFouls - eventAggregates.teamFoulStats.teamFouls;
      const oppFoulDiff =
        adjustments.oppFouls - eventAggregates.teamFoulStats.oppFouls;

      const timestamp = new Date().toISOString();

      if (teamScoreDiff !== 0) {
        await db.stats.add({
          gameId,
          playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
          type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
          points: teamScoreDiff,
          period,
          clockTime: 0,
          timestamp,
          synced: 0,
        });
      }
      if (oppScoreDiff !== 0) {
        await db.stats.add({
          gameId,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
          points: oppScoreDiff,
          period,
          clockTime: 0,
          timestamp,
          synced: 0,
        });
      }
      // Simplified foul adjustment for now (doesn't attribute to specific players)
      if (teamFoulDiff !== 0) {
        for (let i = 0; i < Math.abs(teamFoulDiff); i++) {
          await db.stats.add({
            gameId,
            playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
            type: teamFoulDiff > 0 ? ACTION_TYPES.FOUL : "ADJUST_FOUL_REMOVE",
            period,
            clockTime: 0,
            timestamp,
            synced: 0,
          });
        }
      }
      if (oppFoulDiff !== 0) {
        for (let i = 0; i < Math.abs(oppFoulDiff); i++) {
          await db.stats.add({
            gameId,
            playerId: SPECIAL_PLAYER_IDS.OPPONENT,
            type: oppFoulDiff > 0 ? ACTION_TYPES.FOUL : "ADJUST_FOUL_REMOVE",
            period,
            clockTime: 0,
            timestamp,
            synced: 0,
          });
        }
      }

      setLastVerifiedPeriod(period);
      setIsVerificationOpen(false);
      originalHandleNextPeriod(team?.periodType || "QUARTERS");
    },
    [
      gameId,
      period,
      eventAggregates,
      originalHandleNextPeriod,
      team?.periodType,
    ],
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const playerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      if (p?.id) map.set(p.id.toString(), p.name);
    }
    return map;
  }, [players]);

  const jerseyMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const tp of teamPlayers) {
      map.set(tp.playerId, tp.jerseyNumber);
    }
    return map;
  }, [teamPlayers]);

  const statsMap = useMemo(() => {
    const aggregates = calculatePlayerAggregates(
      players,
      sortedGameStats,
      teamPlayers,
      "total",
      {
        isSorted: true,
        periodLength: game?.periodLength,
        liveContext: { clockTime: 0, period },
      },
    );
    const map = new Map<string, PlayerAggregates>();
    for (const p of aggregates) map.set(p.id.toString(), p);
    return map;
  }, [players, sortedGameStats, teamPlayers, game?.periodLength, period]);

  const oppMostFrequentPlayType = useMemo(() => {
    const playTypeCounts: Record<string, Record<string, number>> = {};
    for (const s of sortedGameStats) {
      if (isOpponentId(s.playerId) && s.opponentPlayType) {
        if (!playTypeCounts[s.playerId]) playTypeCounts[s.playerId] = {};
        playTypeCounts[s.playerId][s.opponentPlayType] =
          (playTypeCounts[s.playerId][s.opponentPlayType] || 0) + 1;
      }
    }
    const result: Record<string, string> = {};
    for (const [oppId, counts] of Object.entries(playTypeCounts)) {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted[0]) result[oppId] = sorted[0][0];
    }
    return result;
  }, [sortedGameStats]);

  const haltAlerts = useMemo(() => {
    return calculateHaltAlerts({
      players,
      statsMap,
      gameData: {
        ...gameData,
        activeDefensiveScheme: game?.activeDefensiveScheme,
      },
      period,
      clockSeconds,
      periodType: team?.periodType || "QUARTERS",
      maxStintDuration: team?.maxStintDuration || 8,
      jerseyMap,
      archetypeEfficiency: calculateArchetypeEfficiency(sortedGameStats),
      oppMostFrequentPlayType,
      matchups: game?.matchups || {},
    });
  }, [
    players,
    statsMap,
    gameData,
    game?.activeDefensiveScheme,
    period,
    clockSeconds,
    team?.periodType,
    team?.maxStintDuration,
    jerseyMap,
    sortedGameStats,
    oppMostFrequentPlayType,
    game?.matchups,
  ]);

  const {
    isSubDialogOpen,
    setIsSubDialogOpen,
    subOutPlayerId,
    setSubOutPlayerId,
    draftOnCourtIds,
    setDraftOnCourtIds,
    selectedSwapId,
    setSelectedSwapId,
  } = useLineupState(gameData.onCourtIds);

  const statsGridDataRaw = useMemo(
    () => Array.from(statsMap.values()),
    [statsMap],
  );

  const statsGridData = useMemo(() => {
    return statsGridDataRaw.map((p) => {
      if (!gameData.onCourtIds.has(p.id.toString())) return p;
      const startClock = gameData.stintStarts.get(p.id.toString()) ?? 0;
      const currentStintSecs = Math.max(0, startClock - clockSeconds);
      return {
        ...p,
        min: roundToOne(p.min - startClock / 60 + currentStintSecs / 60),
      };
    });
  }, [
    statsGridDataRaw,
    gameData.onCourtIds,
    gameData.stintStarts,
    clockSeconds,
  ]);

  const sortedStatsGridData = useMemo(() => {
    return [...statsGridData].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key],
        valB = b[key];
      if (typeof valA === "string" && typeof valB === "string") {
        return direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      valA = (valA as number) || 0;
      valB = (valB as number) || 0;
      return direction === "asc" ? valA - valB : valB - valA;
    });
  }, [statsGridData, sortConfig]);

  const opponentStats = useMemo(() => {
    const oppEvents = sortedGameStats.filter((s) => isOpponentId(s.playerId));
    const jerseyMap = new Map<string, StatEvent[]>();
    for (const s of oppEvents) {
      if (!jerseyMap.has(s.playerId)) jerseyMap.set(s.playerId, []);
      jerseyMap.get(s.playerId)!.push(s);
    }
    const res = [];
    for (const [id, events] of jerseyMap.entries()) {
      const agg = calculateOpponentAggregates(events);
      const threats = gameData.momentumAlerts.opponentThreats;
      const t = threats.find((t) => t.playerId === id);
      res.push({
        id,
        jersey: id.includes(":") ? id.split(":")[1] : "??",
        ...agg,
        isHot: !!t?.isHot,
        isClutchThreat: !!t?.isClutchThreat,
        straightPoints: t?.straightPoints || 0,
      });
    }
    return res.sort((a, b) => b.points - a.points);
  }, [sortedGameStats, gameData.momentumAlerts.opponentThreats]);

  const halftimeStats = useMemo(() => {
    if (!isHalftimeReportOpen) return { lineupStats: [], schemeEfficiency: [] };
    const firstHalfStats = sortedGameStats.filter((s) =>
      (team?.periodType || "QUARTERS") === "QUARTERS"
        ? s.period <= 2
        : s.period <= 1,
    );

    const schemeStats: Record<
      string,
      { points: number; fga: number; fta: number; to: number }
    > = {
      MAN: { points: 0, fga: 0, fta: 0, to: 0 },
      ZONE: { points: 0, fga: 0, fta: 0, to: 0 },
      PRESS: { points: 0, fga: 0, fta: 0, to: 0 },
      DOUBLE: { points: 0, fga: 0, fta: 0, to: 0 },
    };

    firstHalfStats.forEach((s) => {
      if (
        s.deletedAt ||
        !isOpponentId(s.playerId) ||
        !s.defensiveScheme ||
        !schemeStats[s.defensiveScheme]
      )
        return;
      const scheme = schemeStats[s.defensiveScheme];
      if (s.type === ACTION_TYPES.MAKE) {
        scheme.points += s.points || 0;
        if (s.points === 1) scheme.fta++;
        else scheme.fga++;
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) scheme.fta++;
        else scheme.fga++;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        scheme.to++;
      }
    });

    return {
      lineupStats: calculateLineupStats(firstHalfStats, {
        isSorted: true,
        periodLength: game?.periodLength,
      }),
      schemeEfficiency: Object.entries(schemeStats).map(([name, s]) => {
        const poss = calculatePossessions(s.fga, s.fta, s.to, 0);
        return { name, ppp: calculatePpp(s.points, poss), possessions: poss };
      }),
    };
  }, [
    isHalftimeReportOpen,
    sortedGameStats,
    team?.periodType,
    game?.periodLength,
  ]);

  const playerStreaks = useMemo(
    () => calculatePlayerStreaks(sortedGameStats, { isSorted: true }),
    [sortedGameStats],
  );
  const playbookEfficiency = useMemo(
    () => calculatePlayEfficiency(sortedGameStats),
    [sortedGameStats],
  );

  const markers = useMemo(() => {
    const oppColor = theme.palette.secondary.main;
    const res = [];
    const filterOutTypes = new Set([
      ACTION_TYPES.SUB_IN,
      ACTION_TYPES.SUB_OUT,
      ACTION_TYPES.POSSESSION,
      ACTION_TYPES.TIMEOUT,
    ]);

    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (s.deletedAt || filterOutTypes.has(s.type)) continue;

      if (
        markerFilter !== "ALL" &&
        s.type !== markerFilter &&
        !(
          markerFilter === "REBOUND" &&
          (s.type === ACTION_TYPES.OFF_REBOUND ||
            s.type === ACTION_TYPES.DEF_REBOUND)
        )
      )
        continue;

      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
      res.push({
        x: s.locationX,
        y: s.locationY,
        color: isOpp
          ? oppColor
          : s.type === ACTION_TYPES.MAKE
            ? "#4CAF50"
            : s.type === ACTION_TYPES.MISS
              ? "#F44336"
              : "#2196F3",
        label: isOpp ? "Opp" : playerNamesMap.get(s.playerId) || "Player",
        type: s.type,
      });
    }
    return res;
  }, [gameStats, markerFilter, playerNamesMap, theme.palette.secondary.main]);

  return {
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
    situation,
    setSituation,
    opponentPlayType,
    setOpponentPlayType,
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
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isVerificationOpen,
    setIsVerificationOpen,
    lastVerifiedPeriod,
    handleVerifyPeriod,
    lastViewedHalftimePeriod,
    setLastViewedHalftimePeriod,
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
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    lastOpponentStatId,
    setLastOpponentStatId,
    voiceEnabled,
    setVoiceEnabled,
    isListening,
    lastTranscript,
    subOutPlayerId,
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
    teamPlayers,
    players,
    playerNamesMap,
    game,
    team,
    teamSeasonStats,
    isReadOnly: !!game?.deletedAt || !!team?.deletedAt,
    periodType: team?.periodType || "QUARTERS",
    periodLabel:
      (team?.periodType || "QUARTERS") === "HALVES" ? "Half" : "Quarter",
    maxPeriod: (team?.periodType || "QUARTERS") === "HALVES" ? 2 : 4,
    sortedGameStats,
    gameData,
    jerseyMap,
    sortedStatsGridData,
    statsMap,
    matchups: game?.matchups || {},
    matchupEfficiency: useMemo(
      () => calculateMatchupEfficiency(sortedGameStats, game?.matchups || {}),
      [sortedGameStats, game?.matchups],
    ),
    archetypeEfficiency: useMemo(
      () => calculateArchetypeEfficiency(sortedGameStats),
      [sortedGameStats],
    ),
    oppMostFrequentPlayType,
    sparkPlugIndex: useMemo(
      () => calculateSparkPlugIndex(sortedGameStats, game?.periodLength || 10),
      [sortedGameStats, game?.periodLength],
    ),
    shotROI: useMemo(
      () => calculateShotROI(sortedGameStats),
      [sortedGameStats],
    ),
    isClutchMode: useMemo(() => {
      return isClutchEvent(
        period,
        clockSeconds,
        gameData.currentScore - gameData.opponentScore,
        team?.periodType || "QUARTERS",
      );
    }, [
      period,
      clockSeconds,
      gameData.currentScore,
      gameData.opponentScore,
      team?.periodType,
    ]),
    clutchStats: useMemo(() => {
      const clutchEvents = sortedGameStats.filter((s) =>
        isClutchEvent(
          s.period,
          s.clockTime || 0,
          0, // Filter by time/period context
          team?.periodType || "QUARTERS",
        ),
      );
      return calculatePlayerAggregates(
        players,
        clutchEvents,
        teamPlayers,
        "total",
        {
          isSorted: true,
          periodLength: game?.periodLength,
        },
      );
    }, [
      sortedGameStats,
      players,
      teamPlayers,
      team?.periodType,
      game?.periodLength,
    ]),
    paintTouchStats: useMemo(
      () => calculatePaintTouchStats(sortedGameStats),
      [sortedGameStats],
    ),
    showMatchupMatrix,
    setShowMatchupMatrix,
    opponentStats,
    halftimeStats,
    playerStreaks,
    playbookEfficiency,
    markers,
    clockSecondsRef,
    handleToggleClock,
    handleEditClock,
    handleNextPeriod,
    togglePossession,
    writeStat,
    deleteStat,
    quickSub,
    endHighGame,
    haltAlerts,
  };
};
