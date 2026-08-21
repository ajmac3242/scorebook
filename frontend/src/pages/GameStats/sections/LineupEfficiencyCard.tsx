import React from "react";
import { Stack, Avatar, Button } from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import StatTable, {
  type StatTableColumn,
} from "../../../components/data-display/StatTable";
import { useTokens } from "../../../theme";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface LineupEfficiencyCardProps {
  aggregates: GameAggregates;
  onExpand: () => void;
  onAuditOpen: () => void;
}

export const LineupEfficiencyCard: React.FC<LineupEfficiencyCardProps> = ({
  aggregates,
  onExpand,
  onAuditOpen,
}) => {
  const tokens = useTokens();

  const columns: StatTableColumn<(typeof aggregates.lineupStats)[0]>[] = [
    {
      key: "lineup",
      label: "Lineup",
      format: (val) => (
        <Stack direction="row" spacing={`${tokens.semantic.spacing.xs}px`}>
          {(val as string[]).map((pId) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: tokens.typography.fontSize.xs,
              }}
            >
              {aggregates.shotChartJerseyMap.get(pId) ?? "??"}
            </Avatar>
          ))}
        </Stack>
      ),
    },
    {
      key: "seconds",
      label: "MIN",
      align: "right",
      format: (val) => (Number(val) / 60).toFixed(1),
    },
    { key: "pointsFor", label: "PTS FOR", align: "right" },
    { key: "pointsAgainst", label: "PTS AGN", align: "right" },
    { key: "netRatingPer40", label: "NET/40", align: "right" },
    {
      key: "netRating",
      label: "+/-",
      align: "right",
      color: (val) =>
        Number(val) > 0
          ? tokens.semantic.color.feedback.success.main
          : Number(val) < 0
            ? tokens.semantic.color.feedback.error.main
            : undefined,
      format: (val) => (Number(val) > 0 ? `+${val}` : val),
    },
  ];

  return (
    <SectionCard
      title="Lineup Efficiency"
      onExpand={onExpand}
      actions={
        <Button
          size="small"
          onClick={onAuditOpen}
          aria-label="Audit substitutions"
          sx={{ fontSize: tokens.typography.fontSize.xs }}
        >
          Audit Subs
        </Button>
      }
    >
      <StatTable rows={aggregates.lineupStats} columns={columns} />
    </SectionCard>
  );
};
