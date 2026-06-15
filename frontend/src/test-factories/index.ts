import { Team, Player, Game, StatEvent as GameEvent } from "../db";

export function buildTeam(overrides?: Partial<Team>): Team {
  return {
    id: "team-test-id",
    name: "Test Team",
    periodType: "QUARTERS",
    isFavorite: 0,
    ...overrides,
  };
}

export function buildPlayer(overrides?: Partial<Player>): Player {
  return {
    id: "player-test-id",
    teamId: "team-test-id",
    name: "Test Player",
    number: "00",
    ...overrides,
  } as Player;
}

export function buildGame(overrides?: Partial<Game>): Game {
  return {
    id: "game-test-id",
    teamId: "team-test-id",
    opponent: "Test Opponent",
    date: "2026-01-01",
    completed: 0,
    isFavorite: 0,
    ...overrides,
  } as Game;
}

export function buildGameEvent(overrides?: Partial<GameEvent>): GameEvent {
  return {
    id: "event-test-id",
    gameId: "game-test-id",
    playerId: "player-test-id",
    teamId: "team-test-id",
    type: "SHOT_MADE",
    value: 2,
    period: 1,
    timestamp: Date.now(),
    ...overrides,
  } as unknown as GameEvent;
}
