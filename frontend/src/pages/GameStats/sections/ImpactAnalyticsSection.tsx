import React from "react";
import { Grid } from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import StatTable, { type StatTableColumn } from "../../../components/StatTable";
import { OnOffImpactTable } from "../../../components/OnOffImpactTable";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { type Player } from "../../db";

interface ImpactAnalyticsSectionProps {
  onOffStats: GameAggregates["onOffStats"];
  matchupStats: GameAggregates["matchupStats"];
  players: Player[];
}

export const ImpactAnalyticsSection: React.FC<ImpactAnalyticsSectionProps> = ({
  onOffStats,
  matchupStats,
}) => {
  const matchupColumns: StatTableColumn<(typeof matchupStats)[0]>[] = [
    {
      key: "opponentJersey",
      label: "Opponent",
      format: (val) => `Opponent #${val}`,
    },
    { key: "defenderName", label: "Primary Defender" },
    { key: "pointsAllowed", label: "PTS Allowed", align: "right" },
    { key: "stops", label: "Stops", align: "right" },
    {
      key: "stopPct",
      label: "Stop %",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <SectionCard title="Team Impact Analytics (On/Off)">
          <OnOffImpactTable data={onOffStats} />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <SectionCard title="Matchup Accountability (Points Allowed)">
          <StatTable
            rows={matchupStats}
            columns={matchupColumns}
            emptyMessage="No matchup data recorded."
          />
        </SectionCard>
      </Grid>
    </>
  );
};
