/**
 * @file impact.ts
 * @description Impact and streak metrics.
 */

import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { Player, StatEvent } from "../../db";
import {
  isActive,
  isScoringEvent,
  sortStats,
  calculatePossessions,
  calculatePpp,
  isOpponentId,
  isFreeThrow,
  isFoulAction,
} from "./aggregators";
import { IndividualDefensiveBreakdown } from "./types";

export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();
  let currentGameId: string | null = null;

  const sorted = options.isSorted ? stats : sortStats(stats);

  for (const s of sorted) {
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      playerStreaks.clear();
    }

    if (isScoringEvent(s) || s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) continue;

      const pId = s.playerId;
      let history = playerStreaks.get(pId);
      if (!history) {
        history = [];
        playerStreaks.set(pId, history);
      }

      history.push(isScoringEvent(s) ? "MAKE" : "MISS");
      if (history.length > 3) {
        history.shift();
      }
    }
  }

  const result = new Map<string, "HOT" | "COLD" | null>();
  for (const [pId, history] of playerStreaks.entries()) {
    if (history.length < 3) {
      result.set(pId, null);
      continue;
    }

    if (history.every((v) => v === "MAKE")) {
      result.set(pId, "HOT");
    } else if (history.every((v) => v === "MISS")) {
      result.set(pId, "COLD");
    } else {
      result.set(pId, null);
    }
  }

  return result;
};

export const calculateStopsAndKills = (stats: StatEvent[]) => {
  let totalStops = 0;
  let totalKills = 0;
  let currentStreak = 0;
  const killEvents: { period: number; clockTime: number }[] = [];

  let inOpponentPossession = false;
  let isOurPossession = false;
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentStreak = 0;
      inOpponentPossession = isOurPossession = false;
    }

    const isOpp = isOpponentId(s.playerId);

    if (isOpp && isScoringEvent(s)) {
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = true;
      continue;
    }

    if (!isOpp && (isScoringEvent(s) || s.type === ACTION_TYPES.TURNOVER)) {
      isOurPossession = false;
    }
    const isRebound =
      s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND;

    if (isRebound) {
      isOurPossession = !isOpp;
    }

    if (!isOpp && isFoulAction(s)) {
      if (!isOurPossession || s.type === ACTION_TYPES.TECHNICAL_FOUL) {
        currentStreak = 0;
      }
      continue;
    }

    if (isOpp && s.type === ACTION_TYPES.TURNOVER) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    } else if (isOpp && s.type === ACTION_TYPES.MISS) {
      inOpponentPossession = true;
    } else if (
      inOpponentPossession &&
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    ) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    } else if (
      inOpponentPossession &&
      isOpp &&
      s.type === ACTION_TYPES.OFF_REBOUND
    ) {
      // continues
    }

    if (currentStreak >= 3) {
      totalKills++;
      killEvents.push({
        period: s.period,
        clockTime: s.clockTime || 0,
      });
      currentStreak = 0;
    }
  }

  return { totalStops, totalKills, currentStreak, killEvents };
};

export interface OnOffStats {
  playerId: string;
  name: string;
  on: {
    possessions: number;
    ptsFor: number;
    ptsAgainst: number;
    offRating: string;
    defRating: string;
    netRating: string;
  };
  off: {
    possessions: number;
    ptsFor: number;
    ptsAgainst: number;
    offRating: string;
    defRating: string;
    netRating: string;
  };
  differential: string;
}

export const calculateOnOffStats = (
  stats: StatEvent[],
  players: { id: string; name: string }[],
): OnOffStats[] => {
  const sorted = sortStats(stats);

  const playerOnStats = new Map<
    string,
    {
      ptsFor: number;
      ptsAgainst: number;
      fga: number;
      fta: number;
      to: number;
      oreb: number;
      oppFga: number;
      oppFta: number;
      oppTo: number;
      oppOreb: number;
    }
  >();

  for (const p of players) {
    playerOnStats.set(p.id, {
      ptsFor: 0,
      ptsAgainst: 0,
      fga: 0,
      fta: 0,
      to: 0,
      oreb: 0,
      oppFga: 0,
      oppFta: 0,
      oppTo: 0,
      oppOreb: 0,
    });
  }

  const globalStats = {
    ptsFor: 0,
    ptsAgainst: 0,
    fga: 0,
    fta: 0,
    to: 0,
    oreb: 0,
    oppFga: 0,
    oppFta: 0,
    oppTo: 0,
    oppOreb: 0,
  };

  const currentLineup = new Set<string>();

  for (const s of sorted) {
    if (!isActive(s)) continue;

    if (s.type === ACTION_TYPES.SUB_IN) {
      currentLineup.add(s.playerId);
      continue;
    }
    if (s.type === ACTION_TYPES.SUB_OUT) {
      currentLineup.delete(s.playerId);
      continue;
    }

    const isOpp = isOpponentId(s.playerId);

    const pts = s.points || 0;
    const type = s.type;

    const updateAgg = (target: typeof globalStats) => {
      if (isScoringEvent(s)) {
        if (isOpp) target.ptsAgainst += pts;
        else target.ptsFor += pts;
      }

      if (isScoringEvent(s) || type === ACTION_TYPES.MISS) {
        if (isFreeThrow(s)) {
          if (isOpp) target.oppFta++;
          else target.fta++;
        } else {
          if (isOpp) target.oppFga++;
          else target.fga++;
        }
      } else if (type === ACTION_TYPES.TURNOVER) {
        if (isOpp) target.oppTo++;
        else target.to++;
      } else if (type === ACTION_TYPES.OFF_REBOUND) {
        if (isOpp) target.oppOreb++;
        else target.oreb++;
      }
    };

    updateAgg(globalStats);

    // Update ON stats for active players
    for (const pId of currentLineup) {
      const target = playerOnStats.get(pId);
      if (target) updateAgg(target);
    }
  }

  return players.map((player) => {
    const on = playerOnStats.get(player.id)!;
    const off = {
      ptsFor: globalStats.ptsFor - on.ptsFor,
      ptsAgainst: globalStats.ptsAgainst - on.ptsAgainst,
      fga: globalStats.fga - on.fga,
      fta: globalStats.fta - on.fta,
      to: globalStats.to - on.to,
      oreb: globalStats.oreb - on.oreb,
      oppFga: globalStats.oppFga - on.oppFga,
      oppFta: globalStats.oppFta - on.oppFta,
      oppTo: globalStats.oppTo - on.oppTo,
      oppOreb: globalStats.oppOreb - on.oppOreb,
    };

    const onPoss = calculatePossessions(on.fga, on.fta, on.to, on.oreb);
    const onOppPoss = calculatePossessions(
      on.oppFga,
      on.oppFta,
      on.oppTo,
      on.oppOreb,
    );
    const offPoss = calculatePossessions(off.fga, off.fta, off.to, off.oreb);
    const offOppPoss = calculatePossessions(
      off.oppFga,
      off.oppFta,
      off.oppTo,
      off.oppOreb,
    );

    const onOffRating = calculatePpp(on.ptsFor, onPoss);
    const onDefRating = calculatePpp(on.ptsAgainst, onOppPoss);
    const onNet = (parseFloat(onOffRating) - parseFloat(onDefRating)).toFixed(
      2,
    );

    const offOffRating = calculatePpp(off.ptsFor, offPoss);
    const offDefRating = calculatePpp(off.ptsAgainst, offOppPoss);
    const offNet = (
      parseFloat(offOffRating) - parseFloat(offDefRating)
    ).toFixed(2);

    const diff = (parseFloat(onNet) - parseFloat(offNet)).toFixed(2);

    return {
      playerId: player.id,
      name: player.name,
      on: {
        possessions: Math.round(onPoss),
        ptsFor: on.ptsFor,
        ptsAgainst: on.ptsAgainst,
        offRating: onOffRating,
        defRating: onDefRating,
        netRating: onNet,
      },
      off: {
        possessions: Math.round(offPoss),
        ptsFor: off.ptsFor,
        ptsAgainst: off.ptsAgainst,
        offRating: offOffRating,
        defRating: offDefRating,
        netRating: offNet,
      },
      differential: diff,
    };
  });
};

export interface MatchupStat {
  opponentId: string;
  opponentJersey: string;
  defenderId: string;
  defenderName: string;
  pointsAllowed: number;
  stops: number;
  totalPossessions: number;
  stopPct: string;
}

export const calculateMatchupStats = (
  stats: StatEvent[],
  players: { id: string; name: string }[],
  _jerseyMap: Map<string, string | undefined>,
): MatchupStat[] => {
  const matchupMap = new Map<
    string,
    { pointsAllowed: number; stops: number; possessions: number }
  >();
  const sorted = sortStats(stats);

  // Track current defenders assigned to opponents based on events
  const currentMatchups = new Map<string, string>();
  let inOppPossession = false;
  let lastOppPlayerId = "";

  for (const s of sorted) {
    if (!isActive(s)) continue;

    const isOpp =
      s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

    if (isOpp) {
      lastOppPlayerId = s.playerId;
      const defenderId = s.primaryDefenderId;

      if (defenderId) {
        currentMatchups.set(lastOppPlayerId, defenderId);
      }

      const activeDefender = currentMatchups.get(lastOppPlayerId);
      if (!activeDefender) continue;

      const key = `${lastOppPlayerId}:${activeDefender}`;
      if (!matchupMap.has(key)) {
        matchupMap.set(key, { pointsAllowed: 0, stops: 0, possessions: 0 });
      }
      const m = matchupMap.get(key)!;

      if (s.type === ACTION_TYPES.MAKE) {
        m.pointsAllowed += s.points || 0;
        m.possessions++;
        inOppPossession = false;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        m.stops++;
        m.possessions++;
        inOppPossession = false;
      } else if (s.type === ACTION_TYPES.MISS) {
        inOppPossession = true;
      }
    } else {
      if (
        inOppPossession &&
        (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
      ) {
        const defenderId = s.playerId;
        const key = `${lastOppPlayerId}:${defenderId}`;
        const m = matchupMap.get(key);
        if (m) {
          m.stops++;
          m.possessions++;
        }
        inOppPossession = false;
      }
    }
  }

  const results: MatchupStat[] = [];
  for (const [key, data] of matchupMap.entries()) {
    const [oppId, defenderId] = key.split(":");
    const defender = players.find((p) => p.id === defenderId);
    if (!defender) continue;

    results.push({
      opponentId: oppId,
      opponentJersey: oppId.includes(":") ? oppId.split(":")[1] : "??",
      defenderId,
      defenderName: defender.name,
      pointsAllowed: data.pointsAllowed,
      stops: data.stops,
      totalPossessions: data.possessions,
      stopPct:
        data.possessions > 0
          ? ((data.stops / data.possessions) * 100).toFixed(1)
          : "0.0",
    });
  }

  return results.sort((a, b) => b.pointsAllowed - a.pointsAllowed);
};

export const calculateIndividualDefensiveBreakdown = (
  stats: StatEvent[],
  players: Player[],
  jerseyMap: Map<string, string | undefined>,
): IndividualDefensiveBreakdown[] => {
  const playerBreakdownMap = new Map<
    string,
    {
      pointsAllowed: number;
      reasons: Map<string, { points: number; frequency: number }>;
    }
  >();

  for (const s of stats) {
    if (
      !isActive(s) ||
      !s.primaryDefenderId ||
      !isOpponentId(s.playerId) ||
      s.type !== ACTION_TYPES.MAKE
    )
      continue;

    const defenderId = s.primaryDefenderId;
    if (!playerBreakdownMap.has(defenderId)) {
      playerBreakdownMap.set(defenderId, {
        pointsAllowed: 0,
        reasons: new Map(),
      });
    }

    const pData = playerBreakdownMap.get(defenderId)!;
    const pts = s.points || 0;
    pData.pointsAllowed += pts;

    const reason = s.breakdownReason || "No Reason Logged";
    if (!pData.reasons.has(reason)) {
      pData.reasons.set(reason, { points: 0, frequency: 0 });
    }
    const rData = pData.reasons.get(reason)!;
    rData.points += pts;
    rData.frequency += 1;
  }

  const results: IndividualDefensiveBreakdown[] = [];
  for (const [pId, data] of playerBreakdownMap.entries()) {
    const player = players.find((p) => p.id === pId);
    if (!player) continue;

    const breakdowns = Array.from(data.reasons.entries()).map(
      ([reason, rData]) => ({
        reason,
        points: rData.points,
        frequency: rData.frequency,
      }),
    );

    const primaryReason = breakdowns.sort((a, b) => b.points - a.points)[0]
      ?.reason;

    results.push({
      playerId: pId,
      playerName: player.name,
      jerseyNumber: jerseyMap.get(pId) || "??",
      pointsAllowed: data.pointsAllowed,
      breakdowns,
      primaryReason: primaryReason || "N/A",
    });
  }

  return results.sort((a, b) => b.pointsAllowed - a.pointsAllowed);
};
