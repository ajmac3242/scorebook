import React from "react";
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import BasketballCourt from "../../components/BasketballCourt";
import { ACTION_TYPES, SHOT_QUALITY } from "../../constants/stats";

interface StatsVisualizationsProps {
  compareMode: boolean;
  setCompareMode: (_mode: boolean) => void;
  shotChartView: "markers" | "heatmap";
  setShotChartView: (_view: "markers" | "heatmap") => void;
  selectedPlayerId: string | number;
  setSelectedPlayerId: (_id: string | number) => void;
  selectedType: string;
  setSelectedType: (_type: string) => void;
  selectedQuality: string;
  setSelectedQuality: (_quality: string) => void;
  selectedPlay: string;
  setSelectedPlay: (_play: string) => void;
  players: { id?: string | number; name: string }[];
  teamPlaybook: string[];
  periodLabel: string;
  periodFilter: string;
  shotChartMarkers: {
    id?: string;
    x: number;
    y: number;
    type: "MAKE" | "MISS";
    label?: string;
    playerId: string;
  }[];
  heatmapData?: Record<string, { makes: number; attempts: number }>;
  comparePeriod1: string;
  setComparePeriod1: (_p: string) => void;
  comparePeriod2: string;
  setComparePeriod2: (_p: string) => void;
  heatmapData1?: Record<string, { makes: number; attempts: number }>;
  heatmapData2?: Record<string, { makes: number; attempts: number }>;
  periods: string[];
  allStats: { id?: string; period: number }[];
  isMobile: boolean;
}

const StatsVisualizations: React.FC<StatsVisualizationsProps> = ({
  compareMode,
  setCompareMode,
  shotChartView,
  setShotChartView,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedType,
  setSelectedType,
  selectedQuality,
  setSelectedQuality,
  selectedPlay,
  setSelectedPlay,
  players,
  teamPlaybook,
  periodLabel,
  periodFilter,
  shotChartMarkers,
  heatmapData,
  comparePeriod1,
  setComparePeriod1,
  comparePeriod2,
  setComparePeriod2,
  heatmapData1,
  heatmapData2,
  periods,
  allStats,
  isMobile,
}) => {
  const shotChartFilters = (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="subtitle2">Filters</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={compareMode ? "contained" : "outlined"}
            onClick={() => setCompareMode(!compareMode)}
            sx={{ fontSize: "0.7rem" }}
          >
            Compare
          </Button>
          <ToggleButtonGroup
            value={shotChartView}
            exclusive
            onChange={(_, val) => val && setShotChartView(val)}
            size="small"
          >
            <ToggleButton value="markers">Markers</ToggleButton>
            <ToggleButton value="heatmap">Heatmap</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Player</InputLabel>
          <Select
            value={selectedPlayerId}
            label="Player"
            onChange={(e) => setSelectedPlayerId(e.target.value)}
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
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <MenuItem value="ALL">All Shots</MenuItem>
            <MenuItem value={ACTION_TYPES.MAKE}>Makes</MenuItem>
            <MenuItem value={ACTION_TYPES.MISS}>Misses</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Quality</InputLabel>
          <Select
            value={selectedQuality}
            label="Quality"
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            <MenuItem value="ALL">All Qualities</MenuItem>
            <MenuItem value={SHOT_QUALITY.OPEN}>Open</MenuItem>
            <MenuItem value={SHOT_QUALITY.CONTESTED}>Contested</MenuItem>
          </Select>
        </FormControl>
        {teamPlaybook && teamPlaybook.length > 0 && (
          <FormControl fullWidth size="small">
            <InputLabel>Play</InputLabel>
            <Select
              value={selectedPlay}
              label="Play"
              onChange={(e) => setSelectedPlay(e.target.value)}
            >
              <MenuItem value="ALL">All Plays</MenuItem>
              {teamPlaybook.map((play) => (
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

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
          {compareMode ? "Tactical Comparison" : "Shot Chart"}{" "}
          {!compareMode &&
            periodFilter !== "ALL" &&
            `(${periodLabel} ${periodFilter})`}
        </Typography>
      </Box>
      {shotChartFilters}

      {compareMode ? (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            pb: 1,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            {
              id: 1,
              p: comparePeriod1,
              setP: setComparePeriod1,
              data: heatmapData1,
            },
            {
              id: 2,
              p: comparePeriod2,
              setP: setComparePeriod2,
              data: heatmapData2,
            },
          ].map((court) => (
            <Box
              key={court.id}
              sx={{
                minWidth: isMobile ? "100%" : "calc(50% - 8px)",
                scrollSnapAlign: "start",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {periodLabel} {court.p}
                </Typography>
                <Select
                  size="small"
                  value={court.p}
                  onChange={(e) => court.setP(e.target.value)}
                  sx={{ height: 30, fontSize: "0.8rem" }}
                >
                  {periods
                    .filter((p) => p !== "ALL")
                    .map((p) => (
                      <MenuItem key={p} value={p}>
                        {periodLabel} {p}
                      </MenuItem>
                    ))}
                </Select>
              </Stack>
              <BasketballCourt
                heatmapData={
                  shotChartView === "heatmap" ? court.data : undefined
                }
                markers={
                  shotChartView === "markers"
                    ? shotChartMarkers.filter(
                        (m) =>
                          allStats.find((s) => s.id === m.id)?.period ===
                          parseInt(court.p),
                      )
                    : []
                }
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 1 }}>
          <BasketballCourt
            heatmapData={shotChartView === "heatmap" ? heatmapData : undefined}
            markers={shotChartView === "markers" ? shotChartMarkers : []}
            onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
          />
        </Box>
      )}

      {compareMode && isMobile && (
        <Typography
          variant="caption"
          display="block"
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          ← Swipe to compare →
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(StatsVisualizations);
