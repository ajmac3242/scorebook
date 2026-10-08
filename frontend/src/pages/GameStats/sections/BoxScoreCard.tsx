import React from "react";
import { Box } from "@mui/material";
import { BoxScoreSection } from "../BoxScoreSection";
import SectionCard from "../../../components/layout/SectionCard";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

interface BoxScoreCardProps {
  aggregates: GameAggregates;
  filters: GameFilters;
  rawData: GameData;
  onExpand: () => void;
}

export const BoxScoreCard: React.FC<BoxScoreCardProps> = ({
  aggregates,
  filters,
  rawData,
  onExpand,
}) => {
  const { team } = rawData;
  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
  const cardTitle =
    filters.periodFilter !== "ALL"
      ? `Box Score (${periodLabel} ${filters.periodFilter})`
      : "Box Score";
  const sectionLabel =
    filters.periodFilter !== "ALL"
      ? `Box score section ${periodLabel} ${filters.periodFilter}`
      : "Box score section";

  return (
    <SectionCard title={cardTitle} onExpand={onExpand}>
      <Box role="region" aria-label={sectionLabel}>
        <BoxScoreSection
          playerAggregates={aggregates.playerAggregates}
          teamData={aggregates.teamData}
          oppData={aggregates.oppData}
          sortConfig={filters.sortConfig}
          handleSort={filters.handleSort}
        />
      </Box>
    </SectionCard>
  );
};
