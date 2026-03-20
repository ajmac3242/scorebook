import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, TeamPlayer } from "../db";

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

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getPlayerJersey = (
  pId: number | string | undefined,
  teamPlayers: TeamPlayer[],
): string => {
  if (!pId) return "";
  const tp = teamPlayers.find((t) => t.playerId.toString() === pId.toString());
  return tp?.jerseyNumber || "";
};

export const calculatePlayerAggregates = (
  players: any[],
  stats: StatEvent[],
  teamPlayers: TeamPlayer[] = [],
  viewType: "total" | "average" = "total",
): PlayerAggregates[] => {
  const statsMap: Record<string, PlayerAggregates> = {};

  players.forEach((p) => {
    const pId = p.id!.toString();
    statsMap[pId] = {
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      jerseyNumber:
        teamPlayers.find((tp) => tp.playerId.toString() === pId)
          ?.jerseyNumber || "",
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

  stats.forEach((s) => {
    const pId = s.playerId.toString();
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

export const calculateGameResult = (gameId: number | string, stats: StatEvent[]) => {
  const gameStats = stats.filter(s => s.gameId.toString() === gameId.toString());
  const teamScore = gameStats
    .filter(s => s.playerId !== "OPPONENT")
    .reduce((sum, s) => sum + (s.points || 0), 0);
  const oppScore = gameStats
    .filter(s => s.playerId === "OPPONENT")
    .reduce((sum, s) => sum + (s.points || 0), 0);

  const result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";
  return { teamScore, oppScore, result };
};
