import { useState, useEffect, useMemo, useRef } from "react";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { syncService } from "../utils/syncService";
import { SyncPromise } from "../dbMock";
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
  type PlayerAggregates,
  OpponentThreat,
} from "../utils/stats";
import { roundToOne } from "../utils/mathUtils";
import { useTheme } from "@mui/material";

export const useGameMode = (gameId: string | null, teamId: string | null) => {
  const theme = useTheme();
  // Local state for recording individual actions
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);
  const [playName, setPlayName] = useState<string>("");
  const [shotQuality, setShotQuality] = useState<string | null>(null);

  const [clockSeconds, setClockSeconds] = useState<number>(0);
  const clockSecondsRef = useRef(clockSeconds);
  useEffect(() => {
    clockSecondsRef.current = clockSeconds;
  }, [clockSeconds]);
  const [isClockRunning, setIsClockRunning] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  }>({ key: "jerseyNumber", direction: "asc" });

  // Filter for displaying court markers
  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

  // State for editing and deleting actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  // Game lifecycle state
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false);
  const [isClockEditDialogOpen, setIsClockEditDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [ftWorkflowOpen, setFtWorkflowOpen] = useState(false);
  const [halftimeReportOpen, setHalftimeReportOpen] = useState(false);
  const [lastViewedHalftimePeriod, setLastViewedHalftimePeriod] =
    useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSavingStat, setIsSavingStat] = useState(false);
  const [chainPrompt, setChainPrompt] = useState<{
    type: "ASSIST" | "REBOUND";
    originalStat: StatEvent;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);

  // Quick sub draft state
  const [draftOnCourtIds, setDraftOnCourtIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);

  const [period, setPeriod] = useState<number>(1);
  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  // Derived data from StatEvents
  const gameStatsQueryResult = useLiveQuery(
    () =>
      gameId
        ? db.stats.where("gameId").equals(gameId).toArray()
        : (SyncPromise.resolve([]) as unknown as StatEvent[]),
    [gameId],
  );
  const gameStats = useMemo(
    () => gameStatsQueryResult || [],
    [gameStatsQueryResult],
  );

  // Combine roster and player data to avoid unstable dependency chains
  const rosterData = useLiveQuery(() => {
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
          .then((p) => ({
            teamPlayers: tp,
            players: p,
          }));
      });
  }, [teamId]) || { teamPlayers: [], players: [] };

  const { teamPlayers, players } = rosterData;

  const playerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.id) map.set(p.id.toString(), p.name);
    }
    return map;
  }, [players]);

  // Combine game and team data
  const gameAndTeam = useLiveQuery(() => {
    return db.games.get(gameId || "").then(g => {
      if (g?.teamId) {
        return db.teams.get(g.teamId).then(t => ({ game: g, team: t }));
      }
      return { game: g, team: undefined };
    });
  }, [gameId]) || { game: undefined, team: undefined };

  const { game, team } = gameAndTeam;

  const teamSeasonStats = useLiveQuery(() => {
    if (!teamId) return { ppp: "0.00" };
    return db.games.where("teamId").equals(teamId).toArray().then(games => {
      const gameIds = games.map((g) => g.id!).filter(Boolean);
      return db.stats.where("gameId").anyOf(gameIds).toArray().then(allStats => {
        return calculateTeamSeasonAverages(games, allStats);
      });
    });
  }, [teamId]);

  useEffect(() => {
    if (game?.currentPeriod && game.currentPeriod !== period) {
      setPeriod(game.currentPeriod);
    }
    if (game?.clockTime !== undefined && !isClockRunning) {
      setClockSeconds(game.clockTime);
    } else if (game?.clockTime === undefined && clockSeconds === 0) {
      setClockSeconds(game?.periodLength ? game.periodLength * 60 : 600);
    }
  }, [
    game?.currentPeriod,
    game?.clockTime,
    game?.periodLength,
    period,
    isClockRunning,
    clockSeconds,
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isClockRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        setClockSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (clockSeconds === 0) {
      setIsClockRunning(false);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, clockSeconds]);

  useEffect(() => {
    if (isClockRunning && gameId) {
      const syncInterval = setInterval(async () => {
        await db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [isClockRunning, gameId]);

  const isReadOnly = !!game?.deletedAt || !!team?.deletedAt;
  const periodType = team?.periodType || "QUARTERS";
  const periodLabel = periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = periodType === "HALVES" ? 2 : 4;

  useEffect(() => {
    if (game?.completed && !summaryDialogOpen && !endGameDialogOpen) {
      setTimeout(() => setSummaryDialogOpen(true), 0);
    }
  }, [game?.completed, summaryDialogOpen, endGameDialogOpen]);

  useEffect(() => {
    const isEndOfFirstHalf =
      (periodType === "QUARTERS" && period === 3) ||
      (periodType === "HALVES" && period === 2);

    if (isEndOfFirstHalf && lastViewedHalftimePeriod < period) {
      setHalftimeReportOpen(true);
      setLastViewedHalftimePeriod(period);
    }
  }, [period, periodType, lastViewedHalftimePeriod]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncService.pushUpdates();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

    let teamFga = 0;
    let teamFta = 0;
    let teamTo = 0;
    let teamOreb = 0;
    let oppFga = 0;
    let oppFta = 0;
    let oppTo = 0;
    let oppOreb = 0;

    let lastTeamScoreClockTime = periodLen;
    let lastTeamScorePeriod = 1;
    let foundLastTeamScore = false;

    const threats = new Map<string, OpponentThreat>();

    for (let i = 0; i < sortedGameStats.length; i++) {
      const s = sortedGameStats[i];
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
      } else {
        curScore += s.points || 0;
        if (s.type === ACTION_TYPES.MAKE) {
          lastTeamScoreClockTime = s.clockTime ?? periodLen;
          lastTeamScorePeriod = s.period;
          foundLastTeamScore = true;
          if (s.points === 1) teamFta++;
          else teamFga++;
        }
      }

      if (
        s.type === ACTION_TYPES.FOUL ||
        s.type === ACTION_TYPES.FOUL_SHOOTING ||
        s.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
        s.type === ACTION_TYPES.TECHNICAL_FOUL
      ) {
        if (isEventInPeriod(s.period, period, pType)) {
          if (isOpp) {
            oppFouls++;
          } else {
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
        if (isOpp) {
          oppTimeouts++;
        } else {
          teamTimeouts++;
        }
      }

      if (s.type === ACTION_TYPES.POSSESSION) {
        posState = s.playerId;
      }

      if (isOpp) {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) {
            oppFta++;
          } else {
            oppFga++;
            let t = threats.get(s.playerId);
            if (t) t.consecutiveMakes = 0;
          }
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          oppOreb++;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          oppTo++;
        } else if (s.type === ACTION_TYPES.MAKE && s.points && s.points > 1) {
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
          if (t.points >= 8 || t.consecutiveMakes >= 3) {
            t.isHot = true;
          }
        }
      } else {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) teamFta++;
          else teamFga++;
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          teamOreb++;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          teamTo++;
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
      if (!stintStarts.has(pId)) {
        stintStarts.set(pId, periodLen);
      }
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
    if (tempOppRunPoints >= 8) {
      opponentRunValue = `${tempOppRunPoints}-0`;
    }

    const MAX_TIMEOUTS = team?.fouls || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);

    const teamPoss = calculatePossessions(teamFga, teamFta, teamTo, teamOreb);
    const oppPoss = calculatePossessions(oppFga, oppFta, oppTo, oppOreb);

    return {
      currentScore: curScore,
      opponentScore: oppScore,
      teamPpp: calculatePpp(curScore, teamPoss),
      oppPpp: calculatePpp(oppScore, oppPoss),
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
      onCourtIds: onCourt,
      stintStarts,
      defensiveStats,
      momentumAlerts: {
        opponentRun: opponentRunValue,
        opponentThreats: Array.from(threats.values()).filter((t) => t.isHot),
      },
      onCourtPeriodFouls,
      lastLineupChangeClock,
      lastLineupChangeScoreTeam,
      lastLineupChangeScoreOpp,
      lastTeamScoreClockTime,
      lastTeamScorePeriod,
      foundLastTeamScore,
      recentStats: sortedGameStats
        .filter((s) => !s.deletedAt)
        .slice(-10)
        .reverse(),
    };
  }, [sortedGameStats, period, team?.periodType, team?.fouls, game]);

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
      if (droughtSecs >= 180) {
        scoringDrought = `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
      }
    } else {
      const elapsedGameSecs =
        (period - 1) * periodLen + (periodLen - clockSeconds);
      if (elapsedGameSecs >= 180) {
        scoringDrought = `${Math.floor(elapsedGameSecs / 60)}m ${Math.floor(elapsedGameSecs % 60)}s`;
      }
    }

    return {
      ...eventAggregates,
      stintDurations,
      currentLineupPlusMinus:
        eventAggregates.currentScore -
        eventAggregates.opponentScore -
        (eventAggregates.lastLineupChangeScoreTeam -
          eventAggregates.lastLineupChangeScoreOpp),
      currentLineupStintDuration: Math.max(
        0,
        eventAggregates.lastLineupChangeClock - clockSeconds,
      ),
      momentumAlerts: {
        ...eventAggregates.momentumAlerts,
        scoringDrought,
      },
    };
  }, [eventAggregates, clockSeconds, period, game?.periodLength]);

  useEffect(() => {
    if (subDialogOpen) {
      setDraftOnCourtIds(new Set(gameData.onCourtIds));
      setSelectedSwapId(subOutPlayerId);
    }
  }, [subDialogOpen, gameData.onCourtIds, subOutPlayerId]);

  const jerseyMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
    }
    return map;
  }, [teamPlayers]);

  const statsGridDataRaw = useMemo(() => {
    return calculatePlayerAggregates(
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
  }, [players, sortedGameStats, teamPlayers, game?.periodLength, period]);

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
      let valA = a[key];
      let valB = b[key];

      if (typeof valA === "string" && typeof valB === "string") {
        if (direction === "asc") {
          if (valA < valB) return -1;
          if (valA > valB) return 1;
          return 0;
        } else {
          if (valB < valA) return -1;
          if (valB > valA) return 1;
          return 0;
        }
      }

      valA = (valA as number) || 0;
      valB = (valB as number) || 0;
      return direction === "asc" ? valA - valB : valB - valA;
    });
  }, [statsGridData, sortConfig]);

  const statsMap = useMemo(() => {
    const map = new Map<string, PlayerAggregates>();
    for (let i = 0; i < statsGridData.length; i++) {
      map.set(statsGridData[i].id.toString(), statsGridData[i]);
    }
    return map;
  }, [statsGridData]);

  const opponentStats = useMemo(() => {
    const oppEvents = sortedGameStats.filter((s) => isOpponentId(s.playerId));
    const jerseyMap = new Map<string, StatEvent[]>();
    for (const s of oppEvents) {
      const id = s.playerId;
      if (!jerseyMap.has(id)) jerseyMap.set(id, []);
      jerseyMap.get(id)!.push(s);
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
        isHot: !!t,
        straightPoints: t?.straightPoints || 0,
      });
    }
    return res.sort((a, b) => b.points - a.points);
  }, [sortedGameStats, gameData.momentumAlerts.opponentThreats]);

  const halftimeLineupStats = useMemo(() => {
    if (!halftimeReportOpen) return [];
    const firstHalfStats = sortedGameStats.filter((s) => {
      if (periodType === "QUARTERS") return s.period <= 2;
      return s.period <= 1;
    });
    return calculateLineupStats(firstHalfStats, {
      isSorted: true,
      periodLength: game?.periodLength,
    });
  }, [halftimeReportOpen, sortedGameStats, periodType, game?.periodLength]);

  const playerStreaks = useMemo(() => {
    return calculatePlayerStreaks(sortedGameStats, { isSorted: true });
  }, [sortedGameStats]);

  const playbookEfficiency = useMemo(() => {
    return calculatePlayEfficiency(sortedGameStats);
  }, [sortedGameStats]);

  const markers = useMemo(() => {
    const res = [];
    const oppColor = theme.palette.secondary.main;
    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (s.deletedAt) continue;

      const type = s.type;
      if (
        type === ACTION_TYPES.SUB_IN ||
        type === ACTION_TYPES.SUB_OUT ||
        type === ACTION_TYPES.POSSESSION ||
        type === ACTION_TYPES.TIMEOUT
      )
        continue;

      if (
        markerFilter !== "ALL" &&
        type !== markerFilter &&
        !(
          markerFilter === "REBOUND" &&
          (type === ACTION_TYPES.OFF_REBOUND ||
            type === ACTION_TYPES.DEF_REBOUND)
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
          : type === ACTION_TYPES.MAKE
            ? "#4CAF50"
            : type === ACTION_TYPES.MISS
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
    dialogOpen,
    setDialogOpen,
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
    deleteDialogOpen,
    setDeleteDialogOpen,
    statToDelete,
    setStatToDelete,
    isEditing,
    setIsEditing,
    editingStatId,
    setEditingStatId,
    endGameDialogOpen,
    setEndGameDialogOpen,
    isClockEditDialogOpen,
    setIsClockEditDialogOpen,
    summaryDialogOpen,
    setSummaryDialogOpen,
    auditDialogOpen,
    setAuditDialogOpen,
    ftWorkflowOpen,
    setFtWorkflowOpen,
    halftimeReportOpen,
    setHalftimeReportOpen,
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
    subDialogOpen,
    setSubDialogOpen,
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
    isReadOnly,
    periodType,
    periodLabel,
    maxPeriod,
    sortedGameStats,
    gameData,
    jerseyMap,
    sortedStatsGridData,
    statsMap,
    opponentStats,
    halftimeLineupStats,
    playerStreaks,
    playbookEfficiency,
    markers,
    clockSecondsRef,
  };
};
