/**
 * @file onOff.ts
 * @description On/Off player differential and rating metrics module.
 *
 * WHY: Calculates team offensive, defensive, and net ratings when specific players
 * are on the court versus off the court.
 */

import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";
import {
  isActive,
  isScoringEvent,
  sortStats,
  calculatePossessions,
  calculatePpp,
  isOpponentId,
  isFreeThrow,
} from "../aggregators";

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
