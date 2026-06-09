import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import type { Game, Team } from "../../../db";

type GameWindow = "all" | "last10" | "last5" | "single";

type PlayerStatsFilterBarProps = {
  games: Game[];
  availableTeams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (value: string | null) => void;
  selectedGameId: string | null;
  setSelectedGameId: (value: string | null) => void;
  selectedGameWindow: GameWindow;
  setSelectedGameWindow: (value: GameWindow) => void;
};

const PlayerStatsFilterBar: React.FC<PlayerStatsFilterBarProps> = ({
  games,
  availableTeams,
  selectedTeamId,
  setSelectedTeamId,
  selectedGameId,
  setSelectedGameId,
  selectedGameWindow,
  setSelectedGameWindow,
}) => {
  const handleWindowChange = (value: GameWindow) => {
    setSelectedGameWindow(value);
    if (value !== "single") {
      setSelectedGameId(null);
    }
  };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="player-team-filter-label">Team</InputLabel>
        <Select
          labelId="player-team-filter-label"
          value={selectedTeamId ?? "career"}
          label="Team"
          onChange={(e) => setSelectedTeamId(e.target.value === "career" ? null : String(e.target.value))}
        >
          <MenuItem value="career">Career</MenuItem>
          {availableTeams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="player-games-filter-label">Games</InputLabel>
        <Select
          labelId="player-games-filter-label"
          value={selectedGameWindow}
          label="Games"
          onChange={(e) => handleWindowChange(e.target.value as GameWindow)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="last10">Last 10</MenuItem>
          <MenuItem value="last5">Last 5</MenuItem>
          <MenuItem value="single">Specific game</MenuItem>
        </Select>
      </FormControl>

      {selectedGameWindow === "single" && (
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="player-game-picker-label">Game</InputLabel>
          <Select
            labelId="player-game-picker-label"
            value={selectedGameId ?? ""}
            label="Game"
            onChange={(e) => setSelectedGameId(String(e.target.value) || null)}
          >
            {games.map((game) => (
              <MenuItem key={game.id} value={game.id}>
                {game.opponent || "Opponent"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
};

export default PlayerStatsFilterBar;
export type { GameWindow };
