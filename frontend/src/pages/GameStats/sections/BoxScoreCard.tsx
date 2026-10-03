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
  const cardTitle = `Box Score ${
    filters.periodFilter !== "ALL"
      ? `(${periodLabel} ${filters.periodFilter})`
      : ""
  }`;

  return (
    <SectionCard title={cardTitle} onExpand={onExpand}>
      <Box
        role="region"
        aria-label={`Box score section ${
          filters.periodFilter !== "ALL"
            ? `${periodLabel} ${filters.periodFilter}`
            : ""
        }`.trim()}
      >
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
