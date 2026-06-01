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
  const { team, players } = rawData;
  return (
    <Box sx={{ mb: "var(--cs-semantic-spacing-md)" }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: "var(--cs-semantic-spacing-xs)",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontSize: "var(--cs-typography-fontSize-sm)" }}
        >
          Filters
        </Typography>
        <Stack direction="row" spacing="var(--cs-semantic-spacing-xs)">
          <Button
            size="small"
            variant={filters.compareMode ? "contained" : "outlined"}
            onClick={() => filters.setCompareMode(!filters.compareMode)}
            sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
          >
            Compare
          </Button>
          <ToggleButtonGroup
            value={filters.shotChartView}
            exclusive
            onChange={(_, val) => val && filters.setShotChartView(val)}
            size="small"
          >
            <ToggleButton
              value="markers"
              sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
            >
              Markers
            </ToggleButton>
            <ToggleButton
              value="heatmap"
              sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
            >
              Heatmap
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing="var(--cs-semantic-spacing-md)"
      >
        <FormControl fullWidth size="small">
          <InputLabel>Player</InputLabel>
          <Select
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
          <InputLabel>Type</InputLabel>
          <Select
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
          <InputLabel>Quality</InputLabel>
          <Select
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
          <InputLabel>Breakdown</InputLabel>
          <Select
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
            <InputLabel>Play</InputLabel>
            <Select
              value={filters.selectedPlay}
              label="Play"
              onChange={(e) => filters.setSelectedPlay(e.target.value)}
            >
              <MenuItem value="ALL">All Plays</MenuItem>
              {(team?.playbook ?? []).map((play) => (
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
