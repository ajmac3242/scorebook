        offDribbleAttempts++;
        totalTaggedAttempts++;
      }
    }
  }

  const possessions = calculatePossessionsForAgg(agg);

  return {
    ...agg,
    fgPct: calculateFgPct(agg.makes, agg.attempts),
    min: 0,
    plusMinus: 0,
    ppp: calculatePpp(agg.points, possessions),
    possessions: Math.round(possessions),
    efgPct: calculateEfgPct(agg.makes, agg.threePM, agg.attempts),
    toPct: calcPct(agg.turnovers, possessions),
    orbPct: "0.0",
    ftRate: calcPct(agg.ftm, agg.attempts),
    threePPct: calculateFgPct(agg.threePM, agg.threePA),
    tendency: {
      paintPct:
        totalFieldGoalAttempts > 0
          ? ((paintAttempts / totalFieldGoalAttempts) * 100).toFixed(1)
          : "0.0",
      catchAndShootPct:
        totalTaggedAttempts > 0
          ? ((catchAndShootAttempts / totalTaggedAttempts) * 100).toFixed(1)
          : "0.0",
      offDribblePct:
        totalTaggedAttempts > 0
          ? ((offDribbleAttempts / totalTaggedAttempts) * 100).toFixed(1)
          : "0.0",
    },
  };
};

export const calculateOpponentAggregates = (
  stats: StatEvent[],
): OpponentAggregates => {
  const { tendency, ...agg } = calculateOpponentSummary(stats);
  return agg;
};

/**
 * Calculates the score flow data for a game based on chronological events.
 * Uses game clock time (period and clockTime) for accurate timeline positioning.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events.
 * @param {number} periodLengthMinutes - Length of each period in minutes.
 * @returns {ScoreFlowPoint[]} Array of data points for score flow visualization.
 */
export const calculateScoreFlow = (
  stats: StatEvent[],
  periodLengthMinutes: number = 10,
): ScoreFlowPoint[] => {
  const scores = { team: 0, opp: 0 };
  const result: ScoreFlowPoint[] = [
    { time: "00:00", Team: 0, Opponent: 0, Spread: 0 },
  ];
  const periodLenSecs = periodLengthMinutes * 60;

  // Running stats for PPP
  const team = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const opp = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const currentLineup = new Set<string>();
  // ⚡ Bolt: Cached lineup array avoids redundant Array.from calls in the hot loop.
  let cachedLineup: string[] = [];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const isOpp = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    // Track scores
    updateScores(stat, scores);

    // Track possessions
    updatePossessionCounters(stat, isOpp ? opp : team);

    if (isSubstitution(stat)) {
      if (stat.type === ACTION_TYPES.SUB_IN) {
        currentLineup.add(stat.playerId);
      } else {
        currentLineup.delete(stat.playerId);
      }
      cachedLineup = Array.from(currentLineup);
    }

    // Capture point if it's a significant event for the chart
    if (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.TIMEOUT) {
      const period = stat.period || 1;
      const clockTime = stat.clockTime ?? periodLenSecs;
      const elapsedSeconds =
        (period - 1) * periodLenSecs + (periodLenSecs - clockTime);

      const teamPoss = calculatePossessions(
        team.fga,
        team.fta,
        team.to,
        team.oreb,
      );
      const oppPoss = calculatePossessions(opp.fga, opp.fta, opp.to, opp.oreb);

      let eventLabel = stat.type;
      if (stat.type === ACTION_TYPES.MAKE) {
        eventLabel = `${pts}PT MAKE`;
      }

      result.push({
        time: formatClock(elapsedSeconds),
        Team: scores.team,
        Opponent: scores.opp,
        Spread: scores.team - scores.opp,
        event: eventLabel,
        lineup: cachedLineup,
        teamPpp: calculatePpp(scores.team, teamPoss),
        oppPpp: calculatePpp(scores.opp, oppPoss),
      });
    }
  }
  return result;
};

/**
 * Determines if a statistical event occurred within the specified game period.
 * Handles different logic for QUARTERS vs HALVES.
 *
 * @param {number} eventPeriod - The period recorded on the event.
 * @param {number} currentPeriod - The current game period being viewed.
 * @param {string} periodType - 'QUARTERS' or 'HALVES'.
 * @returns {boolean} True if the event belongs to the current period context.
 */
/**
 * 🏀 CoachBoard: isClutchEvent
 * Why: Defines "Clutch Time" as the final 4 minutes of a game when the score is within 5 points.
 *
 * @param eventPeriod - Period of the event.
 * @param clockTime - Seconds remaining in the period.
 * @param scoreDiff - Absolute difference between team and opponent scores.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 * @returns True if the event occurred in a clutch situation.
 */
/**
 * Helper to determine if a period is regulation-final or overtime.
 * @param period - The game period.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
const getClutchPeriodInfo = (period: number, periodType: string) => {
  const isQuarters = periodType === "QUARTERS";
  return {
    isOT: isQuarters ? period > 4 : period > 2,
    isFinal: isQuarters ? period === 4 : period === 2,
    regClutchTime: isQuarters ? 240 : 120,
  };
};

export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  const { isOT, isFinal, regClutchTime } = getClutchPeriodInfo(
    eventPeriod,
    periodType,
  );

  if (!(isFinal || isOT)) return false;
  if (Math.abs(scoreDiff) > 5) return false;

  return isOT || clockTime <= regClutchTime;
};

/**
 * 🔍 Scout: Calculates how many seconds of an interval [startClock, endClock]
 * are considered "clutch time".
 *
 * METHODOLOGY: For efficiency, we clamp the start and end clocks of an interval
 * to the regulation clutch threshold (e.g., 240s). The difference between these
 * clamped values represents the duration of that interval that occurred
 * within the clutch window.
 *
 * @param period - Game period.
 * @param startClock - Seconds remaining at start of interval.
 * @param endClock - Seconds remaining at end of interval.
 * @param scoreDiff - Point spread at start of interval.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
export const getClutchSeconds = (
  period: number,
  startClock: number,
  endClock: number,
  scoreDiff: number,
  periodType: string,
): number => {
  if (Math.abs(scoreDiff) > 5) return 0;
  const { isOT, isFinal, regClutchTime } = getClutchPeriodInfo(
    period,
    periodType,
  );
  if (isOT) return Math.max(0, startClock - endClock);
  if (!isFinal) return 0;

  const s = Math.min(startClock, regClutchTime);
  const e = Math.min(endClock, regClutchTime);
  return Math.max(0, s - e);
};

/**
 * Determines if a statistical event occurred within the specified game period.
 *
 * WHY: In 'HALVES' mode (NCAA), the 2nd half (period 2) typically includes all
 * overtime periods (3+) for high-level reporting. In 'QUARTERS' mode, periods
 * are usually kept distinct unless viewing a full-game summary.
 *
 * @param eventPeriod - The period recorded on the event.
 * @param currentPeriod - The current game period being viewed.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  const isFinal =
    periodType === "QUARTERS" ? currentPeriod === 4 : currentPeriod === 2;
  return isFinal ? eventPeriod >= currentPeriod : eventPeriod === currentPeriod;
};

/**
 * Calculates the score and result (W, L, D) for a single game.
 *
 * @param {number | string} gameId - The game ID.
 * @param {StatEvent[]} stats - All statistics events for filtering.
 * @returns {object} Final team score, opponent score, and result code.
 */
export const calculateGameResult = (
  gameId: number | string,
  stats: StatEvent[],
) => {
  // Combine filter and reduce into a single pass
  const scores = { team: 0, opp: 0 };
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (!isActive(stat)) continue;

    if (stat.gameId === gameId) {
      updateScores(stat, scores);
    }
  }

  // Determine game result: W (Win), L (Loss), D (Draw/Tie).
  const result = determineResult(scores.team, scores.opp);
  return { teamScore: scores.team, oppScore: scores.opp, result };
};

/**
 * 🏀 CoachBoard: calculatePlayerStreaks
 * Why: Identifies players with scoring momentum (Hot/Cold) to assist with rotation decisions.
 * "Hot" is defined as 3+ consecutive field goal makes.
 * "Cold" is defined as 3+ consecutive field goal misses.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for the game.
 * @returns {Map<string, 'HOT' | 'COLD' | null>} Map of player IDs to their current streak status.
 */
/**
 * 🏀 CoachBoard: calculateLineupStats
 *
 * WHY: Lineup efficiency (Plus/Minus for 5-player units) is a critical coaching metric
 * for determining which player combinations work best together.
 *
 * This function handles several complex edge cases:
 * 1. MULTI-GAME: Correctly isolates stints by gameId to prevent cross-game time bleeding.
 * 2. PERIOD TRANSITIONS: Closes active stints at 0:00 of the current period and
 *    re-opens them at the start (default 600s) of the next period if no sub occurred.
 * 3. SUB TRACKING: Uses a Set to track the active 5-man unit and records a "stint"
 *    every time a substitution or period end occurs.
 */
export interface LineupAggregates {
  lineup: string[]; // Player IDs
  pointsFor: number;
  pointsAgainst: number;
  netRating: number;
  seconds: number;
  netRatingPer40: string;
  efgPct: string;
  toPct: string;
  fga: number;
  fgm: number;
  threePM: number;
  fta: number;
  turnovers: number;
  oreb: number;
}

/**
 * Interface for matchup-based statistics.
 */
export interface MatchupStats {
  ourPlayerId: string;
  opponentPlayerId: string;
  pointsAllowed: number;
  stops: number;
  possessions: number;
  stopPct: string;
  isOpponentDefender?: boolean;
  fga?: number;
  fta?: number;
  to?: number;
  oreb?: number;
}

/**
 * Interface for On/Off impact metrics.
 */
export interface OnOffImpact {
  playerId: string;
  onPointsFor: number;
  onPointsAgainst: number;
  onPossessions: number;
  onOffensiveRating: string;
  onDefensiveRating: string;
  onNetRating: string;
  offPointsFor: number;
  offPointsAgainst: number;
  offPossessions: number;
  offOffensiveRating: string;
  offDefensiveRating: string;
  offNetRating: string;
  netDifferential: string;
}

/**
 * Generates a unique, sorted string key for a set of players.
 * @param {Set<string> | string[]} players - The players in the lineup.
 * @returns {string} The sorted lineup key.
 */
const getLineupKey = (players: Set<string> | string[]): string =>
  Array.from(players).sort().join(",");

/**
 * Updates a lineup's statistical aggregate with data from a specific stint.
 * @param {Map<string, LineupAggregates>} lineupStats - Map of lineup aggregates.
 * @param {string} key - Lineup key.
 * @param {number} seconds - Duration of the stint.
 * @param {number} ptsFor - Points scored during the stint.
 * @param {number} ptsAgainst - Points allowed during the stint.
 */
const recordLineupStint = (
  lineupStats: Map<string, LineupAggregates>,
  key: string,
  seconds: number,
  ptsFor: number,
  ptsAgainst: number,
  fga: number,
  fgm: number,
  threePM: number,
  fta: number,
  turnovers: number,
  oreb: number,
) => {
  let agg = lineupStats.get(key);
  if (!agg) {
    agg = {
      lineup: key.split(","),
      pointsFor: 0,
      pointsAgainst: 0,
      netRating: 0,
      seconds: 0,
      netRatingPer40: "0.0",
      efgPct: "0.0",
      toPct: "0.0",
      fga: 0,
      fgm: 0,
      threePM: 0,
      fta: 0,
      turnovers: 0,
      oreb: 0,
    };
    lineupStats.set(key, agg);
  }
  agg.seconds += seconds;
  agg.pointsFor += ptsFor;
  agg.pointsAgainst += ptsAgainst;
  agg.fga += fga;
  agg.fgm += fgm;
  agg.threePM += threePM;
  agg.fta += fta;
  agg.turnovers += turnovers;
  agg.oreb += oreb;
};

/**
 * Records full minutes for periods where no events occurred but a lineup remained on court.
 */
const recordSkippedPeriods = (
  lineupStats: Map<string, LineupAggregates>,
  lineupKey: string,
  startPeriod: number,
  endPeriod: number,
  lastScoreDiff: number,
  periodType: string,
  options: {
    periodLength?: number;
    overtimeLength?: number;
    clutchOnly?: boolean;
  },
) => {
  for (let p = startPeriod; p < endPeriod; p++) {
    const pLen = getPeriodLen(p, options);
    const skipClutchSecs = getClutchSeconds(
      p,
      pLen,
      0,
      lastScoreDiff,
      periodType,
    );
    recordLineupStint(
      lineupStats,
      lineupKey,
      options.clutchOnly ? skipClutchSecs : pLen,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  }
};

export const calculateLineupStats = (
  stats: StatEvent[],
  options: {
    isSorted?: boolean;
    periodLength?: number;
    overtimeLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
    key?: string;
    direction?: "asc" | "desc";
  } = {},
): LineupAggregates[] => {
  // ⚡ Bolt: Process events in a single pass to avoid grouping overhead.
  const sortedStats = options.isSorted ? stats : sortStats(stats);
  const lineupStats = new Map<string, LineupAggregates>();

  let currentLineup = new Set<string>();
  // PERFORMANCE: cachedLineupKey avoids expensive Set->Array->Sort->Join operations
  // on every event. The key is only recalculated when a substitution occurs.
  let cachedLineupKey: string | null = null;
  let lastClockTime = getPeriodLen(1, options);
  let lastScoreDiff = 0;
  let lastTeamScore = 0;
  let lastOppScore = 0;
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  const scores = { team: 0, opp: 0 };

  let pendingDuration = 0;
  let pendingPtsFor = 0;
  let pendingPtsAgainst = 0;
  let pendingFga = 0;
  let pendingFgm = 0;
  let pendingThreePM = 0;
  let pendingFta = 0;
  let pendingTurnovers = 0;
  let pendingOreb = 0;

  const flushPending = () => {
    if (
      pendingDuration === 0 &&
      pendingPtsFor === 0 &&
      pendingPtsAgainst === 0 &&
      pendingFga === 0 &&
      pendingFgm === 0 &&
      pendingThreePM === 0 &&
      pendingFta === 0 &&
      pendingTurnovers === 0 &&
      pendingOreb === 0
    )
      return;
    if (currentLineup.size === 5) {
      if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
      recordLineupStint(
        lineupStats,
        cachedLineupKey,
        pendingDuration,
        pendingPtsFor,
        pendingPtsAgainst,
        pendingFga,
        pendingFgm,
        pendingThreePM,
        pendingFta,
        pendingTurnovers,
        pendingOreb,
      );
    }
    pendingDuration = 0;
    pendingPtsFor = 0;
    pendingPtsAgainst = 0;
    pendingFga = 0;
    pendingFgm = 0;
    pendingThreePM = 0;
    pendingFta = 0;
    pendingTurnovers = 0;
    pendingOreb = 0;
  };

  const periodType = options.periodType || "QUARTERS";

  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    if (!isActive(s)) continue;

    // ⚡ Bolt: Handle multi-game aggregation by detecting game context changes in-stream.
    if (currentGameId !== null && s.gameId !== currentGameId) {
      if (currentLineup.size === 5) {
        const clutchSec = getClutchSeconds(currentPeriod, lastClockTime, 0, lastScoreDiff, periodType);
        pendingDuration += options.clutchOnly ? clutchSec : lastClockTime;
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
      }
      flushPending();
      currentLineup.clear();
      cachedLineupKey = null;
      lastClockTime = getPeriodLen(1, options);
      lastScoreDiff = 0;
      lastTeamScore = 0;
      lastOppScore = 0;
      currentPeriod = 1;
      scores.team = 0;
      scores.opp = 0;
    }
    currentGameId = s.gameId;

    // Handle period transition
    if (s.period > currentPeriod) {
      if (currentLineup.size === 5) {
        const clutchSec = getClutchSeconds(currentPeriod, lastClockTime, 0, lastScoreDiff, periodType);
        pendingDuration += options.clutchOnly ? clutchSec : lastClockTime;
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
        flushPending();

        // 🔍 Scout: Handle full minutes for skipped periods
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordSkippedPeriods(
          lineupStats,
          cachedLineupKey,
          currentPeriod + 1,
          s.period,
          lastScoreDiff,
          periodType,
          options,
        );
      } else {
        flushPending();
      }
      lastClockTime = getPeriodLen(s.period, options);
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
      currentPeriod = s.period;
    }

    // Accumulate interval stats
    if (s.clockTime !== undefined && currentLineup.size === 5) {
      const clutchSecs = getClutchSeconds(
        s.period,
        lastClockTime,
        s.clockTime,
        lastScoreDiff,
        periodType,
      );
      if (!options.clutchOnly || clutchSecs > 0) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        pendingDuration += options.clutchOnly ? clutchSecs : (lastClockTime - s.clockTime);
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
      }
      lastClockTime = s.clockTime;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
    }

    // ⚡ Bolt: Use domain helpers for scoring and opponent identification.
    if (s.type === ACTION_TYPES.MAKE) {
      const pts = s.points || 0;
      if (isOpponentId(s.playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
        // Track lineup-level metrics
        if (isFreeThrow(s)) {
          pendingFta++;
        } else {
          pendingFga++;
          pendingFgm++;
          if (pts === 3) pendingThreePM++;
        }
      }
      lastScoreDiff = scores.team - scores.opp;
    } else if (!isOpponentId(s.playerId)) {
      if (s.type === ACTION_TYPES.MISS) {
        if (isFreeThrow(s)) {
          pendingFta++;
        } else {
          pendingFga++;
          if (isThreePointAttempt(s)) pendingThreePM += 0; // Just for clarity
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        pendingTurnovers++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        pendingOreb++;
      }
    }

    // When lineup changes
    if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
      flushPending();
      if (s.type === ACTION_TYPES.SUB_IN) currentLineup.add(s.playerId);
      else currentLineup.delete(s.playerId);
      cachedLineupKey = null;
    }
  }

  // Final stint
  if (currentGameId !== null && currentLineup.size === 5) {
    const liveCtx = options.liveContext;
    const finalClock =
      liveCtx && currentGameId === sortedStats[sortedStats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    const clutchSecs = getClutchSeconds(
      currentPeriod,
      lastClockTime,
      finalClock,
      lastScoreDiff,
      periodType,
    );
    pendingDuration += options.clutchOnly ? clutchSecs : Math.max(0, lastClockTime - finalClock);
    pendingPtsFor += scores.team - lastTeamScore;
    pendingPtsAgainst += scores.opp - lastOppScore;
    flushPending();
  }

  const sortKey = (options.key || "netRating") as keyof LineupAggregates;
  const sortDir = options.direction || "desc";

  const result = Array.from(lineupStats.values()).map((agg) => {
    const net = agg.pointsFor - agg.pointsAgainst;
    const mins = agg.seconds / 60;
    const netRatingPer40Str = mins > 0 ? ((net / mins) * 40).toFixed(1) : "0.0";

    // ⚡ Bolt: Pre-calculate numeric sort value to avoid expensive calculations
    // and parseFloat calls in the hot .sort() comparator ($O(N log N)$).
    let sortValue: number;
    if (sortKey === "netRatingPer40") {
      sortValue = mins > 0 ? (net / mins) * 40 : 0;
    } else if (sortKey === "netRating") {
      sortValue = net;
    } else {
      const val = agg[sortKey];
      sortValue = typeof val === "number" ? val : 0;
    }

    const lineupPossessions = calculatePossessionsForAgg({ attempts: agg.fga, fta: agg.fta, turnovers: agg.turnovers, oreb: agg.oreb });
    return {
      ...agg,
      netRating: net,
      netRatingPer40: netRatingPer40Str,
      efgPct: calculateEfgPct(agg.fgm, agg.threePM, agg.fga),
      toPct: calcPct(agg.turnovers, lineupPossessions),
      sortValue,
    };
  });

  return result
    .sort((a, b) =>
      sortDir === "desc"
        ? b.sortValue - a.sortValue
        : a.sortValue - b.sortValue,
    )
    .map(({ sortValue: _sortValue, ...rest }) => rest);
};

/**
 * 🏀 CoachBoard: calculatePlayerStreaks
 *
 * WHY: Momentum is a key factor in basketball. Identifying players who are "Hot" (scoring)
 * or "Cold" (struggling) helps coaches make better rotation and play-calling decisions.
 *
 * LOGIC:
 * - HOT (🔥): Triggered by 3 consecutive field goal makes.
 * - COLD (❄️): Triggered by 3 consecutive field goal misses.
 * - Interruptions: Any Miss resets a Hot streak; any Make resets a Cold streak.
 * - Exclusions: Free throws are excluded to focus on field goal flow.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @param options - Optimization flags.
 * @param options.isSorted - Skip sorting if data is already ordered.
 * @returns Map of player IDs to their current streak status ('HOT', 'COLD', or null).
 */
/**
 * 🏀 CoachBoard: calculateMatchupStats
 *
 * WHY: Tracks defensive performance by correlating opponent scoring and turnovers
 * with the assigned primary defender.
 *
 * @param stats - Chronological list of statistical events.
 * @returns Array of matchup statistics.
 */
export const calculateMatchupStats = (stats: StatEvent[]): MatchupStats[] => {
  const sorted = sortStats(stats);
  const currentMatchups = new Map<string, string>(); // Opponent ID -> Our Player ID
  const reverseMatchups = new Map<string, string>(); // Our Player ID -> Opponent ID
  const results = new Map<string, MatchupStats>(); // "ourId:oppId:isOppDef" -> stats

  let inOpponentPossession = false;
  let opponentPossessionPlayerId: string | null = null;
  let inOurPossession = false;
  let ourPossessionPlayerId: string | null = null;
  let currentGameId: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentMatchups.clear();
      inOpponentPossession = false;
      inOurPossession = false;
    }

    const isOpp = isOpponentId(s.playerId);
    const type = s.type;

    if (type === ACTION_TYPES.MATCHUP) {
      // ⚡ Bolt: Correctly manage bidirectional mapping when reassignment occurs.
      // 1. If this opponent was previously guarded by someone else, remove that old link.
      const oldOurId = currentMatchups.get(s.playerId);
      if (oldOurId) reverseMatchups.delete(oldOurId);

      if (s.relatedPlayerId) {
        // 2. If our player was previously guarding a different opponent, remove that old link.
        const oldOppId = reverseMatchups.get(s.relatedPlayerId);
        if (oldOppId) currentMatchups.delete(oldOppId);

        currentMatchups.set(s.playerId, s.relatedPlayerId);
        reverseMatchups.set(s.relatedPlayerId, s.playerId);
      } else {
        currentMatchups.delete(s.playerId);
      }
      continue;
    }

    // Direction 1: Our defender guarding Opponent
    const ourDefenderId =
      currentMatchups.get(s.playerId) ||
      currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);

    // Direction 2: Opponent defender guarding Us
    // ⚡ Bolt: Use reverseMatchups Map for O(1) lookup instead of iterating currentMatchups.
    const oppDefenderId = reverseMatchups.get(s.playerId);

    // 🔍 Scout: Helper to get or create matchup stats record
    const getM = (ourId: string, oppId: string, isOppDef: boolean) => {
      const key = `${ourId}:${oppId}:${isOppDef}`;
      let m = results.get(key);
      if (!m) {
        m = {
          ourPlayerId: ourId,
          opponentPlayerId: oppId,
          pointsAllowed: 0,
          stops: 0,
          possessions: 0,
          stopPct: "0.0",
          isOpponentDefender: isOppDef,
          fga: 0, fta: 0, to: 0, oreb: 0
        };
        results.set(key, m);
      }
      return m;
    };

    // SCORING
    if (isScoringEvent(s)) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
        inOpponentPossession = false;
        inOurPossession = false;
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
        inOurPossession = false;
        inOpponentPossession = false;
      }
      continue;
    }

    // POSSESSION ENDERS (STOPS/TURNOVERS)
    if (type === ACTION_TYPES.TURNOVER) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
        inOpponentPossession = false;
        inOurPossession = false;
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
        inOurPossession = false;
        inOpponentPossession = false;
      }
      inOpponentPossession = false;
      inOurPossession = false;
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isOpp) {
        inOpponentPossession = true;
        opponentPossessionPlayerId = s.playerId;
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      } else {
        inOurPossession = true;
        ourPossessionPlayerId = s.playerId;
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      }
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.oreb = (m.oreb || 0) + 1;
        }
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.oreb = (m.oreb || 0) + 1;
        }
      }
    } else if (isDefensiveRebound(s)) {
      if (isOpp) {
        if (inOurPossession && ourPossessionPlayerId) {
          let odId: string | undefined;
          for (const [oid, ourid] of currentMatchups.entries()) {
            if (ourid === ourPossessionPlayerId) {
              odId = oid;
              break;
            }
          }
          if (odId) {
            const m = getM(ourPossessionPlayerId, odId, true);
            m.stops++;
          }
        }
        inOurPossession = false;
      } else {
        if (inOpponentPossession && opponentPossessionPlayerId) {
          const defId =
            currentMatchups.get(opponentPossessionPlayerId) ||
            currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);
          if (defId) {
            const m = getM(defId, opponentPossessionPlayerId, false);
            m.stops++;
          }
        }
        inOpponentPossession = false;
      }
    }
  }

  // Finalize stop percentages
  return Array.from(results.values()).map((m) => {
    const possessions = calculatePossessions(m.fga || 0, m.fta || 0, m.to || 0, m.oreb || 0);
    return {
      ...m,
      possessions,
      stopPct: possessions > 0 ? ((m.stops / possessions) * 100).toFixed(1) : "0.0",
    };
  });
};

/**
 * 🏀 Assistant Coach: calculateTimeoutRecommendation
 * WHY: Helps high-stress situational decision making.
 */
export const calculateTimeoutRecommendation = (params: {
  opponentRun: string | null;
  teamFoulTrouble: boolean;
  clutchMode: boolean;
  timeoutsRemaining: number;
  isClockRunning: boolean;
  scoreSpread: number;
  clockSeconds: number;
  period: number;
}): { recommendation: string | null; urgency: "LOW" | "MEDIUM" | "HIGH" } => {
  const {
    opponentRun,
    teamFoulTrouble,
    clutchMode,
    timeoutsRemaining,
    isClockRunning,
    scoreSpread,
    clockSeconds,
    period,
  } = params;

  if (timeoutsRemaining <= 0) return { recommendation: null, urgency: "LOW" };

  // 1. High Urgency: Opponent is on a major run and clock is running
  if (opponentRun) {
    const runPoints = parseInt(opponentRun.split("-")[0]);
    if (runPoints >= 10) {
      return { recommendation: "STOP THE RUN: Opponent is on a " + opponentRun + " run.", urgency: "HIGH" };
    }
    if (runPoints >= 6) {
      return { recommendation: "MOMENTUM SHIFT: Opponent is on a " + opponentRun + " run.", urgency: "MEDIUM" };
    }
  }

  // 2. Foul Trouble Alert
  if (teamFoulTrouble && !clutchMode && period < 4) {
    return { recommendation: "PERSONNEL: Star player in foul trouble. Consider sub or timeout to adjust.", urgency: "MEDIUM" };
  }

  // 3. Late Game Clutch Situation
  if (clutchMode && clockSeconds < 60 && !isClockRunning && Math.abs(scoreSpread) <= 3) {
    return { recommendation: "STRATEGIC: Final minute, tight game. Use timeout to advance ball or set play.", urgency: "HIGH" };
  }

  return { recommendation: null, urgency: "LOW" };
};

/**
 * 🏀 Assistant Coach: generatePlayerNarrative
 * WHY: Converts raw data into actionable feedback for players.
 */
export const generatePlayerNarrative = (
  playerStats: PlayerAggregates,
): { strength: string; growth: string } | null => {
  if (playerStats.min < 0.1) return null;

  const strengths = [];
  const growths = [];

  // Efficiency
  if (parseFloat(playerStats.threePPct) > 40 && playerStats.threePA >= 3) {
    strengths.push("Elite efficiency from the 3PT line (" + playerStats.threePPct + "%)");
  } else if (parseFloat(playerStats.fgPct) > 55 && playerStats.attempts >= 5) {
    strengths.push("Strong interior finishing and shot selection");
  }

  // Playmaking
  if (playerStats.assists >= 4) {
    strengths.push("Excellent floor vision and playmaking");
  } else if (playerStats.assists > 0 && playerStats.turnovers === 0) {
    strengths.push("Perfect ball security with zero turnovers");
  }

  // Defense
  if (playerStats.steals + playerStats.blocks >= 3) {
    strengths.push("High-impact defensive presence and disruptor");
  }

  // Growth Areas
  if (playerStats.turnovers >= 3) {
    growths.push("High turnover rate on drives - focus on ball security");
  }
  if (parseFloat(playerStats.ftPct) < 60 && playerStats.fta >= 2) {
    growths.push("Struggled at the free throw line (" + playerStats.ftPct + "%)");
  }
  if (playerStats.fouls >= 4) {
