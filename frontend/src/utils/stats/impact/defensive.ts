/**
 * @file defensive.ts
 * @description Defensive stops, kills, matchup efficiency, and individual breakdown module.
 *
 * WHY: Contains logic for tracking defensive stops/kills streaks, player matchup metrics,
 * and breakdown reasoning for points allowed.
 */

import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { Player, StatEvent } from "../../../db";
import { isActive, sortStats, isOpponentId } from "../aggregators";
import { IndividualDefensiveBreakdown } from "../types";

/**
 * Calculates total stops, 3-stop kills, and active streaks from stat events.
 */
export const calculateStopsAndKills = (stats: StatEvent[]) => {
  if (!stats || stats.length === 0) {
    return { totalStops: 0, totalKills: 0, currentStreak: 0, killEvents: [] };
  }

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
      inOpponentPossession = false;
      isOurPossession = false;
    }

    // ⚡ Bolt: Use fast first-char guard before full startsWith check
    const pId = s.playerId;
    const isOpp =
      pId === SPECIAL_PLAYER_IDS.OPPONENT ||
      (pId.charCodeAt(0) === 79 &&
        pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":"));

    if (isOpp && s.type === ACTION_TYPES.MAKE) {
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = true;
      continue;
    }

    if (!isOpp && s.type === ACTION_TYPES.MAKE) isOurPossession = false;
    if (!isOpp && s.type === ACTION_TYPES.TURNOVER) isOurPossession = false;
    if (
      isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = false;
    if (
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = true;

    if (
      !isOpp &&
      (s.type === ACTION_TYPES.FOUL ||
        s.type === ACTION_TYPES.FOUL_SHOOTING ||
        s.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
        s.type === ACTION_TYPES.TECHNICAL_FOUL)
    ) {
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

  const currentMatchups = new Map<string, string>();
  let inOppPossession = false;
  let lastOppPlayerId = "";

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    const isOpp = isOpponentId(s.playerId);

    if (isOpp) {
      lastOppPlayerId = s.playerId;
      const defenderId = s.primaryDefenderId;

      if (defenderId) {
        currentMatchups.set(lastOppPlayerId, defenderId);
      }

      const activeDefender = currentMatchups.get(lastOppPlayerId);
      if (!activeDefender) continue;

      const key = `${lastOppPlayerId}:${activeDefender}`;
      let m = matchupMap.get(key);
      if (!m) {
        m = { pointsAllowed: 0, stops: 0, possessions: 0 };
        matchupMap.set(key, m);
      }

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
    const lastIndex = key.lastIndexOf(":");
    const oppId = key.substring(0, lastIndex);
    const defenderId = key.substring(lastIndex + 1);
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

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (
      !isActive(s) ||
      !s.primaryDefenderId ||
      !isOpponentId(s.playerId) ||
      s.type !== ACTION_TYPES.MAKE
    )
      continue;

    const defenderId = s.primaryDefenderId;
    let pData = playerBreakdownMap.get(defenderId);
    if (!pData) {
      pData = {
        pointsAllowed: 0,
        reasons: new Map(),
      };
      playerBreakdownMap.set(defenderId, pData);
    }

    const pts = s.points || 0;
    pData.pointsAllowed += pts;

    const reason = s.breakdownReason || "No Reason Logged";
    let rData = pData.reasons.get(reason);
    if (!rData) {
      rData = { points: 0, frequency: 0 };
      pData.reasons.set(reason, rData);
    }
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
      jerseyNumber: jerseyMap.get(pId) ?? "??",
      pointsAllowed: data.pointsAllowed,
      breakdowns,
      primaryReason: primaryReason || "N/A",
    });
  }

  return results.sort((a, b) => b.pointsAllowed - a.pointsAllowed);
};
