import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import {
  MatchupStats,
  StatEvent,
  PlayerAggregates,
  TargetAttack,
} from "./types";
import {
  isScoringEvent,
  isFreeThrow,
  isOpponentId,
  isActive,
  sortStats,
} from "./core";

/**
 * 🏀 CoachBoard: calculateMatchupStats
 */
export const calculateMatchupStats = (stats: StatEvent[]): MatchupStats[] => {
  const sorted = sortStats(stats);
  const currentMatchups = new Map<string, string>(); // Opponent ID -> Our Player ID
  const reverseMatchups = new Map<string, string>(); // Our Player ID -> Opponent ID
  const results = new Map<string, MatchupStats>(); // "ourId:oppId:isOppDef" -> stats

  let currentGameId: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentMatchups.clear();
      reverseMatchups.clear();
    }

    const isOpp = isOpponentId(s.playerId);
    const type = s.type;

    if (type === ACTION_TYPES.MATCHUP) {
      const oldOurId = currentMatchups.get(s.playerId);
      if (oldOurId) reverseMatchups.delete(oldOurId);

      if (s.relatedPlayerId) {
        const oldOppId = reverseMatchups.get(s.relatedPlayerId);
        if (oldOppId) currentMatchups.delete(oldOppId);

        currentMatchups.set(s.playerId, s.relatedPlayerId);
        reverseMatchups.set(s.relatedPlayerId, s.playerId);
      } else {
        currentMatchups.delete(s.playerId);
      }
      continue;
    }

    const ourDefenderId =
      currentMatchups.get(s.playerId) ||
      currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);

    const oppDefenderId = reverseMatchups.get(s.playerId);

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
          fga: 0,
          fta: 0,
          to: 0,
          oreb: 0,
        };
        results.set(key, m);
      }
      return m;
    };

    if (isScoringEvent(s)) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      }
      continue;
    }

    if (type === ACTION_TYPES.TURNOVER) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      }
    } else if (type === ACTION_TYPES.REBOUND) {
      if (isOpp) {
        if (s.locationX === -1) {
          // OREB
          if (ourDefenderId) {
            const m = getM(ourDefenderId, SPECIAL_PLAYER_IDS.OPPONENT, false);
            m.oreb = (m.oreb || 0) + 1;
          }
        } else {
          if (ourDefenderId) {
            const m = getM(ourDefenderId, SPECIAL_PLAYER_IDS.OPPONENT, false);
            m.stops++;
          }
        }
      } else {
        if (s.locationX === -1) {
          // OREB
          if (oppDefenderId) {
            const m = getM(s.playerId, oppDefenderId, true);
            m.oreb = (m.oreb || 0) + 1;
          }
        } else {
          if (oppDefenderId) {
            const m = getM(s.playerId, oppDefenderId, true);
            m.stops++;
          }
        }
      }
    }
  }

  results.forEach((m) => {
    m.possessions =
      (m.fga || 0) + 0.44 * (m.fta || 0) + (m.to || 0) - (m.oreb || 0);
    if (m.possessions > 0) {
      m.stopPct = ((m.stops / m.possessions) * 100).toFixed(1);
    }
  });

  return Array.from(results.values());
};

/**
 * 🏀 CoachBoard: calculateTargetAttackStats
 */
export const calculateTargetAttackStats = (
  matchups: MatchupStats[],
  playerStats: PlayerAggregates[],
): TargetAttack | null => {
  const defenderStats = new Map<
    string,
    { points: number; possessions: number }
  >();

  for (let i = 0; i < matchups.length; i++) {
    const m = matchups[i];
    if (!m.isOpponentDefender) continue;

    const stats = defenderStats.get(m.opponentPlayerId) || {
      points: 0,
      possessions: 0,
    };
    stats.points += m.pointsAllowed;
    stats.possessions += m.possessions;
    defenderStats.set(m.opponentPlayerId, stats);
  }

  let worstDefenderId = "";
  let highestPpp = -1;

  for (const [id, stats] of defenderStats.entries()) {
    const ppp = stats.possessions > 0 ? stats.points / stats.possessions : 0;
    if (ppp > highestPpp) {
      highestPpp = ppp;
      worstDefenderId = id;
    }
  }

  if (!worstDefenderId || highestPpp === 0) return null;

  const bestAttacker = [...playerStats]
    .filter((p) => p.attempts > 0 && !isOpponentId(p.id.toString()))
    .sort((a, b) => parseFloat(b.efgPct) - parseFloat(a.efgPct))[0];

  if (!bestAttacker) return null;

  return {
    targetOpponentId: worstDefenderId,
    pppAllowed: highestPpp.toFixed(2),
    suggestedAttackerId: bestAttacker.id.toString(),
    reason: `Opponent defender allowing ${highestPpp.toFixed(2)} PPP. ${bestAttacker.name} is our most efficient attacker (${bestAttacker.efgPct}% eFG).`,
  };
};
