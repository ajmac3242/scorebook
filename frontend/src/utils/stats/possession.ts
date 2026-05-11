import { StatEvent } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";

/**
 * 🏀 Scout: Possession Logic Utility
 * WHY: Accurate possession tracking is critical for shot-clock phase detection.
 */

export interface PossessionClockState {
  possessionStartClock: number;
  currentProcessingPeriod: number;
  possessionState: string | null;
}

export const processPossessionEvent = (
  event: StatEvent,
  state: PossessionClockState,
  periodLen: number
): PossessionClockState => {
  const newState = { ...state };

  // Handle period transition
  if (event.period !== newState.currentProcessingPeriod) {
    newState.currentProcessingPeriod = event.period;
    newState.possessionStartClock = periodLen;
  }

  const clockTime = event.clockTime ?? periodLen;

  // Manual possession toggle
  if (event.type === ACTION_TYPES.POSSESSION) {
    newState.possessionState = event.playerId;
    newState.possessionStartClock = clockTime;
    return newState;
  }

  // Possession-ending/starting actions
  const isPossessionChange = [
    ACTION_TYPES.TURNOVER,
    ACTION_TYPES.DEF_REBOUND,
    ACTION_TYPES.STEAL,
    ACTION_TYPES.MAKE
  ].includes(event.type);

  // Note: Offensive rebounds do NOT change possession but DO reset the shot clock
  const isShotClockReset = isPossessionChange || event.type === ACTION_TYPES.OFF_REBOUND;

  if (isShotClockReset) {
    // Only reset if it's a field goal make (not a FT)
    if (event.type === ACTION_TYPES.MAKE && event.points === 1) {
      // FT makes don't necessarily reset the "shot clock" in our tracking
      // the same way a live-ball change does, but for simplicity we often track
      // possessions from the last dead/live ball transition.
      // In many rules, FT makes lead to a throw-in (possession change).
    }

    // If it's a make (not a FT), it's a possession change
    if (event.type === ACTION_TYPES.MAKE && event.points && event.points > 1) {
      newState.possessionStartClock = clockTime;
    } else if (event.type !== ACTION_TYPES.MAKE) {
      newState.possessionStartClock = clockTime;
    }
  }

  return newState;
};
