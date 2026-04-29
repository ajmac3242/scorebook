      : 0;

  const diffEnd = lastClockTime - finalClock;
  for (let j = 0; j < activePlayersArray.length; j++) {
    const pAgg = activePlayersArray[j];
    const clutchSecs = getClutchSeconds(
      currentPeriod,
      lastClockTime,
      finalClock,
      lastScoreDiff,
      periodType,
    );
    pAgg.min += clutchOnly ? clutchSecs : diffEnd;
  }

  // Finalize totals, percentages, and averages
  const playerAggregates: PlayerAggregates[] = [];
  const isAverage = viewType === "average";
  for (const player of statsMap.values()) {
    const gpActual = player.gamesPlayed.size;
    const gp = gpActual || 1;
    player.gp = gpActual;
    player.fgPct = calculateFgPct(player.makes, player.attempts);
    player.threePPct = calculateFgPct(player.threePM, player.threePA);
    player.ftPct = calculateFtPct(player.ftm, player.fta);
    player.efgPct = calculateEfgPct(
      player.makes,
      player.threePM,
      player.attempts,
    );
    player.tsPct = calculateTsPct(player.points, player.attempts, player.fta);

    if (isAverage) {
      player.points = roundToOne(player.points / gp);
      player.rebounds = roundToOne(player.rebounds / gp);
      player.assists = roundToOne(player.assists / gp);
      player.steals = roundToOne(player.steals / gp);
      player.turnovers = roundToOne(player.turnovers / gp);
      player.blocks = roundToOne(player.blocks / gp);
      player.offRebounds = roundToOne(player.offRebounds / gp);
      player.defRebounds = roundToOne(player.defRebounds / gp);
      player.makes = roundToOne(player.makes / gp);
      player.attempts = roundToOne(player.attempts / gp);
      player.threePM = roundToOne(player.threePM / gp);
      player.threePA = roundToOne(player.threePA / gp);
      player.ftm = roundToOne(player.ftm / gp);
      player.fta = roundToOne(player.fta / gp);
      player.fouls = roundToOne(player.fouls / gp);
      player.min = roundToOne(player.min / (60 * gp)); // Convert to avg mins
      player.plusMinus = roundToOne(player.plusMinus / gp);
    } else {
      player.min = roundToOne(player.min / 60); // Total mins
    }
    playerAggregates.push(player);
  }
  return playerAggregates;
};

/**
 * Interface for a player's stint on the court.
 */
export interface PlayerStint {
  playerId: string;
  period: number;
  startClock: number; // Seconds remaining in period at start of stint
  endClock: number; // Seconds remaining in period at end of stint
}

/**
 * 🏀 CoachBoard: calculatePlayerStintTimeline
 *
 * WHY: Visualizing when players were on the court helps identify rotation
 * patterns and fatigue.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for a SINGLE game.
 * @param {object} [options] - Configuration for period length and live context.
 * @param {number} [options.periodLength] - Regulation period length in minutes.
 * @param {number} [options.overtimeLength] - Overtime period length in minutes.
 * @param {string} [options.periodType] - The format of the game (QUARTERS or HALVES).
 * @param {object} [options.liveContext] - Current game state for live tracking.
 * @param {number} options.liveContext.clockTime - Remaining seconds in the period.
 * @param {number} options.liveContext.period - The current period.
 * @returns {PlayerStint[]} Array of stint records for all tracked players.
 */
export const calculatePlayerStintTimeline = (
  stats: StatEvent[],
  options: {
    periodLength?: number;
    overtimeLength?: number;
    periodType?: string;
    liveContext?: { clockTime: number; period: number };
  } = {},
): PlayerStint[] => {
  const sorted = sortStats(stats);
  const stints: PlayerStint[] = [];
  const activeStints = new Map<
    string,
    { startClock: number; period: number }
  >();

  let currentPeriod = 1;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    const { playerId, type, clockTime, period } = s;

    // Handle period boundaries for active players
    if (period > currentPeriod) {
      for (const [pId, info] of activeStints.entries()) {
        // End stint at 0:00 of the period it started in (or subsequent ones)
        // For simplicity, we create one stint record per period the player is on for.
        stints.push({
          playerId: pId,
          period: currentPeriod,
          startClock: info.startClock,
          endClock: 0,
        });

        // 🔍 Scout: Handle full minutes for skipped periods
        for (let p = currentPeriod + 1; p < period; p++) {
          stints.push({
            playerId: pId,
            period: p,
            startClock: getPeriodLen(p, options),
            endClock: 0,
          });
        }

        // Reset info for the current period
        info.startClock = getPeriodLen(period, options);
        info.period = period;
      }
      currentPeriod = period;
    }

    if (type === ACTION_TYPES.SUB_IN && clockTime !== undefined) {
      activeStints.set(playerId, { startClock: clockTime, period });
    } else if (type === ACTION_TYPES.SUB_OUT && clockTime !== undefined) {
      const info = activeStints.get(playerId);
      if (info) {
        stints.push({
          playerId,
          period,
          startClock: info.startClock,
          endClock: clockTime,
        });
        activeStints.delete(playerId);
      }
    }
  }

  // Handle players still on court
  const liveCtx = options.liveContext;
  for (const [pId, info] of activeStints.entries()) {
    const endClock =
      liveCtx && liveCtx.period === info.period ? liveCtx.clockTime : 0;
    stints.push({
      playerId: pId,
      period: info.period,
      startClock: info.startClock,
      endClock,
    });
  }

  return stints;
};

/**
 * 🏀 CoachBoard: calculateOpponentScoutingStats
 * Why: Aggregates statistics for opponent players identified by persistent IDs across games.
 * Supports scouting analysis for recurring opponents.
 *
 * @param stats - List of statistical events across multiple games.
 * @returns Map of persistent player IDs to aggregated stats.
 */
export const calculateOpponentScoutingStats = (
  stats: StatEvent[],
  viewType: "total" | "average" = "total",
): Map<string, OpponentAggregates> => {
  const result = new Map<string, OpponentAggregates>();
  const gameIdsMap = new Map<string, Set<string>>();

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const pId = s.playerId;
    let agg = result.get(pId);
    if (!agg) {
      agg = initOpponentAggregates();
      result.set(pId, agg);
    }

    applyActionToAggregate(agg, s);

    // Track games played for this player
    let gSet = gameIdsMap.get(pId);
    if (!gSet) {
      gSet = new Set<string>();
      gameIdsMap.set(pId, gSet);
    }
    gSet.add(s.gameId);
  }

  // Finalize PPP and percentages
  const isAverage = viewType === "average";
  for (const [pId, agg] of result.entries()) {
    const possessions = calculatePossessionsForAgg(agg);
    agg.possessions = Math.round(possessions);
    agg.ppp = calculatePpp(agg.points, possessions);
    agg.fgPct = calculateFgPct(agg.makes, agg.attempts);
    agg.efgPct = calculateEfgPct(agg.makes, agg.threePM, agg.attempts);
    agg.threePPct = calculateFgPct(agg.threePM, agg.threePA);
    agg.toPct = calcPct(agg.turnovers, possessions);
    agg.orbPct = "0.0"; // Individual ORB% requires context of all game missed shots
    agg.ftRate = calcPct(agg.ftm, agg.attempts);

    if (isAverage) {
      const gp = gameIdsMap.get(pId)?.size || 1;
      agg.points = roundToOne(agg.points / gp);
      agg.makes = roundToOne(agg.makes / gp);
      agg.attempts = roundToOne(agg.attempts / gp);
      agg.rebounds = roundToOne(agg.rebounds / gp);
      agg.offRebounds = roundToOne(agg.offRebounds / gp);
      agg.defRebounds = roundToOne(agg.defRebounds / gp);
      agg.assists = roundToOne(agg.assists / gp);
      agg.blocks = roundToOne(agg.blocks / gp);
      agg.steals = roundToOne(agg.steals / gp);
      agg.turnovers = roundToOne(agg.turnovers / gp);
      agg.fouls = roundToOne(agg.fouls / gp);
      agg.fta = roundToOne(agg.fta / gp);
      agg.ftm = roundToOne(agg.ftm / gp);
      agg.threePM = roundToOne(agg.threePM / gp);
      agg.threePA = roundToOne(agg.threePA / gp);
      agg.possessions = roundToOne(agg.possessions / gp);
    }
  }

  return result;
};

/**
 * 🏀 CoachBoard: calculatePlayEfficiency
 * Why: Analyzes offensive sets to determine which plays are yielding the best results.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of play efficiency metrics.
 */
export interface PlayEfficiency {
  name: string;
  attempts: number;
  makes: number;
  points: number;
  ppp: string;
  efg: string;
}

export const calculatePlayEfficiency = (
  stats: StatEvent[],
): PlayEfficiency[] => {
  const data: Record<
    string,
    {
      makes: number;
      attempts: number;
      points: number;
      fta: number;
      turnovers: number;
      threePM: number;
      oreb: number;
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.playName) continue;

    let play = data[s.playName];
    if (!play) {
      play = initPlayEfficiencyAgg();
      data[s.playName] = play;
    }
    if (s.type === ACTION_TYPES.MAKE) {
      play.points += s.points || 0;
      if (s.points === 1) {
        play.fta++;
      } else {
        play.makes++;
        play.attempts++;
        if (isThreePointAttempt(s)) {
          play.threePM++;
        }
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) {
        play.fta++;
      } else {
        play.attempts++;
      }
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      play.turnovers++;
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      play.oreb = (play.oreb || 0) + 1;
    }
  }

  return Object.entries(data)
    .map(([name, s]) => {
      const possessions = calculatePossessionsForAgg(s);
      return {
        name,
        attempts: s.attempts,
        makes: s.makes,
        points: s.points,
        ppp: calculatePpp(s.points, possessions),
        efg: calculateEfgPct(s.makes, s.threePM, s.attempts),
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
};

/**
 * Interface for defensive scheme efficiency.
 */
export interface SchemeEfficiency {
  scheme: string;
  possessions: number;
  pointsAllowed: number;
  ppp: string;
}

/**
 * 🏀 Playbook: calculateSchemeEfficiency
 * Tracks Points Allowed per Possession for each defensive scheme.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of efficiency metrics per scheme.
 */
export const calculateSchemeEfficiency = (
  stats: StatEvent[],
): SchemeEfficiency[] => {
  const data: Record<
    string,
    {
      points: number;
      attempts: number;
      fta: number;
      turnovers: number;
      oreb: number;
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.defensiveScheme || !isOpponentId(s.playerId))
      continue;

    if (!data[s.defensiveScheme]) {
      data[s.defensiveScheme] = {
        points: 0,
        attempts: 0,
        fta: 0,
        turnovers: 0,
        oreb: 0,
      };
    }

    const scheme = data[s.defensiveScheme];
    if (s.type === ACTION_TYPES.MAKE) {
      scheme.points += s.points || 0;
      if (s.points === 1) {
        scheme.fta++;
      } else {
        scheme.attempts++;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) {
        scheme.fta++;
      } else {
        scheme.attempts++;
      }
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      scheme.turnovers++;
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      scheme.oreb++;
    }
  }

  return Object.entries(data).map(([scheme, s]) => {
    const possessions = calculatePossessionsForAgg(s);
    return {
      scheme,
      possessions,
      pointsAllowed: s.points,
      ppp: calculatePpp(s.points, possessions),
    };
  });
};

/**
 * 🏀 CoachBoard: calculateOpponentThreats
 *
 * WHY: Identifies opponent players who are scoring significantly or on a streak.
 * This allows the coach to make defensive adjustments before the game slips away.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of threat objects for the opponent.
 */
export interface OpponentThreat {
  playerId: string;
  points: number;
  makes: number;
  consecutiveMakes: number;
  straightPoints: number;
  isHot: boolean;
}

/**
 * 🏀 CoachBoard: calculateOpponentThreats
 *
 * WHY: Identifies opponent players who are scoring significantly or on a streak.
 * tracks "straight points" (points scored by an opponent while our team has 0 points
 * in that same window) to alert for unchecked threats.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of threat objects for the opponent.
 */
export const calculateOpponentThreats = (
  stats: StatEvent[],
): OpponentThreat[] => {
  const threats = new Map<string, OpponentThreat>();
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    // Reset threats on game change
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      threats.clear();
    }

    const isOpp = isOpponentId(s.playerId);

    // If our team scores, reset all current straight points counters
    if (!isOpp && isScoringEvent(s)) {
      for (const t of threats.values()) {
        t.straightPoints = 0;
      }
      continue;
    }

    if (!isOpp) continue;

    const pId = s.playerId;
    let t = threats.get(pId);
    if (!t) {
      t = initOpponentThreat(pId);
      threats.set(pId, t);
    }
    if (s.type === ACTION_TYPES.MAKE) {
      t.points += s.points || 0;
      t.straightPoints += s.points || 0;
      if (isFieldGoal(s)) {
        t.makes++;
        t.consecutiveMakes++;
      }
      // Hot if: 8+ total points, 3+ consecutive makes, or 6+ straight points
      if (t.points >= 8 || t.consecutiveMakes >= 3 || t.straightPoints >= 6) {
        t.isHot = true;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isFieldGoal(s)) {
        t.consecutiveMakes = 0;
      }
    }
  }

  return Array.from(threats.values()).filter((t) => t.isHot);
};

/**
 * Interface for a scoring run.
 */
export interface ScoringRun {
  team: "TEAM" | "OPPONENT";
  points: number;
  startClock: number;
  endClock: number;
  period: number;
  startTime: string; // Clock formatted
  endTime: string;
}

/**
 * 🏀 CoachBoard: calculateScoringRuns
 *
 * WHY: Scoring runs (e.g., 8-0) are high-impact game moments. Visualizing
 * them helps coaches see which lineups were on the floor during momentum shifts.
 *
 * @param stats - Chronological list of events for a SINGLE game.
 * @returns Array of scoring runs >= 8 points.
 */
export const calculateScoringRuns = (stats: StatEvent[]): ScoringRun[] => {
  const sorted = sortStats(stats);
  const runs: ScoringRun[] = [];

  let currentRunTeam: "TEAM" | "OPPONENT" | null = null;
  let currentRunPoints = 0;
  let runStartEvent: StatEvent | null = null;
  let lastMakeEvent: StatEvent | null = null; // ⚡ Bolt: Track last make for O(N) runs

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s) || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp = isOpponentId(s.playerId);
    const team = isOpp ? "OPPONENT" : "TEAM";
    const points = s.points || 0;

    if (currentRunTeam === team) {
      currentRunPoints += points;
      lastMakeEvent = s;
    } else {
      // If previous run was significant, record it
      if (currentRunTeam && currentRunPoints >= 8 && runStartEvent && lastMakeEvent) {
        runs.push({
          team: currentRunTeam,
          points: currentRunPoints,
          period: runStartEvent.period,
          startClock: runStartEvent.clockTime || 0,
          endClock: lastMakeEvent.clockTime || 0,
          startTime: formatClock(runStartEvent.clockTime || 0),
          endTime: formatClock(lastMakeEvent.clockTime || 0),
        });
      }
      // Start new run
      currentRunTeam = team;
      currentRunPoints = points;
      runStartEvent = s;
      lastMakeEvent = s;
    }
  }

  // Final check
  if (currentRunTeam && currentRunPoints >= 8 && runStartEvent && lastMakeEvent) {
    runs.push({
      team: currentRunTeam,
      points: currentRunPoints,
      period: runStartEvent.period,
      startClock: runStartEvent.clockTime || 0,
      endClock: lastMakeEvent.clockTime || 0,
      startTime: formatClock(runStartEvent.clockTime || 0),
      endTime: formatClock(lastMakeEvent.clockTime || 0),
    });
  }

  return runs;
};

/**
 * Interface for opponent tendencies.
 */
export interface OpponentTendency {
  paintPct: string;
  catchAndShootPct: string;
  offDribblePct: string;
}

/**
 * 🏀 CoachBoard: calculateOpponentTendencies
 *
 * WHY: Identifying how an opponent scores allows for real-time defensive adjustments.
 *
 * @param stats - Chronological list of events for the game.
 * @returns Object containing tendency percentages.
 */
export const calculateOpponentTendencies = (
  stats: StatEvent[],
): OpponentTendency => {
  let paintAttempts = 0;
  let totalFieldGoalAttempts = 0;
  let catchAndShootAttempts = 0;
  let offDribbleAttempts = 0;
  let totalTaggedAttempts = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;
    if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS) continue;
    if (isFreeThrow(s)) continue;

    totalFieldGoalAttempts++;
    if (detectShotValueFromCoords(s.locationX || 0, s.locationY || 0) === 2) {
      // Simplistic paint check - in a real app we would check the exact zone
      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      if (zone === "PAINT") paintAttempts++;
    }

    if (s.shotType === "CATCH") {
      catchAndShootAttempts++;
      totalTaggedAttempts++;
    } else if (s.shotType === "DRIB") {
      offDribbleAttempts++;
      totalTaggedAttempts++;
    }
  }

  return {
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
  };
};

/**
 * Detects shot value (2 or 3) from coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 * Center of the arc is at (250, 140) with a radius of 220.
 */
export const detectShotValueFromCoords = (x: number, y: number): number => {
  const svgX = x * 5;
  const svgY = y * 4.7;
  if (svgY <= 140) {
    if (svgX <= 30 || svgX >= 470) return 3;
  } else {
    // ⚡ Bolt: Use squared distance to avoid expensive Math.sqrt() calls.
    const dX = svgX - 250;
    const dY = svgY - 140;
    const distSq = dX * dX + dY * dY;
    if (distSq >= 48400) return 3; // 220^2 = 48400
  }
  return 2;
};

/**
 * 🏀 CoachBoard: calculateStopsAndKills
 *
 * WHY: Defensive momentum is often measured in "Stops" (defensive possessions
 * without an opponent score) and "Kills" (3 consecutive stops).
 * This metric helps motivate defensive intensity and identifies defensive runs.
 *
 * DEFINITIONS:
 * - A STOP occurs when a defensive possession ends without an opponent score
 *   (e.g., opponent turnover or opponent miss followed by a defensive rebound).
 * - A KILL is a sequence of 3 consecutive STOPS.
 *
 * IMPLEMENTATION NOTE: This function employs a state-machine approach to process
 * the event stream in a single linear pass (O(N)). It accurately identifies
 * possession terminators (scores, turnovers, rebounds) to determine when a
 * stop is earned. This avoids the complexity and performance overhead of
 * nested "look-ahead" loops while robustly handling edge cases like multiple
 * misses within a single possession.
 *
 * TERMINATORS:
 * - STOP: Earned on Opponent Turnover or Opponent Miss followed by Team Defensive Rebound.
 * - RESET: Streak breaks on Opponent Score or Team Defensive/Technical Foul.
 * - CONTINUE: Possession continues on Opponent Offensive Rebound.
 *
 * STATE TRANSITIONS:
 * - inOpponentPossession: Set to TRUE on opponent MISS; reset to FALSE on any score,
 *   turnover, or defensive rebound. This ensures a single stop per possession.
 * - isOurPossession: Toggled on turnovers, scores, and rebounds. Used to filter
 *   offensive fouls which do not break a defensive stop streak.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for the game.
 * @returns {object} Object containing total stops, kills, and current stop streak.
 */
export const calculateStopsAndKills = (stats: StatEvent[]) => {
  let totalStops = 0;
  let totalKills = 0;
  let currentStreak = 0;

  /**
   * ⚡ Bolt: State-machine approach for possession tracking.
   *
   * STATE VARIABLES:
   * - inOpponentPossession: Tracks if the opponent is currently in an active
   *   possession where they have already missed a shot. This prevents awarding
   *   multiple stops for multiple misses in the same possession.
   * - isOurPossession: Tracks which team currently holds the ball. This is
   *   critical for distinguishing between offensive and defensive fouls, as
   *   only defensive fouls (committed while opponent has ball) break the streak.
   */
  let inOpponentPossession = false;
  let isOurPossession = false;
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    // Handle gameId changes
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = false;
    }

    const isOpp = isOpponentId(s.playerId);

    // If opponent scores, the streak is broken immediately.
    if (isOpp && isScoringEvent(s)) {
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = true; // Ball goes to us after they score
      continue;
    }

    // Track possession changes to distinguish offensive/defensive fouls
    if (!isOpp && (isScoringEvent(s) || s.type === ACTION_TYPES.TURNOVER)) {
      isOurPossession = false;
    }

    if (isDefensiveRebound(s)) {
      isOurPossession = !isOpp;
    }

    // 🏀 CoachBoard: Foul Reset logic
    if (isFoulAction(s)) {
      if (!isOpp) {
        // 🔍 Scout: Only reset streak if we are on defense (or if it's a technical foul)
        // Offensive fouls do not break a defensive stop streak.
        if (!isOurPossession || s.type === ACTION_TYPES.TECHNICAL_FOUL) {
          currentStreak = 0;
        }
      } else {
        // 🔍 Scout: Opponent offensive fouls (committed while they are in possession)
        // are effectively turnovers and count as stops.
        if (!isOurPossession && s.type !== ACTION_TYPES.TECHNICAL_FOUL) {
          totalStops++;
          currentStreak++;
          inOpponentPossession = false;
          isOurPossession = true;
        }
      }
      continue;
    }

    // A Stop is earned on an Opponent Turnover.
    if (isOpp && s.type === ACTION_TYPES.TURNOVER) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    }
    // Opponent Miss triggers the "potential stop" state.
    else if (isOpp && s.type === ACTION_TYPES.MISS) {
      inOpponentPossession = true;
    }
    // If we get a defensive rebound while opponent was in possession after a miss -> Stop!
    else if (inOpponentPossession && !isOpp && isDefensiveRebound(s)) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    }
    // If opponent gets an offensive rebound, the possession continues.
    else if (
      inOpponentPossession &&
      isOpp &&
      s.type === ACTION_TYPES.OFF_REBOUND
    ) {
      // Keep inOpponentPossession = true
    }
    // Any other action by our team (except rebound handled above) or change in game state
    // that implies a change in possession without a score/rebound/TO is not a stop.
    // However, to keep it simple and robust, we mostly care about the terminators.

    // Check for "Kill" (3 consecutive stops)
    if (currentStreak >= 3) {
      totalKills++;
      currentStreak = 0; // Reset streak for the next set of 3
    }
  }

  return { totalStops, totalKills, currentStreak };
};

/**
 * Calculates aggregated team statistics (PPG, RPG, etc.) and W/L record.
 *
 * This function iterates through games, calculates results for each game
 * using the provided event stream, and aggregates them into team-wide averages.
 *
 * @param {Game[]} games - List of games.
 * @param {StatEvent[]} stats - List of statistical events across those games.
 * @param {boolean} completedOnly - (Optional) Only include completed games, defaults to true.
 * @returns {Record<string, unknown>} Team level aggregates.
 */
/**
 * 🏀 CoachBoard: calculateTeamSeasonAverages
 * Why: Computes historical averages for a team to provide context for live performance.
 */
export const calculateTeamSeasonAverages = (
  games: Game[],
  allStats: StatEvent[],
): TeamAggregates => {
  return calculateTeamAggregates(games, allStats, true);
};

export const calculateTeamAggregates = (
  games: Game[],
  stats: StatEvent[],
  completedOnly = true,
): TeamAggregates => {
  // Optimization: Aggregate all stats in a single pass without intermediate grouping.
  // ⚡ Bolt: Use a Map for game totals to improve lookup performance and avoid object overhead.
  const gameTotals = new Map<string, { team: number; opp: number }>();
  let targetCount = 0;

  // Pre-populate Map with targeted game IDs to eliminate conditional checks in the hot loop.
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    if (!completedOnly || g.completed === 1) {
      gameTotals.set(g.id!, { team: 0, opp: 0 });
      targetCount++;
    }
  }

  const team = {
    pts: 0,
    reb: 0,
    ast: 0,
    fga: 0,
    fta: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
    makes: 0,
    threePM: 0,
    ftm: 0,
  };
  const opp = {
    pts: 0,
    fga: 0,
    fta: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
    makes: 0,
    threePM: 0,
    ftm: 0,
  };

  // ⚡ Bolt: One-slot cache for game totals lookup.
  // WHY: Events are usually grouped by gameId. Caching the last lookup
  // avoids redundant Map.get() calls in the hot event loop.
  let lastGameId: string | null = null;
  let cachedTotals: { team: number; opp: number } | undefined;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const gameId = stat.gameId;
    let totals: { team: number; opp: number } | undefined;

    if (gameId === lastGameId) {
      totals = cachedTotals;
    } else {
      totals = gameTotals.get(gameId);
      lastGameId = gameId;
      cachedTotals = totals;
    }
    if (!totals) continue;

    const isOpponent = isOpponentId(stat.playerId);
    const pts = stat.points || 0;
    const target = isOpponent ? opp : team;

    if (stat.type === ACTION_TYPES.MAKE) {
      if (isOpponent) totals.opp += pts;
      else totals.team += pts;

      target.pts += pts;
      if (isFreeThrow(stat)) {
        target.ftm++;
      } else {
        target.makes++;
        if (isThreePointAttempt(stat)) target.threePM++;
      }
    }

    updatePossessionCounters(stat, target);

    if (isDefensiveRebound(stat)) {
      target.dreb++;
    }

    if (!isOpponent) {
      if (isRebound(stat)) {
        team.reb++;
      } else if (stat.type === ACTION_TYPES.ASSIST) {
        team.ast++;
      }
    }
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  // ⚡ Bolt: Iterate over map values directly to improve iteration performance.
  for (const totals of gameTotals.values()) {
    if (totals.team > totals.opp) wins++;
    else if (totals.team < totals.opp) losses++;
    else draws++;
  }

  const gp = targetCount || 1;
  const totalPossessions = calculatePossessions(
    team.fga,
    team.fta,
    team.to,
    team.oreb,
  );
  const totalOppPossessions = calculatePossessions(
    opp.fga,
    opp.fta,
    opp.to,
    opp.oreb,
  );

  return {
    ppg: formatToOne(team.pts / gp),
    rpg: formatToOne(team.reb / gp),
    apg: formatToOne(team.ast / gp),
    oppg: formatToOne(opp.pts / gp),
    record: draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`,
    totalGames: targetCount,
    ppp: calculatePpp(team.pts, totalPossessions),
    possessions: Math.round(totalPossessions),
    oppPpp: calculatePpp(opp.pts, totalOppPossessions),
    efgPct: calculateEfgPct(team.makes, team.threePM || 0, team.fga),
    toPct: calcPct(team.to, totalPossessions),
    orbPct: calcPct(team.oreb, team.oreb + opp.dreb),
    ftRate: calcPct(team.ftm || 0, team.fga),
    dreb: team.dreb,
    turnovers: team.to,
    assists: team.ast,
    offRebounds: team.oreb,
    points: team.pts,
  };
};

/**
 * Calculates aggregated statistics for the opponent in a single game.
 *
 * @param {StatEvent[]} stats - List of statistical events for the game.
 * @returns {OpponentAggregates} Opponent statistical summary.
 */
/**
 * ⚡ Bolt: Consolidated opponent aggregates and tendencies into a single pass.
 */
export const calculateOpponentSummary = (
  stats: StatEvent[],
): OpponentAggregates & { tendency: OpponentTendency } => {
  const agg = initOpponentAggregates();
  let paintAttempts = 0;
  let totalFieldGoalAttempts = 0;
  let catchAndShootAttempts = 0;
  let offDribbleAttempts = 0;
  let totalTaggedAttempts = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat) || !isOpponentId(stat.playerId)) continue;

    applyActionToAggregate(agg, stat);

    // Tendency logic
    if (
      (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.MISS) &&
      !isFreeThrow(stat)
    ) {
      totalFieldGoalAttempts++;
      if (
        detectShotValueFromCoords(stat.locationX || 0, stat.locationY || 0) === 2
      ) {
        const zone = getShotZone(stat.locationX || 0, stat.locationY || 0);
        if (zone === "PAINT") paintAttempts++;
      }

      if (stat.shotType === "CATCH") {
        catchAndShootAttempts++;
        totalTaggedAttempts++;
      } else if (stat.shotType === "DRIB") {
