    growths.push("Foul trouble limited your defensive aggressiveness");
  }
  if (parseFloat(playerStats.threePPct) < 20 && playerStats.threePA >= 4) {
    growths.push("Poor 3PT shooting - look for higher quality looks");
  }

  // Fallbacks
  const strength = strengths.length > 0 ? strengths[0] : "Maintained consistent effort on both ends";
  const growth = growths.length > 0 ? growths[0] : "Focus on maintaining this level of play into the next game";

  return { strength, growth };
};

/**
 * 🏀 CoachBoard: calculateOnOffStats
 *
 * WHY: Measures a player's impact by comparing team performance when they
 * are on the court versus on the bench.
 *
 * METHODOLOGY:
 * Uses the "OFF-as-Difference" optimization. Instead of checking every player
 * for every event (O(N*P)), we track global totals once and subtract a player's
 * "ON" stats from the "Total" to derive their "OFF" performance.
 *
 * SECURITY & INTEGRITY: The accuracy of this optimization relies on the
 * consistency of the event stream. Since 'Total' is global, any stat event
 * that is NOT attributed to a player while they are on the court will
 * automatically be attributed to their 'OFF' state. This is mathematically
 * robust even if players are not subbed in/out perfectly.
 *
 * @param players - List of players.
 * @param stats - Chronological list of statistical events.
 * @returns Array of On/Off impact statistics.
 */
export const calculateOnOffStats = (
  players: Player[],
  stats: StatEvent[],
): OnOffImpact[] => {
  const sorted = sortStats(stats);
  const results = new Map<
    string,
    {
      onPtsFor: number;
      onPtsAgn: number;
      onTeamFga: number;
      onTeamFta: number;
      onTeamTo: number;
      onTeamOreb: number;
      onOppFga: number;
      onOppFta: number;
      onOppTo: number;
      onOppOreb: number;
      offPtsFor: number;
      offPtsAgn: number;
      offTeamFga: number;
      offTeamFta: number;
      offTeamTo: number;
      offTeamOreb: number;
      offOppFga: number;
      offOppFta: number;
      offOppTo: number;
      offOppOreb: number;
    }
  >();

  type OnOffStats = {
    onPtsFor: number; onPtsAgn: number;
    onTeamFga: number; onTeamFta: number; onTeamTo: number; onTeamOreb: number;
    onOppFga: number; onOppFta: number; onOppTo: number; onOppOreb: number;
    offPtsFor: number; offPtsAgn: number;
    offTeamFga: number; offTeamFta: number; offTeamTo: number; offTeamOreb: number;
    offOppFga: number; offOppFta: number; offOppTo: number; offOppOreb: number;
    activeGames: Set<string>;
  };

  // Initialize
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p.id) continue;
    results.set(p.id.toString(), {
      onPtsFor: 0,
      onPtsAgn: 0,
      onTeamFga: 0,
      onTeamFta: 0,
      onTeamTo: 0,
      onTeamOreb: 0,
      onOppFga: 0,
      onOppFta: 0,
      onOppTo: 0,
      onOppOreb: 0,
      offPtsFor: 0,
      offPtsAgn: 0,
      offTeamFga: 0,
      offTeamFta: 0,
      offTeamTo: 0,
      offTeamOreb: 0,
      offOppFga: 0,
      offOppFta: 0,
      offOppTo: 0,
      offOppOreb: 0,
      activeGames: new Set<string>(),
    });
  }

  const activeAggs = new Map<string, OnOffStats>();
  // ⚡ Bolt: Maintain a local array for high-performance iteration in the hot loop.
  let activeAggsArray: OnOffStats[] = [];

  let currentGameId: string | null = null;
  const allGameIds = new Set<string>();

  // ⚡ Bolt: $O(N+P)$ Optimization via "OFF-as-Difference"
  //
  // WHY: A naive "OFF" calculation would require checking every player against
  // every event ($O(N \times P)$). Instead, we track global totals for all events
  // in the game once. Any stat for a player while they are "OFF" the court is
  // mathematically equivalent to (Total Game Stat - Player ON Stat).
  //
  // PERFORMANCE: This reduces complexity to a single pass through events ($O(N)$)
  // plus a single pass through players ($O(P)$), ensuring rapid calculation
  // even for large multi-game datasets or rosters.
  const gameTotalsMap = new Map<string, {
    ptsFor: number;
    ptsAgn: number;
    teamFga: number;
    teamFta: number;
    teamTo: number;
    teamOreb: number;
    oppFga: number;
    oppFta: number;
    oppTo: number;
    oppOreb: number;
  }>();

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      allGameIds.add(currentGameId);
      activeAggs.clear();
      activeAggsArray = [];
      gameTotalsMap.set(currentGameId, {
        ptsFor: 0,
        ptsAgn: 0,
        teamFga: 0,
        teamFta: 0,
        teamTo: 0,
        teamOreb: 0,
        oppFga: 0,
        oppFta: 0,
        oppTo: 0,
        oppOreb: 0,
      });
    }

    const currentTotals = gameTotalsMap.get(currentGameId)!;

    if (s.type === ACTION_TYPES.SUB_IN) {
      const agg = results.get(s.playerId);
      if (agg && !activeAggs.has(s.playerId)) {
        activeAggs.set(s.playerId, agg);
        activeAggsArray.push(agg);
        agg.activeGames.add(currentGameId);
      }
      continue;
    } else if (s.type === ACTION_TYPES.SUB_OUT) {
      if (activeAggs.has(s.playerId)) {
        activeAggs.delete(s.playerId);
        activeAggsArray = Array.from(activeAggs.values());
      }
      continue;
    }

    const isOpp = isOpponentId(s.playerId);
    const pts = s.points || 0;

    // Update global totals
    if (s.type === ACTION_TYPES.MAKE) {
      if (isOpp) currentTotals.ptsAgn += pts;
      else currentTotals.ptsFor += pts;
    }

    if (isOpp) {
      if (isFieldGoal(s)) currentTotals.oppFga++;
      else if (isFreeThrow(s)) currentTotals.oppFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) currentTotals.oppTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) currentTotals.oppOreb++;
    } else {
      if (isFieldGoal(s)) currentTotals.teamFga++;
      else if (isFreeThrow(s)) currentTotals.teamFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) currentTotals.teamTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) currentTotals.teamOreb++;
    }

    // Update ON stats for active players
    // ⚡ Bolt: Use loop inversion and a standard for loop on the activeAggsArray
    // to determine the target field once per event, minimizing branching in the hot inner loop.
    if (s.type === ACTION_TYPES.MAKE) {
      if (isOpp) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onPtsAgn += pts;
        }
      } else {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onPtsFor += pts;
        }
      }
    }

    if (isOpp) {
      if (isFieldGoal(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppFga++;
        }
      } else if (isFreeThrow(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppFta++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppTo++;
        }
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppOreb++;
        }
      }
    } else {
      if (isFieldGoal(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamFga++;
        }
      } else if (isFreeThrow(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamFta++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamTo++;
        }
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamOreb++;
        }
      }
    }
  }

  return Array.from(results.entries()).map(([pId, agg]) => {
    // 🔍 Scout: Aggregate totals only from games where the player was active.
    // However, if we only have one game in the stream, we include it even if
    // no SUB_IN was recorded (assuming the player was on the roster).
    // For multi-game streams, we strictly use activeGames to prevent skew.
    const eligibleTotals = {
      ptsFor: 0, ptsAgn: 0, teamFga: 0, teamFta: 0, teamTo: 0, teamOreb: 0,
      oppFga: 0, oppFta: 0, oppTo: 0, oppOreb: 0
    };

    const gamesToInclude = (allGameIds.size <= 1) ? allGameIds : agg.activeGames;

    for (const gId of gamesToInclude) {
      const gTot = gameTotalsMap.get(gId);
      if (gTot) {
        eligibleTotals.ptsFor += gTot.ptsFor;
        eligibleTotals.ptsAgn += gTot.ptsAgn;
        eligibleTotals.teamFga += gTot.teamFga;
        eligibleTotals.teamFta += gTot.teamFta;
        eligibleTotals.teamTo += gTot.teamTo;
        eligibleTotals.teamOreb += gTot.teamOreb;
        eligibleTotals.oppFga += gTot.oppFga;
        eligibleTotals.oppFta += gTot.oppFta;
        eligibleTotals.oppTo += gTot.oppTo;
        eligibleTotals.oppOreb += gTot.oppOreb;
      }
    }

    // ⚡ Bolt: Derive OFF stats: Eligible Total - ON
    const offPtsFor = eligibleTotals.ptsFor - agg.onPtsFor;
    const offPtsAgn = eligibleTotals.ptsAgn - agg.onPtsAgn;
    const offTeamFga = eligibleTotals.teamFga - agg.onTeamFga;
    const offTeamFta = eligibleTotals.teamFta - agg.onTeamFta;
    const offTeamTo = eligibleTotals.teamTo - agg.onTeamTo;
    const offTeamOreb = eligibleTotals.teamOreb - agg.onTeamOreb;
    const offOppFga = eligibleTotals.oppFga - agg.onOppFga;
    const offOppFta = eligibleTotals.oppFta - agg.onOppFta;
    const offOppTo = eligibleTotals.oppTo - agg.onOppTo;
    const offOppOreb = eligibleTotals.oppOreb - agg.onOppOreb;

    const onTeamPoss = calculatePossessions(
      agg.onTeamFga,
      agg.onTeamFta,
      agg.onTeamTo,
      agg.onTeamOreb,
    );
    const onOppPoss = calculatePossessions(
      agg.onOppFga,
      agg.onOppFta,
      agg.onOppTo,
      agg.onOppOreb,
    );
    const offTeamPoss = calculatePossessions(
      offTeamFga,
      offTeamFta,
      offTeamTo,
      offTeamOreb,
    );
    const offOppPoss = calculatePossessions(
      offOppFga,
      offOppFta,
      offOppTo,
      offOppOreb,
    );

    const onORtg = onTeamPoss > 0 ? (agg.onPtsFor / onTeamPoss) * 100 : 0;
    const onDRtg = onOppPoss > 0 ? (agg.onPtsAgn / onOppPoss) * 100 : 0;
    const offORtg = offTeamPoss > 0 ? (agg.offPtsFor / offTeamPoss) * 100 : 0;
    const offDRtg = offOppPoss > 0 ? (agg.offPtsAgn / offOppPoss) * 100 : 0;

    const onNet = onORtg - onDRtg;
    const offNet = offORtg - offDRtg;

    return {
      playerId: pId,
      onPointsFor: agg.onPtsFor,
      onPointsAgainst: agg.onPtsAgn,
      onPossessions: Math.round(onTeamPoss),
      onOffensiveRating: onORtg.toFixed(1),
      onDefensiveRating: onDRtg.toFixed(1),
      onNetRating: onNet.toFixed(1),
      offPointsFor: offPtsFor,
      offPointsAgainst: offPtsAgn,
      offPossessions: Math.round(offTeamPoss),
      offOffensiveRating: offORtg.toFixed(1),
      offDefensiveRating: offDRtg.toFixed(1),
      offNetRating: offNet.toFixed(1),
      netDifferential: (onNet - offNet).toFixed(1),
    };
  });
};

export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  // ⚡ Bolt: Track streaks for all players in a single pass.
  //
  // WHY: Identifying momentum shifts in real-time requires tracking recent performance.
  // By using a Map with a fixed-size buffer (last 3 FGA), we get O(N) performance
  // while keeping memory usage constant regardless of game length.
  //
  // Optimization: Track only the last three actions per player using a fixed-size buffer
  // to reduce memory churn and avoid large array allocations for long games.
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();
  let currentGameId: string | null = null;

  const sorted = options.isSorted ? stats : sortStats(stats);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    // Reset streaks on game change
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      playerStreaks.clear();
    }

    // We only track streaks for field goal attempts
    if (isScoringEvent(s) || s.type === ACTION_TYPES.MISS) {
      // Skip free throws (points === 1) for field goal streaks
      if (s.points === 1) continue;

      const pId = s.playerId;
      let history = playerStreaks.get(pId);
      if (!history) {
        history = [];
        playerStreaks.set(pId, history);
      }

      // ⚡ Bolt: Efficiently track the last 3 field goal attempts.
      // WHY: history.shift() is O(N). For a fixed-size buffer of 3,
      // manual shifting or circular indexing is faster and avoids re-indexing.
      const action = isScoringEvent(s) ? "MAKE" : "MISS";
      if (history.length < 3) {
        history.push(action);
      } else {
        history[0] = history[1];
        history[1] = history[2];
        history[2] = action;
      }
    }
  }

  const result = new Map<string, "HOT" | "COLD" | null>();
  for (const [pId, history] of playerStreaks.entries()) {
    if (history.length < 3) {
      result.set(pId, null);
      continue;
    }

    // Direct index access is faster than .every() or .slice()
    if (
      history[0] === "MAKE" &&
      history[1] === "MAKE" &&
      history[2] === "MAKE"
    ) {
      result.set(pId, "HOT");
    } else if (
      history[0] === "MISS" &&
      history[1] === "MISS" &&
      history[2] === "MISS"
    ) {
      result.set(pId, "COLD");
    } else {
      result.set(pId, null);
    }
  }

  return result;
};

/**
 * 🏀 Assistant Coach: Analytical Models
 */

export interface ClutchPlay {
  playName: string;
  ppp: number;
  efg: number;
  frequency: number;
  targetMismatches: string[];
}

export const calculateClutchPlaybookRanking = (
  stats: StatEvent[],
  clutchThresholdSeconds: number = 240, // Final 4 mins
  matchups: MatchupStats[]
): ClutchPlay[] => {
  const sorted = sortStats(stats);
  const playStats = new Map<string, { points: number; attempts: number; makes: number; frequency: number }>();

  // Identify the weakest active defenders
  const weakDefenders = matchups
    .filter(m => m.isOpponentDefender && m.possessions >= 3 && parseFloat(m.stopPct) < 35)
    .map(m => m.opponentPlayerId);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s) || !s.playName) continue;

    let data = playStats.get(s.playName);
    if (!data) {
      data = { points: 0, attempts: 0, makes: 0, frequency: 0 };
      playStats.set(s.playName, data);
    }

    data.frequency++;
    if (isFieldGoal(s)) {
      data.attempts++;
      data.points += s.points;
      if (s.type === ACTION_TYPES.MAKE) data.makes++;
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      data.attempts++; // TO counts as a failed possession
    }
  }

  return Array.from(playStats.entries())
    .map(([playName, data]) => {
      const ppp = data.attempts > 0 ? data.points / data.attempts : 0;
      const efg = data.attempts > 0 ? (data.makes + 0.5 * (data.makes)) / data.attempts : 0; // Simplified
      return {
        playName,
        ppp,
        efg,
        frequency: data.frequency,
        targetMismatches: weakDefenders
      };
    })
    .sort((a, b) => b.ppp - a.ppp)
    .slice(0, 3);
};

export interface OfficiatingStats {
  teamFouls: number;
  oppFouls: number;
  teamFoulPct: number;
  oppFoulPct: number;
  fpm: number;
  tightness: "LOW" | "NORMAL" | "HIGH";
}

export const calculateOfficiatingStats = (
  stats: StatEvent[],
  totalMinutes: number
): OfficiatingStats => {
  const teamFouls = stats.filter(s => isActive(s) && !isOpponentId(s.playerId) && s.type === ACTION_TYPES.FOUL).length;
  const oppFouls = stats.filter(s => isActive(s) && isOpponentId(s.playerId) && s.type === ACTION_TYPES.FOUL).length;
  const totalFouls = teamFouls + oppFouls;

  const fpm = totalMinutes > 0 ? totalFouls / totalMinutes : 0;
  const baseline = ANALYTICAL_BASELINES.BASELINE_FPM;

  let tightness: "LOW" | "NORMAL" | "HIGH" = "NORMAL";
  if (fpm > baseline * 1.3) tightness = "HIGH";
  else if (fpm < baseline * 0.7) tightness = "LOW";

  return {
    teamFouls,
    oppFouls,
    teamFoulPct: totalFouls > 0 ? (teamFouls / totalFouls) * 100 : 50,
    oppFoulPct: totalFouls > 0 ? (oppFouls / totalFouls) * 100 : 50,
    fpm,
    tightness
  };
};

export interface PaceAnalytics {
  pace: number;
  tempoDelta: number;
  paceShift: boolean;
}

export const calculatePaceAnalytics = (
  possessions: number,
  period: number,
  clockSeconds: number,
  periodLength: number,
  targetPace: number,
  allStats: StatEvent[]
): PaceAnalytics => {
  const safePeriodLength = periodLength || 10;
  const safeClockSeconds = clockSeconds || 0;
  const elapsedMinutes = Math.max(0.1, (period - 1) * safePeriodLength + (safePeriodLength - safeClockSeconds / 60));
  const currentPace = (possessions / 2 / elapsedMinutes) * 40;

  // Pace Shift Detection: Compare current period pace to overall pace
  let paceShift = false;
  if (period >= 1) {
    const currentPeriodStats = allStats.filter(s => s.period === period);
    let pFga = 0, pFta = 0, pTo = 0, pOreb = 0;
    for (let i = 0; i < currentPeriodStats.length; i++) {
      const s = currentPeriodStats[i];
      if (!isActive(s)) continue;
      if (isFieldGoal(s)) pFga++;
      else if (isFreeThrow(s)) pFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) pTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) pOreb++;
    }
    const currentPeriodPossessions = calculatePossessions(pFga, pFta, pTo, pOreb) / 2;
    const elapsedPeriodMins = Math.max(0.1, safePeriodLength - safeClockSeconds / 60);
    const periodPace = (currentPeriodPossessions / elapsedPeriodMins) * 40;

    if (currentPace > 0 && Math.abs(periodPace - currentPace) / currentPace > 0.15) {
      paceShift = true;
    }
  }

  return {
    pace: currentPace || 0,
    tempoDelta: (currentPace || 0) - targetPace,
    paceShift
  };
};
