/**
 * @file aggregators.ts
 * @description Base aggregators and helper functions for statistics.
 */

import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
} from "../../constants/stats";
import { StatEvent, Player, TeamPlayer, Game } from "../../db";
import { formatToOne, determineResult } from "../mathUtils";
import {
  BaseStats,
  BonusStatus,
  OpponentAggregates,
  PlayerAggregates,
  TeamAggregates,
} from "./types";

/**
 * Standardized sorting for statistical events based on timestamp.
 */
export const sortStats = (stats: StatEvent[]): StatEvent[] => {
  return [...stats].sort((a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;

    const pA =
      a.type === ACTION_TYPES.SUB_IN
        ? 1
        : a.type === ACTION_TYPES.SUB_OUT
          ? 3
          : 2;
    const pB =
      b.type === ACTION_TYPES.SUB_IN
        ? 1
        : b.type === ACTION_TYPES.SUB_OUT
          ? 3
          : 2;

    return pA - pB;
  });
};

export const isOpponentId = (playerId: string): boolean =>
  playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT);

export const isActive = (stat: StatEvent): boolean => !stat.deletedAt;

export const isScoringEvent = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.MAKE;

const FOUL_TYPES = new Set<string>([
  ACTION_TYPES.FOUL,
  ACTION_TYPES.FOUL_SHOOTING,
  ACTION_TYPES.FOUL_NON_SHOOTING,
  ACTION_TYPES.TECHNICAL_FOUL,
]);

export const isFoulAction = (stat: StatEvent): boolean =>
  FOUL_TYPES.has(stat.type);

export const isFreeThrow = (stat: StatEvent): boolean => stat.points === 1;

export const isThreePointAttempt = (stat: StatEvent): boolean =>
  stat.points === 3;

export const isFieldGoal = (stat: StatEvent): boolean =>
  (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.MISS) &&
  !isFreeThrow(stat);

export const calcPct = (numerator: number, denominator: number): string => {
  if (denominator <= 0 || numerator <= 0) return "0.0";
  return formatToOne((numerator / denominator) * 100);
};

export const calculateFgPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

export const calculatePpp = (points: number, possessions: number): string => {
  if (possessions <= 0) return "0.00";
  return (points / possessions).toFixed(2);
};

export const calculatePossessions = (
  fga: number,
  fta: number,
  to: number,
  oreb: number,
): number => {
  return fga + 0.44 * fta + to - oreb;
};

export const calculateFtPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

export const calculateEfgPct = (
  makes: number,
  threePM: number,
  attempts: number,
): string => calcPct(makes + 0.5 * threePM, attempts);

export const calculateTsPct = (
  points: number,
  attempts: number,
  fta: number,
): string => calcPct(points, 2 * (attempts + 0.44 * fta));

export const getInitials = (name: string | undefined | null): string => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const getPlayerJersey = (
  playerId: number | string | undefined,
  teamPlayers: TeamPlayer[],
): string => {
  if (!playerId) return "";
  const tp = teamPlayers.find((t) => t.playerId === playerId);
  return tp?.jerseyNumber ?? "";
};

/**
 * Resolves a player's display name, handling opponent and team-level identifiers.
 */
export const getPlayerDisplayName = (
  playerId: string,
  playerNamesMap: Map<string | number, string>,
  gameOpponent?: string,
  teamName?: string,
): string => {
  if (playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
    return gameOpponent || "Opponent";
  }
  if (playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
    const jersey = playerId.split(":")[1];
    return `${gameOpponent || "Opponent"} #${jersey}`;
  }
  if (
    playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
    playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
  ) {
    return teamName || "Our Team";
  }
  return playerNamesMap.get(playerId) || "Unknown Player";
};

export const getBonusStatus = (
  fouls: number,
  periodType: string,
): BonusStatus => {
  const config = BONUS_CONFIG[periodType] || BONUS_CONFIG.QUARTERS;

  if (fouls >= config.double) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: true,
      color: "error.main",
    };
  }
  if (fouls >= config.single) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: false,
      color: "error.main",
    };
  }
  if (fouls === config.warning) {
    return {
      label: "",
      isBonus: false,
      isDouble: false,
      color: "warning.main",
    };
  }
  return { label: "", isBonus: false, isDouble: false, color: "default" };
};

export const updateScores = (
  stat: StatEvent,
  scores: { team: number; opp: number },
) => {
  if (isScoringEvent(stat)) {
    const points = stat.points || 0;
    const key = isOpponentId(stat.playerId) ? "opp" : "team";
    scores[key] += points;
  }
};

export const applyActionToAggregate = (agg: BaseStats, stat: StatEvent) => {
  switch (stat.type) {
    case ACTION_TYPES.MAKE:
      agg.points += stat.points || 0;
      if (isFreeThrow(stat)) {
        if (agg.ftm !== undefined) agg.ftm++;
        if (agg.fta !== undefined) agg.fta++;
      } else {
        agg.makes++;
        agg.attempts++;
        if (isThreePointAttempt(stat)) {
          if (agg.threePM !== undefined) agg.threePM++;
          if (agg.threePA !== undefined) agg.threePA++;
        }
      }
      break;
    case ACTION_TYPES.MISS:
      if (isFreeThrow(stat)) {
        if (agg.fta !== undefined) agg.fta++;
      } else {
        agg.attempts++;
        if (isThreePointAttempt(stat)) {
          if (agg.threePA !== undefined) agg.threePA++;
        }
      }
      break;
    case ACTION_TYPES.REBOUND:
    case ACTION_TYPES.OFF_REBOUND:
    case ACTION_TYPES.DEF_REBOUND:
      agg.rebounds++;
      if (stat.type === ACTION_TYPES.OFF_REBOUND) agg.offRebounds++;
      if (stat.type === ACTION_TYPES.DEF_REBOUND) agg.defRebounds++;
      break;
    case ACTION_TYPES.BLOCK:
      agg.blocks++;
      break;
    case ACTION_TYPES.ASSIST:
      agg.assists++;
      break;
    case ACTION_TYPES.STEAL:
      agg.steals++;
      break;
    case ACTION_TYPES.TURNOVER:
      agg.turnovers++;
      break;
    default:
      if (isFoulAction(stat)) {
        agg.fouls++;
      }
      break;
  }
};

/**
 *
 */
export function initializeStatsMap(
  players: Player[],
  teamPlayers: TeamPlayer[],
): Map<string, PlayerAggregates> {
  const jerseyMap = new Map<string, string | undefined>(
    teamPlayers.map((tp) => [tp.playerId, tp.jerseyNumber]),
  );

  const statsMap = new Map<string, PlayerAggregates>();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
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

export const calculateTeamAggregates = (
  games: Game[],
  stats: StatEvent[],
  completedOnly = true,
): TeamAggregates => {
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

    if (stat.type === ACTION_TYPES.MAKE) {
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
    record: calculateRecord(gameTotals.values()),
    totalGames: targetCount,
    ppp: calculatePpp(team.pts, totalPossessions),
    possessions: Math.round(totalPossessions),
    oppPpp: calculatePpp(opp.pts, totalOppPossessions),
    ftPct: calculateFtPct(team.ftm, team.fta),
    turnoverRate: calcPct(team.to, totalPossessions),
    orebPct: calcPct(team.oreb, team.oreb + opp.dreb),
  };
};

export const calculateOpponentAggregates = (
  stats: StatEvent[],
): OpponentAggregates => {
  const agg = {
    points: 0,
    makes: 0,
    attempts: 0,
    rebounds: 0,
    offRebounds: 0,
    defRebounds: 0,
    assists: 0,
    blocks: 0,
    steals: 0,
    turnovers: 0,
    fouls: 0,
    fta: 0,
    ftm: 0,
    threePM: 0,
    threePA: 0,
  };

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat) || !isOpponentId(stat.playerId)) continue;

    applyActionToAggregate(agg, stat);
  }

  const possessions = calculatePossessions(
    agg.attempts,
    agg.fta,
    agg.turnovers,
    agg.offRebounds,
  );

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
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    if (stat.gameId === gameId) {
      updateScores(stat, scores);
    }
  }

  const result = determineResult(scores.team, scores.opp);
  return { teamScore: scores.team, oppScore: scores.opp, result };
};

export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  if (periodType === "QUARTERS") {
    if (currentPeriod === 4) return eventPeriod >= 4;
    return eventPeriod === currentPeriod;
  }

  // For non-quarters (halves), any period >= 2 is part of the second half (including OT)
  if (currentPeriod === 1) return eventPeriod === 1;
  return eventPeriod >= 2;
};
