import { ACTION_TYPES } from "../constants/stats";

export interface ParsedVoiceCommand {
  jerseyNumber?: string;
  action: string;
  points?: number;
  isOpponent: boolean;
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
};

/**
 * Parses a voice transcript into a structured basketball action.
 * Supports: "[Jersey] [Action] [Points]" or "Opponent [Jersey] [Action]"
 */
export const parseVoiceCommand = (transcript: string): ParsedVoiceCommand | null => {
  const words = transcript.toLowerCase().trim().split(/\s+/);
  if (words.length < 2) return null;

  let isOpponent = false;
  let wordIndex = 0;

  if (words[0] === "opponent") {
    isOpponent = true;
    wordIndex++;
  }

  // Handle complex numbers like "twenty three"
  let jerseyNumber = "";
  if (NUMBER_MAP[words[wordIndex]]) {
    if (words[wordIndex + 1] && NUMBER_MAP[words[wordIndex + 1]] && parseInt(NUMBER_MAP[words[wordIndex + 1]]) < 10) {
        // Handle "twenty three"
        const tens = parseInt(NUMBER_MAP[words[wordIndex]]);
        const ones = parseInt(NUMBER_MAP[words[wordIndex + 1]]);
        jerseyNumber = (tens + ones).toString();
        wordIndex += 2;
    } else {
        jerseyNumber = NUMBER_MAP[words[wordIndex]];
        wordIndex++;
    }
  } else if (!isNaN(parseInt(words[wordIndex]))) {
    jerseyNumber = words[wordIndex];
    wordIndex++;
  }

  const actionWord = words[wordIndex];
  const action = ACTION_MAP[actionWord];

  if (!action) return null;

  let points = 2;
  if (action === ACTION_TYPES.MAKE) {
    const nextWord = words[wordIndex + 1];
    if (nextWord && NUMBER_MAP[nextWord]) {
      points = parseInt(NUMBER_MAP[nextWord]);
    } else if (nextWord && !isNaN(parseInt(nextWord))) {
      points = parseInt(nextWord);
    }
  }

  return {
    jerseyNumber,
    action,
    points,
    isOpponent,
    raw: transcript,
  };
};
