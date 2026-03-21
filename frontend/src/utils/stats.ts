/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, TeamPlayer } from "../db";

/**
 * Interface for aggregated player statistics.
 */
export interface PlayerAggregates {
  id: number | string;
  name: string;
  avatarColor?: string;
  jerseyNumber?: string;
  gamesPlayed: Set<number | string>;
  gp: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  turnovers: number;
  makes: number;
  attempts: number;
  fgPct: string;
}

/**
 * Returns the initials of a name (max 2 characters).
 * @param {string} name - The full name.
 * @returns {string} The uppercase initials.
 */
export const getInitials = (name: string | undefined | null): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Retrieves the jersey number for a player from the team roster.
 * @param {number | string | undefined} pId - The player ID.
 * @param {TeamPlayer[]} teamPlayers - The team-player junction records.
 * @returns {string} The jersey number or an empty string.
 */
export const getPlayerJersey = (
  pId: number | string | undefined,
  teamPlayers: TeamPlayer[],
): string => {
  if (!pId) return "";
  const tp = teamPlayers.find((t) => t.playerId === pId);
  return tp?.jerseyNumber || "";
};

/**
 * Calculates aggregated statistics for a list of players based on a set of events.
 * Supports both total and per-game average calculations.
 *
 * @param {any[]} players - List of player objects.
 * @param {StatEvent[]} stats - List of statistical events to process.
 * @param {TeamPlayer[]} teamPlayers - (Optional) Team roster for jersey numbers.
 * @param {"total" | "average"} viewType - (Optional) Type of calculation, defaults to "total".
 * @returns {PlayerAggregates[]} Array of aggregated statistics.
 */
export const calculatePlayerAggregates = (
  players: any[],
  stats: StatEvent[],
  teamPlayers: TeamPlayer[] = [],
  viewType: "total" | "average" = "total",
): PlayerAggregates[] => {
  const statsMap: Record<string, PlayerAggregates> = {};

  // Initialize the map with base player data
  players.forEach((p) => {
    const pId = p.id!;
    statsMap[pId] = {
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      jerseyNumber:
        teamPlayers.find((tp) => tp.playerId === pId)?.jerseyNumber || "",
      gamesPlayed: new Set(),
      gp: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      turnovers: 0,
      makes: 0,
      attempts: 0,
      fgPct: "0.0",
    };
  });

  // Accumulate statistics from event stream
  stats.forEach((s) => {
    const pId = s.playerId;
    if (statsMap[pId]) {
      const p = statsMap[pId];
      p.gamesPlayed.add(s.gameId);

      if (s.type === ACTION_TYPES.MAKE) {
        p.points += s.points || 0;
        p.makes += 1;
        p.attempts += 1;
      } else if (s.type === ACTION_TYPES.MISS) {
        p.attempts += 1;
      } else if (s.type === ACTION_TYPES.REBOUND) {
        p.rebounds += 1;
      } else if (s.type === ACTION_TYPES.ASSIST) {
        p.assists += 1;
      } else if (s.type === ACTION_TYPES.STEAL) {
        p.steals += 1;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        p.turnovers += 1;
      }
    }
  });

  // Finalize totals, percentages, and averages
  return Object.values(statsMap).map((p) => {
    const gp = p.gamesPlayed.size || 1;
    p.gp = p.gamesPlayed.size;
    p.fgPct =
      p.attempts > 0 ? ((p.makes / p.attempts) * 100).toFixed(1) : "0.0";

    if (viewType === "average") {
      return {
        ...p,
        points: Number((p.points / gp).toFixed(1)),
        rebounds: Number((p.rebounds / gp).toFixed(1)),
        assists: Number((p.assists / gp).toFixed(1)),
        steals: Number((p.steals / gp).toFixed(1)),
        turnovers: Number((p.turnovers / gp).toFixed(1)),
      } as any;
    }
    return p;
  });
};

/**
 * Calculates aggregated team statistics (PPG, RPG, etc.) and W/L record.
 *
 * @param {any[]} games - List of games.
 * @param {StatEvent[]} stats - List of statistical events across those games.
 * @param {boolean} completedOnly - (Optional) Only include completed games, defaults to true.
 * @returns {object} Team level aggregates.
 */
export const calculateTeamAggregates = (
  games: any[],
  stats: StatEvent[],
  completedOnly = true,
) => {
  const targetGames = completedOnly
    ? games.filter((g) => g.completed === 1)
    : games;
  const targetGameIds = targetGames.map((g) => g.id);
  const relevantStats = stats.filter((s) =>
    targetGameIds.includes(s.gameId as any),
  );

  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalOppPoints = 0;
  let wins = 0;
  let losses = 0;

  targetGameIds.forEach((gId) => {
    let gameTeamPoints = 0;
    let gameOppPoints = 0;
    const gameStats = relevantStats.filter((s) => s.gameId === gId);

    gameStats.forEach((s) => {
      if (s.playerId === "OPPONENT") {
        gameOppPoints += s.points || 0;
      } else {
        gameTeamPoints += s.points || 0;
        if (s.type === ACTION_TYPES.REBOUND) totalRebounds++;
        if (s.type === ACTION_TYPES.ASSIST) totalAssists++;
      }
    });

    totalPoints += gameTeamPoints;
    totalOppPoints += gameOppPoints;
    if (gameTeamPoints > gameOppPoints) wins++;
    else if (gameTeamPoints < gameOppPoints) losses++;
  });

  const gp = targetGames.length || 1;
  return {
    ppg: (totalPoints / gp).toFixed(1),
    rpg: (totalRebounds / gp).toFixed(1),
    apg: (totalAssists / gp).toFixed(1),
    oppg: (totalOppPoints / gp).toFixed(1),
    record: `${wins}-${losses}`,
    totalGames: targetGames.length,
  };
};

/**
 * Calculates the score and result (W, L, D) for a single game.
 *
 * @param {number | string} gameId - The game ID.
 * @param {StatEvent[]} stats - All statistics events for filtering.
 * @returns {object} Final team score, opponent score, and result code.
 */
export const calculateGameResult = (
  gameId: number | string,
  stats: StatEvent[],
) => {
  const gameStats = stats.filter((s) => s.gameId === gameId);
  const teamScore = gameStats
    .filter((s) => s.playerId !== "OPPONENT")
    .reduce((sum, s) => sum + (s.points || 0), 0);
  const oppScore = gameStats
    .filter((s) => s.playerId === "OPPONENT")
    .reduce((sum, s) => sum + (s.points || 0), 0);

  const result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";
  return { teamScore, oppScore, result };
};
