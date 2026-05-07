import React from "react";
import { Box, Stack, Typography, Button, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { ACTION_TYPES } from "../constants/stats";
import BasketballCourt from "./BasketballCourt";
import { MoleskineCard } from "./SharedUI";
import { Player } from "../types/player";

interface ShotChartSectionProps {
  compareMode: boolean;
  setCompareMode: (val: boolean) => void;
  shotChartView: "markers" | "heatmap";
  setShotChartView: (val: "markers" | "heatmap") => void;
  selectedPlayerId: string | number;
  setSelectedPlayerId: (val: string | number) => void;
  players: Player[];
  selectedType: string;
  setSelectedType: (val: string) => void;
  selectedQuality: string;
  setSelectedQuality: (val: string) => void;
  selectedPlay: string;
  setSelectedPlay: (val: string) => void;
  playbook?: string[];
  shotChartMarkers: any[];
  heatmapData: any;
  onMarkerClick: (m: any) => void;
  periodLabel: string;
}

export const ShotChartSection: React.FC<ShotChartSectionProps> = ({
  compareMode, setCompareMode, shotChartView, setShotChartView,
  selectedPlayerId, setSelectedPlayerId, players,
  selectedType, setSelectedType, selectedQuality, setSelectedQuality,
  selectedPlay, setSelectedPlay, playbook,
  shotChartMarkers, heatmapData, onMarkerClick, periodLabel
}) => {
  return (
    <MoleskineCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
          {compareMode ? "Tactical Comparison" : "Shot Chart"}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2">Filters</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant={compareMode ? "contained" : "outlined"} onClick={() => setCompareMode(!compareMode)} sx={{ fontSize: "0.7rem" }}>Compare</Button>
            <ToggleButtonGroup value={shotChartView} exclusive onChange={(_, val) => val && setShotChartView(val)} size="small">
              <ToggleButton value="markers">Markers</ToggleButton>
              <ToggleButton value="heatmap">Heatmap</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Player</InputLabel>
            <Select value={selectedPlayerId} label="Player" onChange={(e) => setSelectedPlayerId(e.target.value)}>
              <MenuItem value="ALL">All Players</MenuItem>
              {players.map((p) => (<MenuItem key={p.id} value={p.id!}>{p.name}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select value={selectedType} label="Type" onChange={(e) => setSelectedType(e.target.value)}>
              <MenuItem value="ALL">All Shots</MenuItem>
              <MenuItem value={ACTION_TYPES.MAKE}>Makes</MenuItem>
              <MenuItem value={ACTION_TYPES.MISS}>Misses</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
      <Box sx={{ p: 1 }}>
        <BasketballCourt
          markers={shotChartView === "markers" ? shotChartMarkers : []}
          heatmapData={shotChartView === "heatmap" ? heatmapData : undefined}
          onMarkerClick={onMarkerClick}
        />
      </Box>
    </MoleskineCard>
  );
};

export default ShotChartSection;
