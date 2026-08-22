import React from "react";
import {
  Grid,
  Typography,
  Box,
  Divider,
  Stack,
  Avatar,
  Chip,
  Button,
} from "@mui/material";
import SectionCard from "../../../components/layout/SectionCard";
import StatTable, {
  type StatTableColumn,
} from "../../../components/data-display/StatTable";
import KpiStat from "../../../components/data-display/KpiStat";
import { useTokens } from "../../../theme";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface EfficiencyAnalyticsCardProps {
  aggregates: GameAggregates;
  onDefensiveIntegrityOpen: () => void;
}

export const EfficiencyAnalyticsCard: React.FC<
  EfficiencyAnalyticsCardProps
> = ({ aggregates, onDefensiveIntegrityOpen }) => {
  const tokens = useTokens();

  const defensiveBreakdownColumns: StatTableColumn<
    (typeof aggregates.individualDefensiveBreakdown)[0]
  >[] = [
    {
      key: "playerName",
      label: "Defender",
      format: (_, row) => (
        <Stack
          direction="row"
          spacing={`${tokens.semantic.spacing.xs}px`}
          sx={{ alignItems: "center" }}
        >
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            {row.jerseyNumber}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ fontSize: tokens.typography.fontSize.sm }}
          >
            {row.playerName}
          </Typography>
        </Stack>
      ),
    },
    { key: "pointsAllowed", label: "PTS Agn", align: "right" },
    {
      key: "primaryReason",
      label: "Primary Breakdown",
      format: (val) => (
        <Chip
          label={String(val)}
          size="small"
          variant="outlined"
          color={val === "Great Contest" ? "success" : "error"}
          sx={{ fontSize: tokens.typography.fontSize.xs, height: 20 }}
        />
      ),
    },
  ];

  const assistNetworkColumns: StatTableColumn<
    (typeof aggregates.assistNetwork.edges)[0]
  >[] = [
    {
      key: "passerId",
      label: "CONNECTION",
      format: (_, row) => (
        <Stack
          direction="row"
          spacing={`${tokens.semantic.spacing.xs}px`}
          sx={{ alignItems: "center" }}
        >
          <Avatar
            sx={{
              width: 20,
              height: 20,
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            {aggregates.shotChartJerseyMap.get(row.passerId) ?? "??"}
          </Avatar>
          <Typography variant="caption">→</Typography>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            {aggregates.shotChartJerseyMap.get(row.finisherId) ?? "??"}
          </Avatar>
        </Stack>
      ),
    },
    { key: "count", label: "FREQ", align: "right" },
    { key: "points", label: "PTS", align: "right" },
    {
      key: "efg",
      label: "eFG%",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  const oppPlayTypeColumns: StatTableColumn<
    (typeof aggregates.opponentPlayTypeEfficiency)[0]
  >[] = [
    { key: "type", label: "TYPE" },
    { key: "ppp", label: "PPP", align: "right" },
    {
      key: "efg",
      label: "eFG%",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  const genericEfficiencyColumns = <T,>(
    keyLabel: string,
    keyName: keyof T,
  ): StatTableColumn<T>[] => [
    { key: keyName, label: keyLabel },
    { key: "attempts" as keyof T, label: "Freq", align: "right" },
    { key: "points" as keyof T, label: "PTS", align: "right" },
    {
      key: "efg" as keyof T,
      label: "eFG%",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  const defensiveIntegrityColumns: StatTableColumn<
    (typeof aggregates.defensiveIntegrity)[0]
  >[] = [
    { key: "reason", label: "REASON" },
    { key: "points", label: "PTS", align: "right" },
    {
      key: "percentage",
      label: "%",
      align: "right",
      format: (val) => `${val}%`,
    },
  ];

  return (
    <Grid container spacing={`${tokens.semantic.spacing.md}px`}>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Individual Defensive Accountability">
          <StatTable
            rows={aggregates.individualDefensiveBreakdown}
            columns={defensiveBreakdownColumns}
            emptyMessage="No defensive breakdown data."
          />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Rim Pressure (Paint Touches)">
          <Typography
            variant="caption"
            sx={{
              color: tokens.semantic.color.text.secondary,
              display: "block",
              mb: `${tokens.semantic.spacing.md}px`,
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            Paint touches correlate rim pressure with offensive efficiency. PPPT
            measures points generated within 15s of a paint touch.
          </Typography>
          <Grid
            container
            spacing={`${tokens.semantic.spacing.md}px`}
            sx={{ mb: `${tokens.semantic.spacing.lg}px` }}
          >
            <Grid size={{ xs: 6 }}>
              <KpiStat
                label="TOTAL TOUCHES"
                value={aggregates.paintTouchStats.total}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <KpiStat
                label="PPPT"
                value={aggregates.paintTouchStats.pppt}
                valueColor={tokens.semantic.color.feedback.success.main}
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: `${tokens.semantic.spacing.md}px` }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              display: "block",
              textAlign: "center",
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            EFFICIENCY MULTIPLIER:{" "}
            {(
              parseFloat(aggregates.paintTouchStats.pppt) /
              (parseFloat(aggregates.teamData.ppp) || 1)
            ).toFixed(2)}
            x
          </Typography>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Process Report (ROI)">
          <Typography
            variant="caption"
            sx={{
              color: tokens.semantic.color.text.secondary,
              display: "block",
              mb: `${tokens.semantic.spacing.md}px`,
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            This report compares actual scoring against Expected Points (xPTS)
            based on shot location and quality.
          </Typography>
          <Grid
            container
            spacing={`${tokens.semantic.spacing.md}px`}
            sx={{ mb: `${tokens.semantic.spacing.lg}px` }}
          >
            <Grid size={{ xs: 6 }}>
              <KpiStat
                label="ACTUAL PTS"
                value={aggregates.shotROI.totalPoints}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <KpiStat
                label="EXPECTED PTS"
                value={aggregates.shotROI.totalXPts}
                valueColor={tokens.semantic.color.brand.primary.main}
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: `${tokens.semantic.spacing.md}px` }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: tokens.typography.fontSize["2xl"],
                fontWeight: tokens.typography.fontWeight.bold,
                color:
                  parseFloat(aggregates.shotROI.roi) >= 0
                    ? tokens.semantic.color.feedback.success.main
                    : tokens.semantic.color.feedback.error.main,
              }}
            >
              {parseFloat(aggregates.shotROI.roi) > 0 ? "+" : ""}
              {Math.round(parseFloat(aggregates.shotROI.roi) * 100)}%
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                fontSize: tokens.typography.fontSize.sm,
              }}
            >
              SHOT ROI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.semantic.color.text.secondary,
              }}
            >
              {parseFloat(aggregates.shotROI.roi) >= 0
                ? "Over-performing relative to shot quality."
                : "Under-performing relative to shot quality."}
            </Typography>
          </Box>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Assist Network (Chemistry)">
          <StatTable
            rows={aggregates.assistNetwork.edges
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)}
            columns={assistNetworkColumns}
            emptyMessage="No assists recorded."
          />
          {aggregates.assistNetwork.primaryPlaymakerId && (
            <Box
              sx={{
                mt: `${tokens.semantic.spacing.md}px`,
                p: `${tokens.semantic.spacing.xs}px`,
                bgcolor: tokens.semantic.color.surface.subtle,
                borderRadius: `${tokens.semantic.shape.radius.sm}px`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: tokens.typography.fontWeight.bold,
                  fontSize: tokens.typography.fontSize.xs,
                }}
              >
                PRIMARY PLAYMAKER: #
                {aggregates.shotChartJerseyMap.get(
                  aggregates.assistNetwork.primaryPlaymakerId,
                ) ?? "??"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: tokens.typography.fontWeight.bold,
                  fontSize: tokens.typography.fontSize.xs,
                }}
              >
                PRIMARY FINISHER: #
                {aggregates.shotChartJerseyMap.get(
                  aggregates.assistNetwork.primaryFinisherId,
                ) ?? "??"}
              </Typography>
            </Box>
          )}
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Opponent Play Types">
          <StatTable
            rows={aggregates.opponentPlayTypeEfficiency}
            columns={oppPlayTypeColumns}
            emptyMessage="No play types recorded."
          />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Shot Rhythm (Clock)">
          <StatTable
            rows={aggregates.shotClockEfficiency}
            columns={genericEfficiencyColumns("Phase", "phase")}
          />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Process Efficiency">
          <StatTable
            rows={aggregates.processEfficiency}
            columns={genericEfficiencyColumns("Quality", "quality")}
          />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard title="Play Efficiency">
          <StatTable
            rows={aggregates.playEfficiency}
            columns={genericEfficiencyColumns("Play", "name")}
            emptyMessage="No play-tagged shots recorded."
          />
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard
          title="Defensive Integrity"
          actions={
            <Button
              size="small"
              variant="outlined"
              onClick={onDefensiveIntegrityOpen}
              sx={{ fontSize: tokens.typography.fontSize.xs }}
            >
              View Report
            </Button>
          }
        >
          <StatTable
            rows={aggregates.defensiveIntegrity.slice(0, 5)}
            columns={defensiveIntegrityColumns}
            emptyMessage="No breakdown data recorded."
          />
        </SectionCard>
      </Grid>
    </Grid>
  );
};
