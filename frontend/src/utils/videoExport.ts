/**
 * @file videoExport.ts
 * @description Utility for exporting game stats to common video analysis platform formats (Hudl, Synergy).
 */

import { StatEvent, Player, Game } from "../db";
import { formatClock } from "./mathUtils";

/**
 * Maps StatEvent records to Hudl-compatible CSV structure.
 * Hudl format: Timestamp, Period, Player, Action, Result, Play
 */
export function generateHudlCSV(
  stats: StatEvent[],
  players: Player[],
  _game: Game | undefined,
): string {
  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const rows = [
    [
      "Timestamp",
      "Period",
      "Player",
      "Action",
      "Result",
      "Play",
      "Points",
    ].join(","),
  ];

  const sortedStats = [...stats].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    return (b.clockTime || 0) - (a.clockTime || 0);
  });

  for (const s of sortedStats) {
    if (s.deletedAt) continue;

    // Skip internal events
    if (
      ["SUB_IN", "SUB_OUT", "POSSESSION", "TIMEOUT", "MATCHUP"].includes(s.type)
    )
      continue;

    const playerName = playerMap.get(s.playerId) || s.playerId;
    const timestamp = formatClock(s.clockTime || 0);
    const result =
      s.type === "MAKE" ? "Made" : s.type === "MISS" ? "Missed" : "";
    const action =
      s.type === "MAKE" || s.type === "MISS"
        ? `${s.points || 2}PT Shot`
        : s.type;

    rows.push(
      [
        timestamp,
        s.period,
        `"${playerName}"`,
        `"${action}"`,
        `"${result}"`,
        `"${s.playName || ""}"`,
        s.points || 0,
      ].join(","),
    );
  }

  return rows.join("\n");
}

/**
 * Maps StatEvent records to Synergy-compatible CSV structure.
 */
export function generateSynergyCSV(
  stats: StatEvent[],
  players: Player[],
  _game: Game | undefined,
): string {
  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const rows = [
    [
      "Time",
      "Period",
      "Jersey",
      "Player",
      "Action",
      "Result",
      "Zone",
      "Quality",
    ].join(","),
  ];

  const sortedStats = [...stats].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    return (b.clockTime || 0) - (a.clockTime || 0);
  });

  for (const s of sortedStats) {
    if (s.deletedAt) continue;
    if (
      ["SUB_IN", "SUB_OUT", "POSSESSION", "TIMEOUT", "MATCHUP"].includes(s.type)
    )
      continue;

    const playerName = playerMap.get(s.playerId) || s.playerId;
    const time = formatClock(s.clockTime || 0);

    rows.push(
      [
        time,
        s.period,
        "", // Jersey placeholder
        `"${playerName}"`,
        `"${s.type}"`,
        s.type === "MAKE" ? "Success" : "Failure",
        "", // Zone placeholder
        `"${s.shotQuality || ""}"`,
      ].join(","),
    );
  }

  return rows.join("\n");
}

/**
 * Triggers a browser download of a CSV string.
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
