import React from "react";
import { Grid } from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import KpiStat from "../../../components/KpiStat";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface DefensiveMetricsCardProps {
  defensiveStats: GameAggregates["defensiveStats"];
}

export const DefensiveMetricsCard: React.FC<DefensiveMetricsCardProps> = ({
  defensiveStats,
}) => {
  return (
    <SectionCard title="Defensive Metrics">
      <Grid container spacing="var(--cs-semantic-spacing-lg)">
        <Grid size={{ xs: 4 }}>
          <KpiStat
            label="TOTAL STOPS"
            value={defensiveStats.totalStops}
            valueColor="var(--cs-semantic-color-brand-primary-main)"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <KpiStat
            label="KILLS (3x STOPS)"
            value={defensiveStats.totalKills}
            valueColor="var(--cs-semantic-color-brand-secondary-main)"
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
