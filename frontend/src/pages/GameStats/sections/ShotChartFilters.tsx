import React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ACTION_TYPES,
  SHOT_QUALITY,
  BREAKDOWN_REASONS,
} from "../../../constants/stats";
import { useTokens } from "../../../theme";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

interface ShotChartFiltersProps {
  filters: GameFilters;
  rawData: GameData;
}

export const ShotChartFilters: React.FC<ShotChartFiltersProps> = ({
  filters,
  rawData,
}) => {
  const tokens = useTokens();
  const { team, players } = rawData;

  return (
    <Box sx={{ mb: `${tokens.semantic.spacing.md}px` }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: `${tokens.semantic.spacing.xs}px`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontSize: tokens.typography.fontSize.sm }}
        >
          Filters
        </Typography>
        <Stack direction="row" spacing={`${tokens.semantic.spacing.xs}px`}>
          <Button
            size="small"
            variant={filters.compareMode ? "contained" : "outlined"}
            onClick={() => filters.setCompareMode(!filters.compareMode)}
            aria-label="Toggle compare mode"
            sx={{ fontSize: tokens.typography.fontSize.xs }}
          >
            Compare
          </Button>
          <ToggleButtonGroup
            value={filters.shotChartView}
            exclusive
            onChange={(_, val) => val && filters.setShotChartView(val)}
            size="small"
            aria-label="Shot chart visualization mode"
          >
            <ToggleButton
              value="markers"
              aria-label="Display shot markers"
              sx={{ fontSize: tokens.typography.fontSize.xs }}
            >
              Markers
            </ToggleButton>
            <ToggleButton
              value="heatmap"
              aria-label="Display shot heatmap"
              sx={{ fontSize: tokens.typography.fontSize.xs }}
            >
              Heatmap
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={`${tokens.semantic.spacing.md}px`}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="player-filter-label">Player</InputLabel>
          <Select
            labelId="player-filter-label"
            value={filters.selectedPlayerId}
            label="Player"
            onChange={(e) => filters.setSelectedPlayerId(e.target.value)}
          >
            <MenuItem value="ALL">All Players</MenuItem>
            {players.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="type-filter-label">Type</InputLabel>
          <Select
            labelId="type-filter-label"
            value={filters.selectedType}
            label="Type"
            onChange={(e) => filters.setSelectedType(e.target.value)}
          >
            <MenuItem value="ALL">All Shots</MenuItem>
            <MenuItem value={ACTION_TYPES.MAKE}>Makes</MenuItem>
            <MenuItem value={ACTION_TYPES.MISS}>Misses</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="quality-filter-label">Quality</InputLabel>
          <Select
            labelId="quality-filter-label"
            value={filters.selectedQuality}
            label="Quality"
            onChange={(e) => filters.setSelectedQuality(e.target.value)}
          >
            <MenuItem value="ALL">All Qualities</MenuItem>
            <MenuItem value={SHOT_QUALITY.OPEN}>Open</MenuItem>
            <MenuItem value={SHOT_QUALITY.CONTESTED}>Contested</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="breakdown-filter-label">Breakdown</InputLabel>
          <Select
            labelId="breakdown-filter-label"
            value={filters.selectedBreakdown}
            label="Breakdown"
            onChange={(e) => filters.setSelectedBreakdown(e.target.value)}
          >
            <MenuItem value="ALL">All Breakdowns</MenuItem>
            {Object.values(BREAKDOWN_REASONS).map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {team?.playbook && team.playbook.length > 0 && (
          <FormControl fullWidth size="small">
            <InputLabel id="play-filter-label">Play</InputLabel>
            <Select
              labelId="play-filter-label"
              value={filters.selectedPlay}
              label="Play"
              onChange={(e) => filters.setSelectedPlay(e.target.value)}
            >
              <MenuItem value="ALL">All Plays</MenuItem>
              {team.playbook.map((play) => (
                <MenuItem key={play} value={play}>
                  {play}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Box>
  );
};
