import { Team, Player, Game, StatEvent as GameEvent } from "../db";

/**
 * Factory for creating Team objects for tests.
 */
export const buildTeam = (overrides?: Partial<Team>): Team => ({
  id: "team-test-id",
  name: "Test Team",
  periodType: "QUARTERS",
  isFavorite: 0,
  ...overrides,
});

/**
 * Factory for creating Player objects for tests.
 */
export const buildPlayer = (overrides?: Partial<Player>): Player =>
  ({
    id: "player-test-id",
    teamId: "team-test-id",
    name: "Test Player",
    number: "00",
    ...overrides,
  }) as Player;

/**
 * Factory for creating Game objects for tests.
 */
export const buildGame = (overrides?: Partial<Game>): Game => ({
  id: "game-test-id",
  teamId: "team-test-id",
  opponent: "Test Opponent",
  date: "2026-01-01",
  completed: 0,
  isFavorite: 0,
  location: "Home",
  ...overrides,
});

/**
 * Factory for creating GameEvent objects for tests.
 */
export const buildGameEvent = (
  overrides?: Partial<GameEvent> & { value?: number },
): GameEvent => {
  const { value, ...rest } = overrides || {};
  return {
    id: "event-test-id",
    gameId: "game-test-id",
    playerId: "player-test-id",
    teamId: "team-test-id",
    type: "SHOT_MADE",
    points: value !== undefined ? value : 2,
    period: 1,
    timestamp: new Date().toISOString(),
    ...rest,
  } as GameEvent;
};
