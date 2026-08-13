/**
 * @file aggregators.ts
 * @description Base aggregators and core computation functions for statistics.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent, Player, TeamPlayer, Game } from "../../db";
import { formatToOne, determineResult } from "../mathUtils";
import { PlayerAggregates, TeamAggregates, OpponentAggregates } from "./types";

// Re-export all functions from helpers to maintain full compatibility for relative imports
export * from "./helpers";

import {
  isActive,
  isOpponentId,
  isFieldGoal,
  isFreeThrow,
  calculatePossessions,
  calcPct,
  calculatePpp,
  calculateFtPct,
  calculateFgPct,
  applyActionToAggregate,
  updateScores,
} from "./helpers";

/**
 * Initializes a map of player aggregates for a team.
 */
export function initializeStatsMap(
  players: Player[],
  teamPlayers: TeamPlayer[],
): Map<string, PlayerAggregates> {
  const jerseyMap = new Map<string, string | undefined>(
    teamPlayers.map((tp) => [tp.playerId, tp.jerseyNumber]),
  );

  const statsMap = new Map<string, PlayerAggregates>();
  for (const player of players) {
    const playerId = player.id!.toString();
    statsMap.set(playerId, {
      id: player.id,
      name: player.name,
      avatarColor: player.avatarColor,
      jerseyNumber: jerseyMap.get(playerId) ?? "",
      gamesPlayed: new Set<string | number>(),
      gp: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      hockeyAssists: 0,
      steals: 0,
      turnovers: 0,
      blocks: 0,
      offRebounds: 0,
      defRebounds: 0,
      makes: 0,
      attempts: 0,
      threePM: 0,
      threePA: 0,
      ftm: 0,
      fta: 0,
      fgPct: "0.0",
      threePPct: "0.0",
      ftPct: "0.0",
      efgPct: "0.0",
      tsPct: "0.0",
      plusMinus: 0,
      min: 0,
      fouls: 0,
    });
  }
  return statsMap;
}

export const calculateTeamSeasonAverages = (
  games: Game[],
  allStats: StatEvent[],
): {
  ppp: string;
  ftPct: string;
  turnoverRate: string;
  orebPct: string;
} => {
  const teamAgg = calculateTeamAggregates(games, allStats, true);
  return {
    ppp: teamAgg.ppp,
    ftPct: teamAgg.ftPct,
    turnoverRate: teamAgg.turnoverRate,
    orebPct: teamAgg.orebPct,
  };
};

/**
 * Calculates a win-loss-draw record from game totals.
 */
function calculateRecord(
  gameTotals: Iterable<{ team: number; opp: number }>,
): string {
  const { wins, losses, draws } = Array.from(gameTotals).reduce(
    (acc, { team, opp }) => {
      if (team > opp) acc.wins++;
      else if (team < opp) acc.losses++;
      else acc.draws++;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 },
  );

  return draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`;
}

/**
 * Calculates team statistics aggregates over a collection of games and stats.
 *
 * @param {Game[]} games - List of games to aggregate.
 * @param {StatEvent[]} stats - List of stat events to evaluate.
 * @param {boolean} [completedOnly=true] - Whether to only include completed games in the aggregate.
 * @returns {TeamAggregates} The calculated team statistic aggregates.
 */
export const calculateTeamAggregates = (
  games: Game[],
  stats: StatEvent[],
  completedOnly = true,
): TeamAggregates => {
  if (games.length === 0) {
    return {
      ppg: "0.0",
      rpg: "0.0",
      apg: "0.0",
      oppg: "0.0",
      record: "0-0",
      totalGames: 0,
      ppp: "0.00",
      possessions: 0,
      oppPpp: "0.00",
      ftPct: "0.0",
      turnoverRate: "0.0",
      orebPct: "0.0",
    };
  }

  const gameTotals = new Map<string, { team: number; opp: number }>();
  let targetCount = 0;

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
    ftm: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
  };
  const opp = {
    pts: 0,
    fga: 0,
    fta: 0,
    ftm: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
  };

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const totals = gameTotals.get(stat.gameId);
    if (!totals) continue;

    const isOpponent = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    if (
      stat.type === ACTION_TYPES.MAKE ||
      stat.type === ACTION_TYPES.SYSTEM_ADJUSTMENT
    ) {
      if (isOpponent) {
        totals.opp += pts;
        opp.pts += pts;
      } else {
        totals.team += pts;
        team.pts += pts;
      }
    }

    const { type } = stat;
    if (isFieldGoal(stat)) {
      if (isOpponent) opp.fga++;
      else team.fga++;
    } else if (isFreeThrow(stat)) {
      if (isOpponent) {
        opp.fta++;
        if (stat.type === ACTION_TYPES.MAKE) opp.ftm++;
      } else {
        team.fta++;
        if (stat.type === ACTION_TYPES.MAKE) team.ftm++;
      }
    } else if (type === ACTION_TYPES.TURNOVER) {
      if (isOpponent) opp.to++;
      else team.to++;
    } else if (type === ACTION_TYPES.OFF_REBOUND) {
      if (isOpponent) opp.oreb++;
      else team.oreb++;
    }

    if (
      stat.type === ACTION_TYPES.OFF_REBOUND ||
      stat.type === ACTION_TYPES.REBOUND ||
      stat.type === ACTION_TYPES.DEF_REBOUND
    ) {
      if (isOpponent) {
        if (stat.type === ACTION_TYPES.DEF_REBOUND) opp.dreb++;
      } else {
        if (stat.type === ACTION_TYPES.DEF_REBOUND) team.dreb++;
        team.reb++;
      }
    } else if (stat.type === ACTION_TYPES.ASSIST) {
      if (!isOpponent) team.ast++;
    }
  }

  const gp = targetCount || 1;
  const totalPossessions = calculatePossessions({
    fga: team.fga,
    fta: team.fta,
    turnovers: team.to,
    offRebounds: team.oreb,
  });
  const totalOppPossessions = calculatePossessions({
    fga: opp.fga,
    fta: opp.fta,
    turnovers: opp.to,
    offRebounds: opp.oreb,
  });

  const teamOrebPct = calcPct(team.oreb, team.oreb + opp.dreb);

  return {
    ppg: formatToOne(team.pts / gp),
    rpg: formatToOne(team.reb / gp),
    apg: formatToOne(team.ast / gp),
    oppg: formatToOne(opp.pts / gp),
    record: calculateRecord(gameTotals.values()),
    totalGames: targetCount,
    ppp: calculatePpp(team.pts, totalPossessions),
    possessions: Math.round(totalPossessions),
    oppPpp: calculatePpp(opp.pts, totalOppPossessions),
    ftPct: calculateFtPct(team.ftm, team.fta),
    turnoverRate:
      totalPossessions > 0
        ? ((team.to / totalPossessions) * 100).toFixed(1)
        : "0.0",
    orebPct: teamOrebPct,
  };
};

/**
 * Calculates opponent statistics aggregates over a stream of stat events.
 *
 * @param {StatEvent[]} stats - List of stat events to evaluate.
 * @returns {OpponentAggregates} The calculated opponent statistic aggregates.
 */
export const calculateOpponentAggregates = (
  stats: StatEvent[],
): OpponentAggregates => {
  const defaultAgg: OpponentAggregates = {
    points: 0,
    makes: 0,
    attempts: 0,
    rebounds: 0,
    offRebounds: 0,
    defRebounds: 0,
    assists: 0,
    hockeyAssists: 0,
    blocks: 0,
    steals: 0,
    turnovers: 0,
    fouls: 0,
    fta: 0,
    ftm: 0,
    threePM: 0,
    threePA: 0,
    fgPct: "0.0",
    min: 0,
    plusMinus: 0,
    ppp: "0.00",
    possessions: 0,
  };

  if (!stats || stats.length === 0) {
    return defaultAgg;
  }

  const agg = {
    points: 0,
    makes: 0,
    attempts: 0,
    rebounds: 0,
    offRebounds: 0,
    defRebounds: 0,
    assists: 0,
    hockeyAssists: 0,
    blocks: 0,
    steals: 0,
    turnovers: 0,
    fouls: 0,
    fta: 0,
    ftm: 0,
    threePM: 0,
    threePA: 0,
  };

  // ⚡ Bolt: Fast standard index loop with early-return for inactive/non-opponent stats
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat) || !isOpponentId(stat.playerId)) continue;

    applyActionToAggregate(agg, stat);
  }

  const possessions = calculatePossessions({
    fga: agg.attempts,
    fta: agg.fta,
    turnovers: agg.turnovers,
    offRebounds: agg.offRebounds,
  });

  return {
    ...agg,
    fgPct: calculateFgPct(agg.makes, agg.attempts),
    min: 0,
    plusMinus: 0,
    ppp: calculatePpp(agg.points, possessions),
    possessions: Math.round(possessions),
  };
};

export const calculateGameResult = (
  gameId: number | string,
  stats: StatEvent[],
) => {
  const scores = { team: 0, opp: 0 };
  for (const stat of stats) {
    if (isActive(stat) && stat.gameId === gameId) {
      updateScores(stat, scores);
    }
  }

  const result = determineResult(scores.team, scores.opp);
  return { teamScore: scores.team, oppScore: scores.opp, result };
};
