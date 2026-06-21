import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import ActionBar from "../../../components/layout/ActionBar";
import { useTokens } from "../../../theme/useTokens";
import type { Game, Team } from "../../../db";

export type GameWindow = "all" | "last10" | "last5" | "single";

type PlayerStatsFilterBarProps = {
  games: Game[];
  availableTeams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (_value: string | null) => void;
  selectedGameId: string | null;
  setSelectedGameId: (_value: string | null) => void;
  selectedGameWindow: GameWindow;
  setSelectedGameWindow: (_value: GameWindow) => void;
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
  const tokens = useTokens();

  const handleWindowChange = (value: GameWindow) => {
    setSelectedGameWindow(value);
    if (value !== "single") setSelectedGameId(null);
  };

  const filters = (
    <>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="ps-team-label">Team</InputLabel>
        <Select
          labelId="ps-team-label"
          value={selectedTeamId ?? "career"}
          label="Team"
          sx={{ borderRadius: `${tokens.semantic.component.radius.button}px` }}
          onChange={(e) =>
            setSelectedTeamId(
              e.target.value === "career" ? null : String(e.target.value),
            )
          }
        >
          <MenuItem value="career">Career</MenuItem>
          {availableTeams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="ps-games-label">Games</InputLabel>
        <Select
          labelId="ps-games-label"
          value={selectedGameWindow}
          label="Games"
          sx={{ borderRadius: `${tokens.semantic.component.radius.button}px` }}
          onChange={(e) => handleWindowChange(e.target.value as GameWindow)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="last10">Last 10</MenuItem>
          <MenuItem value="last5">Last 5</MenuItem>
          <MenuItem value="single">Specific game</MenuItem>
        </Select>
      </FormControl>

      {selectedGameWindow === "single" && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="ps-game-label">Game</InputLabel>
          <Select
            labelId="ps-game-label"
            value={selectedGameId ?? ""}
            label="Game"
            sx={{
              borderRadius: `${tokens.semantic.component.radius.button}px`,
            }}
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
    </>
  );

  return <ActionBar hideSearch hideAction filtersSlot={filters} />;
};

export default PlayerStatsFilterBar;
export type { GameWindow as PlayerGameWindow };
