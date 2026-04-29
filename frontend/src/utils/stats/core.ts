import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent, Player, TeamPlayer } from "../../db";
import { formatToOne } from "../mathUtils";
import { PlayerAggregates } from "./types";

/**
 * Standardized sorting for statistical events based on timestamp.
 */
export const sortStats = (stats: StatEvent[]): StatEvent[] => {
  return [...stats].sort((a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;

    let pA = 2;
    if (a.type === ACTION_TYPES.SUB_IN) pA = 1;
    else if (a.type === ACTION_TYPES.SUB_OUT) pA = 3;

    let pB = 2;
    if (b.type === ACTION_TYPES.SUB_IN) pB = 1;
    else if (b.type === ACTION_TYPES.SUB_OUT) pB = 3;

    return pA - pB;
  });
};

/**
 * Helper to determine the length of a period in seconds.
 */
export const getPeriodLen = (
  period: number,
  options: {
    periodLength?: number;
    overtimeLength?: number;
    periodType?: string;
  },
): number => {
  const isOT = options.periodType === "HALVES" ? period > 2 : period > 4;
  const mins = isOT
    ? options.overtimeLength ?? 5
    : options.periodLength ?? 10;
  return mins * 60;
};

/**
 * Determines if a player ID belongs to an opponent.
 */
export const isOpponentId = (playerId: string | null): boolean => {
  if (!playerId) return false;
  if (playerId[0] !== "O") return false;
  return (
    playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
    playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
  );
};

export const isActive = (stat: StatEvent): boolean => !stat.deletedAt;
export const isScoringEvent = (stat: StatEvent): boolean => stat.type === ACTION_TYPES.MAKE;
export const isFreeThrow = (stat: StatEvent): boolean => stat.points === 1;
export const isThreePointAttempt = (stat: StatEvent): boolean => stat.points === 3;

export const calcPct = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return "0.0";
  if (numerator <= 0) return "0.0";
  return formatToOne((numerator / denominator) * 100);
};

export const initializeStatsMap = (
  players: Player[],
  teamPlayers: TeamPlayer[],
): Map<string, PlayerAggregates> => {
  const jerseyMap = new Map<string, string | undefined>();
  for (let i = 0; i < teamPlayers.length; i++) {
    jerseyMap.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
  }

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
};

export const applyActionToAggregate = (agg: PlayerAggregates | OpponentAggregates | LineupAggregates, stat: StatEvent) => {
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
      agg.rebounds++;
      break;
    case ACTION_TYPES.OFF_REBOUND:
      agg.offRebounds++;
      agg.rebounds++;
      break;
    case ACTION_TYPES.DEF_REBOUND:
      agg.defRebounds++;
      agg.rebounds++;
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
    case ACTION_TYPES.FOUL:
    case ACTION_TYPES.FOUL_SHOOTING:
    case ACTION_TYPES.FOUL_NON_SHOOTING:
    case ACTION_TYPES.TECHNICAL_FOUL:
      agg.fouls++;
      break;
  }
};
