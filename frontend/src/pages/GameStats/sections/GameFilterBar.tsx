import React, { useMemo } from "react";
import {
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
        mb: "var(--cs-semantic-spacing-xl)",
        mt: "var(--cs-semantic-spacing-lg)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--cs-semantic-spacing-md)",
      }}
    >
      <Stack
        direction="row"
        spacing="var(--cs-semantic-spacing-md)"
        sx={{ alignItems: "center" }}
      >
        <ToggleButtonGroup
          value={filters.activeTab}
          exclusive
          onChange={(_, val) => val && filters.setActiveTab(val)}
          size="small"
          color="primary"
        >
          <ToggleButton value="standard" sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}>Standard</ToggleButton>
          <ToggleButton value="impact" sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}>Impact (On/Off)</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={filters.periodFilter}
          exclusive
          onChange={(_, val) => val && filters.setPeriodFilter(val)}
          size="small"
          fullWidth={Boolean(isMobile)}
          sx={{ flexGrow: isMobile ? 1 : 0 }}
        >
          {periods.map((p) => (
            <ToggleButton key={p} value={p} sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}>
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
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          fontSize: "var(--cs-typography-fontSize-xs)",
          px: "var(--cs-semantic-spacing-lg)",
          bgcolor: filters.clutchFilter
            ? "var(--cs-semantic-color-emphasis-clutch)"
            : "transparent",
          color: filters.clutchFilter
            ? "var(--cs-semantic-color-text-inverse)"
            : "var(--cs-semantic-color-emphasis-clutch)",
          borderColor: "var(--cs-semantic-color-emphasis-clutch)",
          "&:hover": {
            bgcolor: filters.clutchFilter
              ? "var(--cs-semantic-color-emphasis-clutch)"
              : "var(--cs-semantic-color-action-hover)",
            borderColor: "var(--cs-semantic-color-emphasis-clutch)",
          },
          "&.Mui-selected": {
            bgcolor: "var(--cs-semantic-color-emphasis-clutch)",
            color: "var(--cs-semantic-color-text-inverse)",
            "&:hover": {
              bgcolor: "var(--cs-semantic-color-emphasis-clutch)",
            },
          },
        }}
      >
        🔥 CLUTCH MODE
      </ToggleButton>
    </Box>
  );
};
