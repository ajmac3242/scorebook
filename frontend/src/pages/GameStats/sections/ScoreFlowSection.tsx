import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
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
import { OpenInFull as ExpandIcon } from "@mui/icons-material";
import { MoleskineCard } from "../../components/SharedUI";
import { useTokens } from "../../theme/useTokens";
import { ACTION_TYPES } from "../../constants/stats";
import type { ScoreFlowPoint } from "../../utils/stats";

interface ScoreFlowTooltipProps {
  active?: boolean;
  payload?: { payload: ScoreFlowPoint }[];
  label?: string;
  jerseyMap: Map<string, string>;
}

const ScoreFlowTooltip = ({
  active,
  payload,
  label,
  jerseyMap,
}: ScoreFlowTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: "var(--cs-semantic-color-background-paper)",
          p: "var(--cs-semantic-spacing-md)",
          border: "1px solid var(--cs-semantic-color-border-subtle)",
          boxShadow: "var(--cs-semantic-elevation-shadow-dialog)",
          borderRadius: "var(--cs-semantic-shape-radius-md)",
          minWidth: 200,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            mb: "var(--cs-semantic-spacing-xs)",
          }}
        >
          {label} - Spread: {data.Spread > 0 ? "+" : ""}
          {data.Spread}
        </Typography>
        {data.event && (
          <Chip
            label={data.event}
            size="small"
            color="primary"
            sx={{
              mb: "var(--cs-semantic-spacing-xs)",
              height: 20,
              fontSize: "var(--cs-typography-fontSize-xs)",
              fontWeight: "var(--cs-typography-fontWeight-bold)",
            }}
          />
        )}
        <Divider sx={{ my: 1 }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            display: "block",
            mb: "var(--cs-semantic-spacing-xs)",
          }}
        >
          ACTIVE LINEUP:
        </Typography>
        <Stack
          direction="row"
          spacing={"var(--cs-semantic-spacing-xs)"}
          sx={{ mb: "var(--cs-semantic-spacing-md)" }}
        >
          {data.lineup?.map((pId: string) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: "var(--cs-typography-fontSize-xs)",
                bgcolor: "var(--cs-semantic-color-surface-subtle)",
                color: "var(--cs-semantic-color-text-primary)",
                border: "1px solid var(--cs-semantic-color-border-subtle)",
              }}
            >
              {jerseyMap.get(pId) || "??"}
            </Avatar>
          ))}
          {(!data.lineup || data.lineup.length === 0) && (
            <Typography variant="caption" color="text.secondary">
              Unknown
            </Typography>
          )}
        </Stack>
        <Grid container spacing={"var(--cs-semantic-spacing-xs)"}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" sx={{ display: "block" }}>
              TEAM PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
            >
              {data.teamPpp || "0.00"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" sx={{ display: "block" }}>
              OPP PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
            >
              {data.oppPpp || "0.00"}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  }
  return null;
};

interface ScoreFlowSectionProps {
  scoreFlowData: ScoreFlowPoint[];
  jerseyMap: Map<string, string>;
  periodFilter: string;
  periodLabel: string;
  periodLength?: number;
  allStatsLength: number;
  maxPeriod: number;
  onExpand: () => void;
}

export const ScoreFlowSection = ({
  scoreFlowData,
  jerseyMap,
  periodFilter,
  periodLabel,
  periodLength,
  allStatsLength,
  maxPeriod,
  onExpand,
}: ScoreFlowSectionProps) => {
  const tokens = useTokens();
  const pLen = periodLength || 10;

  return (
    <MoleskineCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "var(--cs-semantic-spacing-md)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}
        >
          Score Flow{" "}
          {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
        </Typography>
        <IconButton
          onClick={onExpand}
          aria-label="Expand Score Flow section"
          title="Expand section"
        >
          <ExpandIcon />
        </IconButton>
      </Box>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={scoreFlowData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis yAxisId="spread" orientation="left" />
            <YAxis
              yAxisId="ppp"
              orientation="right"
              domain={[0, 2]}
              label={{ value: "PPP", angle: -90, position: "insideRight" }}
            />
            <Tooltip content={<ScoreFlowTooltip jerseyMap={jerseyMap} />} />
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
              const refLines = [];
              const totalTime = (allStatsLength > 0 ? maxPeriod : 4) * pLen;
              for (let m = pLen; m < totalTime; m += pLen) {
                refLines.push(
                  <ReferenceLine
                    key={m}
                    x={`${m}:00`}
                    yAxisId="spread"
                    stroke={tokens.semantic.color.border.default}
                    strokeDasharray="5 5"
                    label={{ value: `P${m / pLen + 1}`, position: "top" }}
                  />,
                );
              }
              return refLines;
            })()}
            {scoreFlowData
              .filter((d) => d.event === ACTION_TYPES.TIMEOUT)
              .map((d, idx) => (
                <ReferenceLine
                  key={`to-${idx}`}
                  x={d.time}
                  yAxisId="spread"
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
            <Line
              yAxisId="spread"
              type="stepAfter"
              dataKey="Team"
              stroke={tokens.semantic.color.brand.primary.main}
              strokeWidth={2}
              dot={false}
              hide
            />
            <Line
              yAxisId="spread"
              type="stepAfter"
              dataKey="Opponent"
              stroke={tokens.semantic.color.brand.secondary.main}
              strokeWidth={2}
              dot={false}
              hide
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </MoleskineCard>
  );
};
