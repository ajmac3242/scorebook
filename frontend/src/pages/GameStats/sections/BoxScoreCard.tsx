import React from "react";
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

  return (
    <SectionCard
      title={`Box Score ${
        filters.periodFilter !== "ALL"
          ? `(${periodLabel} ${filters.periodFilter})`
          : ""
      }`}
      onExpand={onExpand}
    >
      <BoxScoreSection
        playerAggregates={aggregates.playerAggregates}
        teamData={aggregates.teamData}
        oppData={aggregates.oppData}
        sortConfig={filters.sortConfig}
        handleSort={filters.handleSort}
      />
    </SectionCard>
  );
};
