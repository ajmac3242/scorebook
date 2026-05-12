import { describe, it, expect } from "vitest";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { processPossessionEvent, PossessionClockState } from "../possession";
import { StatEvent } from "../../../db";

describe("processPossessionEvent", () => {
  const periodLen = 600;

  const initialState: PossessionClockState = {
    possessionStartClock: periodLen,
    currentProcessingPeriod: 1,
    possessionState: null,
  };

  it("should reset possessionStartClock on period transition", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      period: 2,
      clockTime: 590,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const state = { ...initialState, possessionStartClock: 10 };
    const result = processPossessionEvent(event, state, periodLen);

    expect(result.currentProcessingPeriod).toBe(2);
    expect(result.possessionStartClock).toBe(600);
  });

  it("should reset possessionStartClock on DEF_REBOUND", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.DEF_REBOUND,
      period: 1,
      clockTime: 450,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const result = processPossessionEvent(event, initialState, periodLen);
    expect(result.possessionStartClock).toBe(450);
  });

  it("should reset possessionStartClock on STEAL", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.STEAL,
      period: 1,
      clockTime: 300,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const result = processPossessionEvent(event, initialState, periodLen);
    expect(result.possessionStartClock).toBe(300);
  });

  it("should reset possessionStartClock on TURNOVER", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.TURNOVER,
      period: 1,
      clockTime: 200,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const result = processPossessionEvent(event, initialState, periodLen);
    expect(result.possessionStartClock).toBe(200);
  });

  it("should reset possessionStartClock on OFF_REBOUND", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.OFF_REBOUND,
      period: 1,
      clockTime: 150,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const result = processPossessionEvent(event, initialState, periodLen);
    expect(result.possessionStartClock).toBe(150);
  });

  it("should handle manual POSSESSION toggle", () => {
    const event: StatEvent = {
      gameId: "g1",
      playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
      type: ACTION_TYPES.POSSESSION,
      period: 1,
      clockTime: 500,
      timestamp: "2025-01-01T00:00:00Z",
    };

    const result = processPossessionEvent(event, initialState, periodLen);
    expect(result.possessionState).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);
    expect(result.possessionStartClock).toBe(500);
  });
});
