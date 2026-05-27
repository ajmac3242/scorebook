import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";
import { MoleskineCard } from "../../components/SharedUI";
import BasketballCourt from "../../components/BasketballCourt";
import { ACTION_TYPES, SHOT_QUALITY, BREAKDOWN_REASONS } from "../../constants/stats";
import type { Player } from "../../db";

interface ShotChartSectionProps {
  players: Player[];
  playbook: string[];
  periodFilter: string;
  periodLabel: string;
  periods: string[];
  isMobile: boolean;
  selectedPlayerId: number | string;
  setSelectedPlayerId: (v: number | string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedQuality: string;
  setSelectedQuality: (v: string) => void;
  selectedBreakdown: string;
  setSelectedBreakdown: (v: string) => void;
  selectedPlay: string;
  setSelectedPlay: (v: string) => void;
  compareMode: boolean;
  setCompareMode: (v: boolean) => void;
  shotChartView: "markers" | "heatmap";
  setShotChartView: (v: "markers" | "heatmap") => void;
  comparePeriod1: string;
  setComparePeriod1: (v: string) => void;
  comparePeriod2: string;
  setComparePeriod2: (v: string) => void;
  shotChartMarkers: { id: string | undefined; x: number; y: number; type: "MAKE" | "MISS"; label: string | undefined; playerId: string }[];
  heatmapData: Record<string, { makes: number; attempts: number }>;
  heatmapData1: Record<string, { makes: number; attempts: number }>;
  heatmapData2: Record<string, { makes: number; attempts: number }>;
  allStats: { id: string | undefined; period: number }[];
  onExpand: () => void;
}

export const ShotChartSection = ({
  players,
  playbook,
  periodFilter,
  periodLabel,
  periods,
  isMobile,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedType,
  setSelectedType,
  selectedQuality,
  setSelectedQuality,
  selectedBreakdown,
  setSelectedBreakdown,
  selectedPlay,
  setSelectedPlay,
  compareMode,
  setCompareMode,
  shotChartView,
  setShotChartView,
  comparePeriod1,
  setComparePeriod1,
  comparePeriod2,
  setComparePeriod2,
  shotChartMarkers,
  heatmapData,
  heatmapData1,
  heatmapData2,
  allStats,
  onExpand,
}: ShotChartSectionProps) => {
  const filters = (
    <Box sx={{ mb: "var(--cs-semantic-spacing-md)" }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: "var(--cs-semantic-spacing-xs)" }}
      >
        <Typography variant="subtitle2">Filters</Typography>
        <Stack direction="row" spacing={"var(--cs-semantic-spacing-xs)"}>
          <Button
            size="small"
            variant={compareMode ? "contained" : "outlined"}
            onClick={() => setCompareMode(!compareMode)}
            sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
          >
            Compare
          </Button>
          <ToggleButtonGroup value={shotChartView} exclusive onChange={(_, val) => val && setShotChartView(val)} size="small">
            <ToggleButton value="markers">Markers</ToggleButton>
            <ToggleButton value="heatmap">Heatmap</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={"var(--cs-semantic-spacing-md)"}>
        <FormControl fullWidth size="small">
          <InputLabel>Player</InputLabel>
          <Select value={selectedPlayerId} label="Player" onChange={(e) => setSelectedPlayerId(e.target.value)}>
            <MenuItem value="ALL">All Players</MenuItem>
            {players.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
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
        <FormControl fullWidth size="small">
          <InputLabel>Quality</InputLabel>
          <Select value={selectedQuality} label="Quality" onChange={(e) => setSelectedQuality(e.target.value)}>
            <MenuItem value="ALL">All Qualities</MenuItem>
            <MenuItem value={SHOT_QUALITY.OPEN}>Open</MenuItem>
            <MenuItem value={SHOT_QUALITY.CONTESTED}>Contested</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Breakdown</InputLabel>
          <Select value={selectedBreakdown} label="Breakdown" onChange={(e) => setSelectedBreakdown(e.target.value)}>
            <MenuItem value="ALL">All Breakdowns</MenuItem>
            {Object.values(BREAKDOWN_REASONS).map((reason) => (
              <MenuItem key={reason} value={reason}>{reason}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {playbook.length > 0 && (
          <FormControl fullWidth size="small">
            <InputLabel>Play</InputLabel>
            <Select value={selectedPlay} label="Play" onChange={(e) => setSelectedPlay(e.target.value)}>
              <MenuItem value="ALL">All Plays</MenuItem>
              {playbook.map((play) => <MenuItem key={play} value={play}>{play}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Box>
  );

  const court = (
    <BasketballCourt
      markers={shotChartView === "markers" ? shotChartMarkers : []}
      heatmapData={shotChartView === "heatmap" ? heatmapData : undefined}
      onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
    />
  );

  return (
    <MoleskineCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "var(--cs-semantic-spacing-md)" }}>
        <Typography variant="h6" sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}>
          Shot Chart{" "}
          {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
        </Typography>
        <IconButton onClick={onExpand} aria-label="Expand Shot Chart section" title="Expand section">
          <ExpandIcon />
        </IconButton>
      </Box>
      {filters}
      {compareMode ? (
        <Box
          sx={{
            display: "flex",
            gap: "var(--cs-semantic-spacing-md)",
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            pb: "var(--cs-semantic-spacing-xs)",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            { id: 1, p: comparePeriod1, setP: setComparePeriod1, data: heatmapData1 },
            { id: 2, p: comparePeriod2, setP: setComparePeriod2, data: heatmapData2 },
          ].map((court_) => (
            <Box
              key={court_.id}
              sx={{
                minWidth: isMobile ? "100%" : "calc(50% - var(--cs-semantic-spacing-sm))",
                scrollSnapAlign: "start",
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {periodLabel} {court_.p}
                </Typography>
                <Select
                  size="small"
                  value={court_.p}
                  onChange={(e) => court_.setP(e.target.value)}
                  sx={{ height: 30, fontSize: "0.8rem" }}
                >
                  {periods.filter((p) => p !== "ALL").map((p) => (
                    <MenuItem key={p} value={p}>{periodLabel} {p}</MenuItem>
                  ))}
                </Select>
              </Stack>
              <BasketballCourt
                heatmapData={shotChartView === "heatmap" ? court_.data : undefined}
                markers={
                  shotChartView === "markers"
                    ? shotChartMarkers.filter(
                        (m) => allStats.find((s) => s.id === m.id)?.period === parseInt(court_.p),
                      )
                    : []
                }
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 1 }}>{court}</Box>
      )}
      {compareMode && isMobile && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: "var(--cs-semantic-spacing-xs)" }}>
          ← Swipe to compare →
        </Typography>
      )}
    </MoleskineCard>
  );
};

export type ShotChartSectionFilters = Pick<ShotChartSectionProps,
  "selectedPlayerId" | "selectedType" | "selectedQuality" | "selectedBreakdown" | "selectedPlay"
>;
