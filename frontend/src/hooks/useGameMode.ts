import { useState, useMemo, useCallback } from "react";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculatePlayerStreaks,
  calculatePlayEfficiency,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  calculateLineupStats,
  calculateTeamSeasonAverages,
  calculateOpponentAggregates,
  isEventInPeriod,
  isOpponentId,
  getBonusStatus,
  calculateHaltAlerts,
  calculateOpponentThreats,
  calculateMatchupEfficiency,
  calculateSparkPlugIndex,
  calculateShotROI,
  calculatePaintTouchStats,
  type PlayerAggregates,
  OpponentThreat,
} from "../utils/stats";
import { roundToOne, calculateElapsedMinutes } from "../utils/mathUtils";
import { useTheme } from "@mui/material";

import { useGameClock } from "./useGameClock";
import { useLineupState } from "./useLineupState";
import { useStatWriter } from "./useStatWriter";
import { usePossessionTracker } from "./usePossessionTracker";
import { useVoiceRecognition } from "./useVoiceRecognition";
import { ParsedVoiceCommand } from "../utils/voiceParser";
import { logger } from "../utils/logger";

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
    handleNextPeriod,
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
  const [lastOpponentStatId, setLastOpponentStatId] = useState<string | null>(
    null,
  );
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  const handleVoiceCommand = useCallback(
    async (command: ParsedVoiceCommand) => {
      if (!gameId) return;

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
    ],
  );

  const { isListening, lastTranscript } = useVoiceRecognition({
    onCommand: handleVoiceCommand,
    enabled: voiceEnabled,
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);
  const [playName, setPlayName] = useState<string>("");
  const [shotQuality, setShotQuality] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [opponentPlayType, setOpponentPlayType] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  }>({ key: "jerseyNumber", direction: "asc" });

  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

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

  const eventAggregates = useMemo(() => {
    let curScore = 0;
    let oppScore = 0;
    let teamFouls = 0;
    let oppFouls = 0;
    let teamTimeouts = 0;
    let oppTimeouts = 0;
    let posState = null;
    const onCourt = new Set<string>();
    const stintStarts = new Map<string, number>();
    const onCourtPeriodFouls = new Map<string, number>();
    const pType = team?.periodType || "QUARTERS";
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    let lastLineupChangeClock = periodLen;
    let lastLineupChangeScoreTeam = 0;
    let lastLineupChangeScoreOpp = 0;
    let periodStartScoreTeam = 0;
    let periodStartScoreOpp = 0;

    let teamFga = 0,
      teamFta = 0,
      teamTo = 0,
      teamOreb = 0,
      teamThreePM = 0,
      teamPaintTouches = 0;
    let oppFga = 0,
      oppFta = 0,
      oppTo = 0,
      oppOreb = 0;

    const schemeStats: Record<
      string,
      { points: number; fga: number; fta: number; to: number }
    > = {
      MAN: { points: 0, fga: 0, fta: 0, to: 0 },
      ZONE: { points: 0, fga: 0, fta: 0, to: 0 },
      PRESS: { points: 0, fga: 0, fta: 0, to: 0 },
      DOUBLE: { points: 0, fga: 0, fta: 0, to: 0 },
    };

    let lastTeamScoreClockTime = periodLen;
    let lastTeamScorePeriod = 1;
    let foundLastTeamScore = false;

    const threats = new Map<string, OpponentThreat>();
    let possessionStartClock = periodLen;

    for (const s of sortedGameStats) {
      if (s.deletedAt) continue;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      if (isOpp) {
        oppScore += s.points || 0;
        if (s.type === ACTION_TYPES.MAKE) {
          if (s.points === 1) oppFta++;
          else oppFga++;
        }

        if (s.defensiveScheme && schemeStats[s.defensiveScheme]) {
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
        }
      } else {
        curScore += s.points || 0;
        if (s.type === ACTION_TYPES.MAKE) {
          lastTeamScoreClockTime = s.clockTime ?? periodLen;
          lastTeamScorePeriod = s.period;
          foundLastTeamScore = true;
          if (s.points === 1) teamFta++;
          else {
            teamFga++;
            if (s.points === 3) teamThreePM++;
          }
        }
      }

      if (
        [
          ACTION_TYPES.FOUL,
          ACTION_TYPES.FOUL_SHOOTING,
          ACTION_TYPES.FOUL_NON_SHOOTING,
          ACTION_TYPES.TECHNICAL_FOUL,
        ].includes(s.type)
      ) {
        if (isEventInPeriod(s.period, period, pType)) {
          if (isOpp) oppFouls++;
          else {
            teamFouls++;
            if (onCourt.has(s.playerId)) {
              onCourtPeriodFouls.set(
                s.playerId,
                (onCourtPeriodFouls.get(s.playerId) || 0) + 1,
              );
            }
          }
        }
      }

      if (s.type === ACTION_TYPES.TIMEOUT) {
        if (isOpp) oppTimeouts++;
        else teamTimeouts++;
      }

      if (s.type === ACTION_TYPES.POSSESSION) {
        posState = s.playerId;
        possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
      }

      if (isOpp) {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) oppFta++;
          else {
            oppFga++;
            const t = threats.get(s.playerId);
            if (t) t.consecutiveMakes = 0;
          }
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) oppOreb++;
        if (s.type === ACTION_TYPES.TURNOVER) {
          oppTo++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
        } else if (s.type === ACTION_TYPES.MAKE && s.points && s.points > 1) {
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
          let t = threats.get(s.playerId);
          if (!t) {
            t = {
              playerId: s.playerId,
              points: 0,
              makes: 0,
              consecutiveMakes: 0,
              straightPoints: 0,
              isHot: false,
            };
            threats.set(s.playerId, t);
          }
          t.points += s.points;
          t.makes++;
          t.consecutiveMakes++;
          if (t.points >= 8 || t.consecutiveMakes >= 3) t.isHot = true;
        }
      } else {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) teamFta++;
          else {
            teamFga++;
            if (s.points === 3) teamThreePM++;
          }
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          teamOreb++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          teamTo++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
        } else if (s.type === ACTION_TYPES.MAKE && s.points && s.points > 1) {
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.PAINT_TOUCH) {
          teamPaintTouches++;
        }
      }

      if (s.type === ACTION_TYPES.SUB_IN) {
        onCourt.add(s.playerId);
        if (s.period === period) {
          stintStarts.set(s.playerId, s.clockTime ?? periodLen);
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
        stintStarts.delete(s.playerId);
        if (s.period === period) {
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      }

      if (s.period < period) {
        periodStartScoreTeam = curScore;
        periodStartScoreOpp = oppScore;
      }
    }

    if (
      lastLineupChangeClock === periodLen &&
      lastLineupChangeScoreTeam === 0
    ) {
      lastLineupChangeScoreTeam = periodStartScoreTeam;
      lastLineupChangeScoreOpp = periodStartScoreOpp;
    }

    onCourt.forEach((pId) => {
      if (!stintStarts.has(pId)) stintStarts.set(pId, periodLen);
    });

    const defensiveStats = calculateStopsAndKills(sortedGameStats);

    let opponentRunValue = null;
    let tempOppRunPoints = 0;
    let teamScoredSinceOppRunStarted = false;
    for (let i = sortedGameStats.length - 1; i >= 0; i--) {
      const s = sortedGameStats[i];
      if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
      if (isOpp) {
        if (teamScoredSinceOppRunStarted) break;
        tempOppRunPoints += s.points || 0;
      } else {
        teamScoredSinceOppRunStarted = true;
        break;
      }
    }
    if (tempOppRunPoints >= 8) opponentRunValue = `${tempOppRunPoints}-0`;

    let teamRunValue = null;
    let tempTeamRunPoints = 0;
    let oppScoredSinceTeamRunStarted = false;
    for (let i = sortedGameStats.length - 1; i >= 0; i--) {
      const s = sortedGameStats[i];
      if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
      if (!isOpp) {
        if (oppScoredSinceTeamRunStarted) break;
        tempTeamRunPoints += s.points || 0;
      } else {
        oppScoredSinceTeamRunStarted = true;
        break;
      }
    }
    if (tempTeamRunPoints >= 8) teamRunValue = `${tempTeamRunPoints}-0`;

    const MAX_TIMEOUTS = team?.fouls || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);
    const teamPoss = calculatePossessions(teamFga, teamFta, teamTo, teamOreb);
    const oppPoss = calculatePossessions(oppFga, oppFta, oppTo, oppOreb);

    const elapsedMinutes = calculateElapsedMinutes(
      period,
      clockSeconds,
      team?.periodType,
    );
    const fpm =
      elapsedMinutes > 1 ? (teamFouls + oppFouls) / elapsedMinutes : 0;

    return {
      currentScore: curScore,
      opponentScore: oppScore,
      teamPpp: calculatePpp(curScore, teamPoss),
      oppPpp: calculatePpp(oppScore, oppPoss),
      refTightness: fpm,
      teamPoss,
      oppPoss,
      teamThreePM,
      teamPaintTouches,
      teamFoulStats: {
        teamFouls,
        oppFouls,
        teamBonusLabel: teamBonus.label,
        teamIsDouble: teamBonus.isDouble,
        teamBonusColor: teamBonus.color,
        oppBonusLabel: oppBonus.label,
        oppIsDouble: oppBonus.isDouble,
        oppBonusColor: oppBonus.color,
      },
      timeoutStats: {
        teamTOL: Math.max(0, MAX_TIMEOUTS - teamTimeouts),
        oppTOL: Math.max(0, MAX_TIMEOUTS - oppTimeouts),
      },
      possessionState: posState,
      schemeEfficiency: Object.entries(schemeStats).map(([name, s]) => {
        const poss = calculatePossessions(s.fga, s.fta, s.to, 0);
        return { name, ppp: calculatePpp(s.points, poss), possessions: poss };
      }),
      onCourtIds: onCourt,
      stintStarts,
      defensiveStats,
      momentumAlerts: {
        opponentRun: opponentRunValue,
        teamRun: teamRunValue,
        opponentThreats: calculateOpponentThreats(sortedGameStats, {
          period,
          clockTime: clockSeconds,
          scoreDiff: curScore - oppScore,
          periodType: team?.periodType || "QUARTERS",
        }),
      },
      onCourtPeriodFouls,
      lastLineupChangeClock,
      lastLineupChangeScoreTeam,
      lastLineupChangeScoreOpp,
      lastTeamScoreClockTime,
      lastTeamScorePeriod,
      foundLastTeamScore,
      possessionStartClock,
      recentStats: sortedGameStats
        .filter((s) => !s.deletedAt)
        .slice(-10)
        .reverse(),
    };
  }, [
    sortedGameStats,
    period,
    clockSeconds,
    team?.periodType,
    team?.fouls,
    game,
  ]);

  const gameData = useMemo(() => {
    const stintDurations = new Map<string, number>();
    eventAggregates.stintStarts.forEach((startClock, pId) => {
      stintDurations.set(pId, Math.max(0, startClock - clockSeconds));
    });

    let scoringDrought = null;
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    if (eventAggregates.foundLastTeamScore) {
      let droughtSecs = 0;
      if (eventAggregates.lastTeamScorePeriod === period) {
        droughtSecs = eventAggregates.lastTeamScoreClockTime - clockSeconds;
      } else if (eventAggregates.lastTeamScorePeriod < period) {
        droughtSecs =
          eventAggregates.lastTeamScoreClockTime +
          (period - eventAggregates.lastTeamScorePeriod - 1) * periodLen +
          (periodLen - clockSeconds);
      }
      if (droughtSecs >= 180)
        scoringDrought = `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
    } else {
      const elapsedGameSecs =
        (period - 1) * periodLen + (periodLen - clockSeconds);
      if (elapsedGameSecs >= 180)
        scoringDrought = `${Math.floor(elapsedGameSecs / 60)}m ${Math.floor(elapsedGameSecs % 60)}s`;
    }

    const totalElapsedSeconds =
      (period - 1) * periodLen + (periodLen - clockSeconds);
    const totalPossessions = eventAggregates.teamPoss + eventAggregates.oppPoss;
    const livePace =
      totalElapsedSeconds > 0
        ? (totalPossessions / (totalElapsedSeconds / 60)) * 40
        : 0;

    return {
      ...eventAggregates,
      stintDurations,
      livePace,
      currentLineupPlusMinus:
        eventAggregates.currentScore -
        eventAggregates.opponentScore -
        (eventAggregates.lastLineupChangeScoreTeam -
          eventAggregates.lastLineupChangeScoreOpp),
      currentLineupStintDuration: Math.max(
        0,
        eventAggregates.lastLineupChangeClock - clockSeconds,
      ),
      momentumAlerts: { ...eventAggregates.momentumAlerts, scoringDrought },
    };
  }, [eventAggregates, clockSeconds, period, game?.periodLength]);

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
    const res = [];
    const oppColor = theme.palette.secondary.main;
    for (const s of gameStats) {
      if (s.deletedAt) continue;
      if (
        [
          ACTION_TYPES.SUB_IN,
          ACTION_TYPES.SUB_OUT,
          ACTION_TYPES.POSSESSION,
          ACTION_TYPES.TIMEOUT,
        ].includes(s.type)
      )
        continue;
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
    lastViewedHalftimePeriod,
    setLastViewedHalftimePeriod,
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
    sparkPlugIndex: useMemo(
      () => calculateSparkPlugIndex(sortedGameStats, game?.periodLength || 10),
      [sortedGameStats, game?.periodLength],
    ),
    shotROI: useMemo(
      () => calculateShotROI(sortedGameStats),
      [sortedGameStats],
    ),
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
