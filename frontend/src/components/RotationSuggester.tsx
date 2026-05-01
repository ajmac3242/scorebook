import React, { useMemo } from "react";
import { Typography, Stack, Button } from "@mui/material";
import { Groups } from "@mui/icons-material";
import { Player, TeamPlayer } from "../db";
import { PlayerAggregates } from "../utils/stats";
import { MoleskineCard } from "./SharedUI";

interface RotationSuggesterProps {
  players: Player[];
  teamPlayers: TeamPlayer[];
  gameData: { onCourtIds: Set<string> };
  statsGridData: PlayerAggregates[];
  period: number;
  maxPeriod: number;
  periodLength: number;
  clockSeconds: number;
  onSelectPlayer: (_id: string) => void;
}

export const RotationSuggester: React.FC<RotationSuggesterProps> = ({
  players,
  teamPlayers,
  gameData,
  statsGridData,
  period,
  maxPeriod,
  periodLength,
  clockSeconds,
  onSelectPlayer,
}) => {
  const suggestions = useMemo(() => {
    const totalGameMins = maxPeriod * periodLength;
    const elapsedMins = Math.max(
      0.1,
      (period - 1) * periodLength + (periodLength - clockSeconds / 60),
    );
    const gameProgress = Math.min(1, elapsedMins / totalGameMins);

    const playersMap = new Map(players.map((p) => [p.id?.toString(), p]));
    const statsMap = new Map(statsGridData.map((s) => [s.id.toString(), s]));

    const roster = teamPlayers.map((tp) => {
      const p = playersMap.get(tp.playerId);
      const gameStats = statsMap.get(tp.playerId);
      const actualMins = gameStats?.min || 0;
      const targetMins = tp.targetMinutes || 0;
      const expectedMins = targetMins * gameProgress;

      return {
        id: tp.playerId,
        name: p?.name || "Unknown",
        target: targetMins,
        actual: actualMins,
        diff: expectedMins - actualMins,
        isOn: gameData.onCourtIds.has(tp.playerId),
        isFoulTrouble: (gameStats?.fouls || 0) >= 4,
      };
    });

    return roster
      .filter((p) => !p.isOn && p.target > 0 && p.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3);
  }, [
    players,
    teamPlayers,
    gameData,
    statsGridData,
    period,
    maxPeriod,
    periodLength,
    clockSeconds,
  ]);

  if (suggestions.length === 0) return null;

  return (
    <MoleskineCard sx={{ border: "1px solid #FFD700" }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Groups sx={{ fontSize: 18 }} /> ROTATION SUGGESTER
      </Typography>
      <Stack spacing={1}>
        {suggestions.map((p) => (
          <Button
            key={p.id}
            variant="outlined"
            size="small"
            onClick={() => onSelectPlayer(p.id)}
            sx={{ justifyContent: "space-between", textTransform: "none" }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {p.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Target: {p.target}m
            </Typography>
          </Button>
        ))}
      </Stack>
    </MoleskineCard>
  );
};
