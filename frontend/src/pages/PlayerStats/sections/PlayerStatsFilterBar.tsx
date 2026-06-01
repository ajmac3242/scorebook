import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  alpha,
} from "@mui/material";
import { LocalFireDepartment as FireIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";
import { type Game } from "../../../db";

type PlayerStatsFilterBarProps = {
  games: Game[];
  selectedGameId: string;
  setSelectedGameId: (_id: string) => void;
  actionTypes: string[];
  selectedType: string;
  setSelectedType: (_type: string) => void;
  clutchFilter: boolean;
  setClutchFilter: React.Dispatch<React.SetStateAction<boolean>>;
  selectedGame: Game | undefined;
  accent: string;
};

const PlayerStatsFilterBar: React.FC<PlayerStatsFilterBarProps> = ({
  games,
  selectedGameId,
  setSelectedGameId,
  actionTypes,
  selectedType,
  setSelectedType,
  clutchFilter,
  setClutchFilter,
  selectedGame,
  accent,
}) => {
  const tokens = useTokens();

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        mx: { xs: -2, sm: -3 },
        mt: { xs: -2, sm: -3 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", xl: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ flex: 1 }}
          >
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="player-game-filter-label">Game</InputLabel>
              <Select
                labelId="player-game-filter-label"
                value={selectedGameId}
                label="Game"
                onChange={(e) => setSelectedGameId(e.target.value)}
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                }}
              >
                <MenuItem value="">All Games</MenuItem>
                {games.map((game) => (
                  <MenuItem key={game.id} value={game.id}>
                    {game.opponent || game.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="player-action-filter-label">Action Type</InputLabel>
              <Select
                labelId="player-action-filter-label"
                value={selectedType}
                label="Action Type"
                onChange={(e) => setSelectedType(e.target.value)}
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                }}
              >
                <MenuItem value="">All Actions</MenuItem>
                {actionTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Button
              variant={clutchFilter ? "contained" : "outlined"}
              onClick={() => setClutchFilter((prev) => !prev)}
              startIcon={<FireIcon />}
              sx={{
                borderRadius: tokens.semantic.component.radius.button,
                boxShadow: "none",
              }}
            >
              Clutch
            </Button>
          </Stack>
        </Stack>

        {selectedGame && (
          <Chip
            label={`Selected game: ${selectedGame.opponent || selectedGame.id}`}
            size="small"
            sx={{
              alignSelf: "flex-start",
              borderRadius: tokens.semantic.component.radius.button,
              bgcolor: alpha(accent, 0.12),
              border: "1px solid",
              borderColor: alpha(accent, 0.3),
            }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default PlayerStatsFilterBar;
