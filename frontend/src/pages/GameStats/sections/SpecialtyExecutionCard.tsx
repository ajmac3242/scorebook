import React from "react";
import SectionCard from "../../../components/layout/SectionCard";
import StatTable, { type StatTableColumn } from "../../../components/data-display/StatTable";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface SpecialtyExecutionCardProps {
  specialtyExecution: GameAggregates["specialtyExecution"];
}

export const SpecialtyExecutionCard: React.FC<SpecialtyExecutionCardProps> = ({
  specialtyExecution,
}) => {
  const columns: StatTableColumn<(typeof specialtyExecution)[0]>[] = [
    { key: "situation", label: "SITUATION" },
    { key: "ppp", label: "PPP", align: "right" },
    {
      key: "delta",
      label: "Δ",
      align: "right",
      color: (val) =>
        parseFloat(String(val)) > 0
          ? "var(--cs-semantic-color-feedback-success-main)"
          : parseFloat(String(val)) < 0
            ? "var(--cs-semantic-color-feedback-error-main)"
            : undefined,
      format: (val) => `${parseFloat(String(val)) > 0 ? "+" : ""}${val}`,
    },
    {
      key: "successRate",
      label: "SUCCESS %",
      align: "right",
      format: (val) => `${val}%`,
    },
    {
      key: "efg",
      label: "eFG%",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  return (
    <SectionCard title="Specialty Execution">
      <StatTable
        rows={specialtyExecution}
        columns={columns}
        emptyMessage="No situational plays recorded."
      />
    </SectionCard>
  );
};
