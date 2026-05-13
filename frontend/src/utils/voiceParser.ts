import { ACTION_TYPES } from "../constants/stats";

export interface ParsedVoiceAction {
  jerseyNumber?: string;
  action: string;
  points?: number;
  isOpponent: boolean;
}

export interface ParsedVoiceCommand {
  actions: ParsedVoiceAction[];
  raw: string;
}

const NUMBER_MAP: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
};

const ACTION_MAP: Record<string, string> = {
  make: ACTION_TYPES.MAKE,
  miss: ACTION_TYPES.MISS,
  rebound: ACTION_TYPES.REBOUND,
  assist: ACTION_TYPES.ASSIST,
  steal: ACTION_TYPES.STEAL,
  block: ACTION_TYPES.BLOCK,
  turnover: ACTION_TYPES.TURNOVER,
  foul: ACTION_TYPES.FOUL_SHOOTING,
  timeout: ACTION_TYPES.TIMEOUT,
  sub: ACTION_TYPES.SUB_IN,
  in: ACTION_TYPES.SUB_IN,
};

/**
 * Helper to parse a number from one or two words.
 */
const parseNumberAt = (
  words: string[],
  index: number,
): { value: string; consumed: number } | null => {
  if (index >= words.length) return null;

  const first = words[index];
  if (!isNaN(parseInt(first))) return { value: first, consumed: 1 };

  if (NUMBER_MAP[first]) {
    const tens = parseInt(NUMBER_MAP[first]);
    if (
      tens >= 20 &&
      words[index + 1] &&
      NUMBER_MAP[words[index + 1]] &&
      parseInt(NUMBER_MAP[words[index + 1]]) < 10
    ) {
      return {
        value: (tens + parseInt(NUMBER_MAP[words[index + 1]])).toString(),
        consumed: 2,
      };
    }
    return { value: NUMBER_MAP[first], consumed: 1 };
  }

  return null;
};

/**
 * Parses a voice transcript into a structured list of basketball actions.
 * Supports:
 * - "[Jersey] [Action] [Points]"
 * - "Opponent [Jersey] [Action]"
 * - Chained: "[Jersey] make [Points] assist [Jersey]"
 * - Chained: "[Jersey] miss rebound [Jersey]"
 */
export const parseVoiceCommand = (
  transcript: string,
): ParsedVoiceCommand | null => {
  const words = transcript.toLowerCase().trim().split(/\s+/);
  if (words.length < 2) return null;

  const actions: ParsedVoiceAction[] = [];
  let isOpponent = false;
  let currentJersey: string | undefined = undefined;

  let i = 0;
  while (i < words.length) {
    const word = words[i];

    if (word === "opponent") {
      isOpponent = true;
      i++;
      continue;
    }

    // Try to parse jersey number
    const numResult = parseNumberAt(words, i);
    if (numResult && !ACTION_MAP[words[i]]) {
      // Don't consume if it's an action (some actions might be mistaken?)
      currentJersey = numResult.value;
      i += numResult.consumed;
      continue;
    }

    // Try to parse action
    const action = ACTION_MAP[word];
    if (action) {
      let points = 2;
      i++;

      // Handle Substitution patterns: "[Jersey] in for [Jersey]" or "[Jersey] sub [Jersey]"
      if (action === ACTION_TYPES.SUB_IN) {
        // Skip "for" if it exists (e.g., "12 in for 5" or "sub 12 for 5")
        if (words[i] === "for") i++;

        const nextNumResult = parseNumberAt(words, i);
        if (nextNumResult) {
          const incoming = currentJersey;
          const outgoing = nextNumResult.value;

          if (incoming && outgoing) {
            actions.push({
              jerseyNumber: incoming,
              action: ACTION_TYPES.SUB_IN,
              isOpponent,
            });
            actions.push({
              jerseyNumber: outgoing,
              action: ACTION_TYPES.SUB_OUT,
              isOpponent,
            });
            i += nextNumResult.consumed;
            continue;
          } else if (!incoming && outgoing) {
            // "sub [Jersey] for [Jersey]" case
            i += nextNumResult.consumed;
            if (words[i] === "for") i++;
            const secondNumResult = parseNumberAt(words, i);
            if (secondNumResult) {
              actions.push({
                jerseyNumber: outgoing,
                action: ACTION_TYPES.SUB_IN,
                isOpponent,
              });
              actions.push({
                jerseyNumber: secondNumResult.value,
                action: ACTION_TYPES.SUB_OUT,
                isOpponent,
              });
              i += secondNumResult.consumed;
              continue;
            }
          }
        }
      }

      // If it's a make, look for points
      if (action === ACTION_TYPES.MAKE) {
        const ptsResult = parseNumberAt(words, i);
        if (ptsResult) {
          points = parseInt(ptsResult.value);
          i += ptsResult.consumed;
        }
      }

      // Check if another jersey follows immediately (for chained actions like "assist five")
      let secondaryJersey = undefined;
      const secNumResult = parseNumberAt(words, i);
      if (secNumResult) {
        secondaryJersey = secNumResult.value;
        i += secNumResult.consumed;
      }

      actions.push({
        jerseyNumber: secondaryJersey || currentJersey,
        action,
        points: action === ACTION_TYPES.MAKE ? points : undefined,
        isOpponent,
      });
      continue;
    }

    i++;
  }

  if (actions.length === 0) return null;

  return {
    actions,
    raw: transcript,
  };
};
