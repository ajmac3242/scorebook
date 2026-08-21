import React, { useMemo } from "react";
import {
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTokens } from "../../../theme";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

interface GameFilterBarProps {
  filters: GameFilters;
  rawData: GameData;
}

export const GameFilterBar: React.FC<GameFilterBarProps> = ({
  filters,
  rawData,
}) => {
  const tokens = useTokens();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { team, allStats } = rawData;

  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = team?.periodType === "HALVES" ? 2 : 4;

  const periods = useMemo(() => {
    const list = ["ALL"];
    for (let i = 1; i <= maxPeriod; i++) list.push(i.toString());

    const otPeriodsSet = new Set<number>();
    for (let i = 0; i < allStats.length; i++) {
      const p = allStats[i].period;
      if (p > maxPeriod) otPeriodsSet.add(p);
    }

    const otPeriods = Array.from(otPeriodsSet).sort((a, b) => a - b);
    for (let i = 0; i < otPeriods.length; i++) {
      list.push(otPeriods[i].toString());
    }

    return list;
  }, [maxPeriod, allStats]);

  return (
    <Box
      sx={{
        mb: `${tokens.semantic.spacing.xl}px`,
        mt: `${tokens.semantic.spacing.lg}px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: `${tokens.semantic.spacing.md}px`,
      }}
    >
      <Box sx={{ position: "absolute", width: 1, height: 1, padding: 0, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }} aria-live="polite">
        {`Filtered by ${filters.activeTab} stats, ${
          filters.periodFilter === "ALL" ? "Full Game" : `${periodLabel} ${filters.periodFilter}`
        }${filters.clutchFilter ? ", Clutch Mode Active" : ""}`}
      </Box>

      <Stack
        direction="row"
        spacing={`${tokens.semantic.spacing.md}px`}
        sx={{ alignItems: "center" }}
      >
        <ToggleButtonGroup
          value={filters.activeTab}
          exclusive
          onChange={(_, val) => val && filters.setActiveTab(val)}
          size="small"
          color="primary"
          aria-label="Stat view category"
        >
          <ToggleButton
            value="standard"
            sx={{ fontSize: tokens.typography.fontSize.xs }}
          >
            Standard
          </ToggleButton>
          <ToggleButton
            value="impact"
            sx={{ fontSize: tokens.typography.fontSize.xs }}
          >
            Impact (On/Off)
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={filters.periodFilter}
          exclusive
          onChange={(_, val) => val && filters.setPeriodFilter(val)}
          size="small"
          fullWidth={Boolean(isMobile)}
          aria-label="Game period filter"
          sx={{ flexGrow: isMobile ? 1 : 0 }}
        >
          {periods.map((p) => (
            <ToggleButton
              key={p}
              value={p}
              sx={{ fontSize: tokens.typography.fontSize.xs }}
            >
              {p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <ToggleButton
        value="clutch"
        selected={filters.clutchFilter}
        onChange={() => filters.setClutchFilter(!filters.clutchFilter)}
        size="small"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          fontSize: tokens.typography.fontSize.xs,
          px: `${tokens.semantic.spacing.lg}px`,
          bgcolor: filters.clutchFilter
            ? tokens.semantic.color.emphasis.clutch
            : "transparent",
          color: filters.clutchFilter
            ? tokens.semantic.color.text.inverse
            : tokens.semantic.color.emphasis.clutch,
          borderColor: tokens.semantic.color.emphasis.clutch,
          "&:hover": {
            bgcolor: filters.clutchFilter
              ? tokens.semantic.color.emphasis.clutch
              : tokens.semantic.color.action.hover,
            borderColor: tokens.semantic.color.emphasis.clutch,
          },
          "&.Mui-selected": {
            bgcolor: tokens.semantic.color.emphasis.clutch,
            color: tokens.semantic.color.text.inverse,
            "&:hover": {
              bgcolor: tokens.semantic.color.emphasis.clutch,
            },
          },
        }}
      >
        🔥 CLUTCH MODE
      </ToggleButton>
    </Box>
  );
};
