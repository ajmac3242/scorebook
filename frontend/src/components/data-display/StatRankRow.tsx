import React from "react";
import { Box, Paper } from "@mui/material";
import { StatRankCard } from "./StatRankCard";
import { useTokens } from "../../theme/useTokens";

export interface StatRankKpi {
  label: string;
  statKey: string;
  formatValue?: (_value: number) => string;
}

interface StatRankRowProps {
  playerStats: Record<string, number>;
  rosterStats: Record<string, number>[];
  kpis: StatRankKpi[];
}

function computeRank(
  playerValue: number,
  allValues: number[],
): { rank: number; percentile: number } {
  const sorted = [...allValues]
    .filter((_value) => !isNaN(_value))
    .sort((a, b) => b - a);
  const rank = sorted.findIndex((value) => value <= playerValue) + 1;
  const max = sorted[0] ?? 1;
  return {
    rank: rank <= 0 ? 1 : rank,
    percentile: max === 0 ? 0 : Math.round((playerValue / max) * 100),
  };
}

export const StatRankRow: React.FC<StatRankRowProps> = ({
  playerStats,
  rosterStats,
  kpis,
}) => {
  const tokens = useTokens();

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        borderRadius: `${tokens.semantic.shape.radius.md}px`,
        overflow: "hidden",
        mb: tokens.semantic.spacing.xl / 8,
      }}
    >
      {kpis.map((kpi, i) => {
        const allValues = rosterStats.map((p) => Number(p[kpi.statKey] ?? 0));
        const playerValue = Number(playerStats[kpi.statKey] ?? 0);
        const { rank, percentile } = computeRank(playerValue, allValues);
        const displayValue = kpi.formatValue
          ? kpi.formatValue(playerValue)
          : playerValue;

        return (
          <Box
            key={kpi.statKey}
            sx={{
              flex: 1,
              minWidth: 100,
              borderRight:
                i < kpis.length - 1
                  ? `1px solid ${tokens.semantic.color.border.subtle}`
                  : "none",
            }}
          >
            <StatRankCard
              label={kpi.label}
              value={displayValue}
              rank={rank}
              total={Math.max(rosterStats.length, 1)}
              percentile={percentile}
            />
          </Box>
        );
      })}
    </Paper>
  );
};

export default StatRankRow;
