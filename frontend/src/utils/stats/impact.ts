/**
 * @file impact.ts
 * @description Impact and streak metrics.
 */

import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent } from "../../db";
import {
  isActive,
  isScoringEvent,
  sortStats,
  calculatePossessions,
  calculatePpp,
} from "./aggregators";

export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();
  let currentGameId: string | null = null;

  const sorted = options.isSorted ? stats : sortStats(stats);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
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

export const calculateStopsAndKills = (stats: StatEvent[]) => {
  let totalStops = 0;
  let totalKills = 0;
  let currentStreak = 0;

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

    const isOpp =
      s.playerId === "OPPONENT" || s.playerId.startsWith("OPPONENT:");

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
      currentStreak = 0;
    }
  }

  return { totalStops, totalKills, currentStreak };
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
  const results: OnOffStats[] = [];

  for (const player of players) {
    const pId = player.id;
    const statsOn = {
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
    const statsOff = {
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

      const isOn = currentLineup.has(pId);
      const target = isOn ? statsOn : statsOff;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      if (s.type === ACTION_TYPES.MAKE) {
        if (isOpp) target.ptsAgainst += s.points || 0;
        else target.ptsFor += s.points || 0;
      }

      if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
        const pts = s.points || 0;
        if (pts === 1) {
          if (isOpp) target.oppFta++;
          else target.fta++;
        } else {
          if (isOpp) target.oppFga++;
          else target.fga++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        if (isOpp) target.oppTo++;
        else target.to++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        if (isOpp) target.oppOreb++;
        else target.oreb++;
      }
    }

    const onPoss = calculatePossessions(
      statsOn.fga,
      statsOn.fta,
      statsOn.to,
      statsOn.oreb,
    );
    const onOppPoss = calculatePossessions(
      statsOn.oppFga,
      statsOn.oppFta,
      statsOn.oppTo,
      statsOn.oppOreb,
    );
    const offPoss = calculatePossessions(
      statsOff.fga,
      statsOff.fta,
      statsOff.to,
      statsOff.oreb,
    );
    const offOppPoss = calculatePossessions(
      statsOff.oppFga,
      statsOff.oppFta,
      statsOff.oppTo,
      statsOff.oppOreb,
    );

    const onOffRating = calculatePpp(statsOn.ptsFor, onPoss);
    const onDefRating = calculatePpp(statsOn.ptsAgainst, onOppPoss);
    const onNet = (parseFloat(onOffRating) - parseFloat(onDefRating)).toFixed(2);

    const offOffRating = calculatePpp(statsOff.ptsFor, offPoss);
    const offDefRating = calculatePpp(statsOff.ptsAgainst, offOppPoss);
    const offNet = (parseFloat(offOffRating) - parseFloat(offDefRating)).toFixed(
      2,
    );

    const diff = (parseFloat(onNet) - parseFloat(offNet)).toFixed(2);

    results.push({
      playerId: pId,
      name: player.name,
      on: {
        possessions: Math.round(onPoss),
        ptsFor: statsOn.ptsFor,
        ptsAgainst: statsOn.ptsAgainst,
        offRating: onOffRating,
        defRating: onDefRating,
        netRating: onNet,
      },
      off: {
        possessions: Math.round(offPoss),
        ptsFor: statsOff.ptsFor,
        ptsAgainst: statsOff.ptsAgainst,
        offRating: offOffRating,
        defRating: offDefRating,
        netRating: offNet,
      },
      differential: diff,
    });
  }

  return results;
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
  const matchupMap = new Map<string, { pointsAllowed: number; stops: number; possessions: number }>();
  const sorted = sortStats(stats);

  // Track current defenders assigned to opponents based on events
  const currentMatchups = new Map<string, string>();

  for (const s of sorted) {
    if (!isActive(s)) continue;

    const isOpp = s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT);
    if (!isOpp) continue;

    const oppId = s.playerId;
    const defenderId = s.primaryDefenderId;

    if (defenderId) {
        currentMatchups.set(oppId, defenderId);
    }

    const activeDefender = currentMatchups.get(oppId);
    if (!activeDefender) continue;

    const key = `${oppId}:${activeDefender}`;
    if (!matchupMap.has(key)) {
        matchupMap.set(key, { pointsAllowed: 0, stops: 0, possessions: 0 });
    }
    const m = matchupMap.get(key)!;

    if (s.type === ACTION_TYPES.MAKE) {
        m.pointsAllowed += s.points || 0;
        m.possessions++;
    } else if (s.type === ACTION_TYPES.TURNOVER) {
        m.stops++;
        m.possessions++;
    } else if (s.type === ACTION_TYPES.MISS) {
        // Possession continues until a rebound or another event
        // For simplicity in Matchup Tracking, we count the end of a possession
        // In a real tracker, this would be more complex
    } else if (s.type === ACTION_TYPES.DEF_REBOUND) {
        // This is usually recorded for our player, but if we see it in context of an opponent miss
        // it counts as a stop. However, StatEvent for DEF_REBOUND has playerId of our player.
    }
  }

  // Refined pass to capture stops on defensive rebounds
  let inOppPossession = false;
  let lastOppPlayerId = "";
  for (const s of sorted) {
    if (!isActive(s)) continue;
    const isOpp = s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT);

    if (isOpp) {
        lastOppPlayerId = s.playerId;
    if (s.type === ACTION_TYPES.MISS) inOppPossession = true;
    if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.TURNOVER) inOppPossession = false;
    } else {
        if (inOppPossession && (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)) {
            const defenderId = s.playerId;
            const key = `${lastOppPlayerId}:${defenderId}`;
            if (matchupMap.has(key)) {
                matchupMap.get(key)!.stops++;
                matchupMap.get(key)!.possessions++;
            }
            inOppPossession = false;
        }
    }
  }

  const results: MatchupStat[] = [];
  for (const [key, data] of matchupMap.entries()) {
    const [oppId, defenderId] = key.split(":");
    const defender = players.find(p => p.id === defenderId);
    if (!defender) continue;

    results.push({
        opponentId: oppId,
        opponentJersey: oppId.includes(":") ? oppId.split(":")[1] : "??",
        defenderId,
        defenderName: defender.name,
        pointsAllowed: data.pointsAllowed,
        stops: data.stops,
        totalPossessions: data.possessions,
        stopPct: data.possessions > 0 ? ((data.stops / data.possessions) * 100).toFixed(1) : "0.0"
    });
  }

  return results.sort((a, b) => b.pointsAllowed - a.pointsAllowed);
};
