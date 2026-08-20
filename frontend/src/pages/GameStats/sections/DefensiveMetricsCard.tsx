import React from "react";
import { Grid } from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import KpiStat from "../../../components/data-display/KpiStat";
import { useTokens } from "../../../theme/useTokens";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface DefensiveMetricsCardProps {
  defensiveStats: GameAggregates["defensiveStats"];
}

export const DefensiveMetricsCard: React.FC<DefensiveMetricsCardProps> = ({
  defensiveStats,
}) => {
  const tokens = useTokens();

  return (
    <SectionCard title="Defensive Metrics">
      <Grid container spacing={tokens.semantic.spacing.lg / 8}>
        <Grid size={{ xs: 4 }}>
          <KpiStat
            label="TOTAL STOPS"
            value={defensiveStats.totalStops}
            valueColor={tokens.semantic.color.brand.primary.main}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <KpiStat
            label="KILLS (3x STOPS)"
            value={defensiveStats.totalKills}
            valueColor={tokens.semantic.color.brand.secondary.main}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <KpiStat
            label="CURRENT STOP STREAK"
            value={defensiveStats.currentStreak}
          />
        </Grid>
      </Grid>
    </SectionCard>
  );
};
