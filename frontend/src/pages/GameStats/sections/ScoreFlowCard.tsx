import React from "react";
import { Box } from "@mui/material";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
} from "recharts";
import SectionCard from "../../../components/layout/SectionCard";
import { ScoreFlowTooltip } from "./ScoreFlowTooltip";
import { useTokens } from "../../theme/useTokens";
import { ACTION_TYPES } from "../../constants/stats";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { type GameData } from "../hooks/useGameData";
import { type GameFilters } from "../hooks/useGameFilters";

interface ScoreFlowCardProps {
  aggregates: GameAggregates;
  rawData: GameData;
  filters: GameFilters;
  onExpand: () => void;
}

export const ScoreFlowCard: React.FC<ScoreFlowCardProps> = ({
  aggregates,
  rawData,
  filters,
  onExpand,
}) => {
  const tokens = useTokens();
  const { game, allStats, team } = rawData;
  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";

  const scoreFlowChart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={aggregates.scoreFlowData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" />
        <YAxis yAxisId="spread" orientation="left" />
        <YAxis
          yAxisId="ppp"
          orientation="right"
          domain={[0, 2]}
          label={{ value: "PPP", angle: -90, position: "insideRight" }}
        />
        <Tooltip
          content={
            <ScoreFlowTooltip
              shotChartJerseyMap={aggregates.shotChartJerseyMap}
            />
          }
        />
        <Legend />
        <ReferenceLine
          yAxisId="spread"
          y={0}
          stroke={tokens.semantic.color.text.tertiary}
          strokeWidth={2}
          label="Neutral"
        />

        <ReferenceArea
          yAxisId="spread"
          y1={0}
          y2={100}
          fill={tokens.semantic.color.brand.primary.main}
          fillOpacity={0.05}
        />
        <ReferenceArea
          yAxisId="spread"
          y1={-100}
          y2={0}
          fill={tokens.semantic.color.brand.secondary.main}
          fillOpacity={0.05}
        />

        {(() => {
          const lines = [];
          const periodLen = game?.periodLength || 10;
          const lastStat = allStats[allStats.length - 1];
          const totalTime = (lastStat?.period || 4) * periodLen;
          for (let m = periodLen; m < totalTime; m += periodLen) {
            lines.push(
              <ReferenceLine
                key={m}
                x={`${m}:00`}
                stroke={tokens.semantic.color.border.default}
                strokeDasharray="5 5"
                label={{ value: `P${m / periodLen + 1}`, position: "top" }}
              />,
            );
          }
          return lines;
        })()}

        {aggregates.scoreFlowData
          .filter((d) => d.event === ACTION_TYPES.TIMEOUT)
          .map((d, idx) => (
            <ReferenceLine
              key={`to-${idx}`}
              x={d.time}
              stroke={tokens.semantic.color.feedback.warning.main}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

        <Area
          yAxisId="spread"
          type="stepAfter"
          dataKey="Spread"
          stroke={tokens.semantic.color.brand.primary.main}
          fill={tokens.semantic.color.brand.primary.main}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Line
          yAxisId="ppp"
          type="monotone"
          dataKey="teamPpp"
          name="Team PPP"
          stroke={tokens.semantic.color.brand.primary.main}
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          yAxisId="ppp"
          type="monotone"
          dataKey="oppPpp"
          name="Opp PPP"
          stroke={tokens.semantic.color.brand.secondary.main}
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <SectionCard
      title={`Score Flow ${
        filters.periodFilter !== "ALL"
          ? `(${periodLabel} ${filters.periodFilter})`
          : ""
      }`}
      onExpand={onExpand}
    >
      <Box sx={{ height: 400 }}>{scoreFlowChart}</Box>
    </SectionCard>
  );
};
