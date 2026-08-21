import React from "react";
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import BasketballCourt from "../../../components/game/BasketballCourt";
import { ShotChartFilters } from "./ShotChartFilters";
import { useTokens } from "../../../theme";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { type GameData } from "../hooks/useGameData";
import { type GameFilters } from "../hooks/useGameFilters";

interface ShotChartCardProps {
  aggregates: GameAggregates;
  rawData: GameData;
  filters: GameFilters;
  onExpand: () => void;
}

export const ShotChartCard: React.FC<ShotChartCardProps> = ({
  aggregates,
  rawData,
  filters,
  onExpand,
}) => {
  const tokens = useTokens();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { team, allStats } = rawData;
  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";

  const maxPeriod = team?.periodType === "HALVES" ? 2 : 4;
  const periods = ["ALL"];
  for (let i = 1; i <= maxPeriod; i++) periods.push(i.toString());
  const otPeriodsSet = new Set<number>();
  for (let i = 0; i < allStats.length; i++) {
    const p = allStats[i].period;
    if (p > maxPeriod) otPeriodsSet.add(p);
  }
  Array.from(otPeriodsSet)
    .sort((a, b) => a - b)
    .forEach((p) => periods.push(p.toString()));

  return (
    <SectionCard
      title={`${filters.compareMode ? "Tactical Comparison" : "Shot Chart"} ${
        !filters.compareMode && filters.periodFilter !== "ALL"
          ? `(${periodLabel} ${filters.periodFilter})`
          : ""
      }`}
      onExpand={onExpand}
    >
      <ShotChartFilters filters={filters} rawData={rawData} />

      {filters.compareMode ? (
        <Box
          sx={{
            display: "flex",
            gap: `${tokens.semantic.spacing.md}px`,
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            pb: `${tokens.semantic.spacing.xs}px`,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            {
              id: 1,
              p: filters.comparePeriod1,
              setP: filters.setComparePeriod1,
              data: aggregates.heatmapData1,
            },
            {
              id: 2,
              p: filters.comparePeriod2,
              setP: filters.setComparePeriod2,
              data: aggregates.heatmapData2,
            },
          ].map((court) => (
            <Box
              key={court.id}
              sx={{
                minWidth: isMobile
                  ? "100%"
                  : `calc(50% - ${tokens.semantic.spacing.sm}px)`,
                scrollSnapAlign: "start",
              }}
            >
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
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  {periodLabel} {court.p}
                </Typography>
                <Select
                  size="small"
                  value={court.p}
                  onChange={(e) => court.setP(e.target.value)}
                  inputProps={{
                    "aria-label": `Select ${periodLabel.toLowerCase()} for comparison panel ${court.id}`,
                  }}
                  sx={{
                    height: 30,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
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
                  filters.shotChartView === "heatmap" ? court.data : undefined
                }
                markers={
                  filters.shotChartView === "markers"
                    ? aggregates.shotChartMarkers.filter(
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
        <Box sx={{ p: `${tokens.semantic.spacing.xs}px` }}>
          <BasketballCourt
            markers={
              filters.shotChartView === "markers"
                ? aggregates.shotChartMarkers
                : []
            }
            heatmapData={
              filters.shotChartView === "heatmap"
                ? aggregates.heatmapData
                : undefined
            }
            onMarkerClick={(m) =>
              filters.setSelectedPlayerId(m.playerId || "ALL")
            }
          />
        </Box>
      )}

      {filters.compareMode && isMobile && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.semantic.color.text.secondary,
          }}
        >
          ← Swipe to compare →
        </Typography>
      )}
    </SectionCard>
  );
};
