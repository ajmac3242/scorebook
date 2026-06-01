import React from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { type Team } from "../../db";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import KpiStat from "../../../components/KpiStat";
import { useTokens } from "../../theme/useTokens";

type PlayerSummaryCardProps = {
  aggregates: {
    min: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fgPct: string;
    efgPct: string;
    makes: number;
    attempts: number;
    plusMinus: number;
  };
  currentTeam: Team | undefined;
  selectedType: string;
  selectedGameId: string;
  clutchFilter: boolean;
};

const PlayerSummaryCard: React.FC<PlayerSummaryCardProps> = ({
  aggregates,
  currentTeam,
  selectedType,
  selectedGameId,
  clutchFilter,
}) => {
  const tokens = useTokens();

  const summaryStats = [
    { label: "Minutes", value: aggregates.min },
    { label: "Points", value: aggregates.points },
    { label: "Rebounds", value: aggregates.rebounds },
    { label: "Assists", value: aggregates.assists },
    { label: "Steals", value: aggregates.steals },
    { label: "Blocks", value: aggregates.blocks },
    { label: "FG%", value: `${aggregates.fgPct}%` },
    { label: "eFG%", value: `${aggregates.efgPct}%` },
    { label: "FG", value: `${aggregates.makes}/${aggregates.attempts}` },
    { label: "+/-", value: aggregates.plusMinus },
  ];

  const statLabelSx = {
    fontSize: "var(--cs-typography-fontSize-xs)",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    mb: 0.5,
  };

  return (
    <Stack spacing={2.5}>
      <PageSectionCard>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Summary
        </Typography>

        <Grid container spacing={1.5}>
          {summaryStats.map((stat) => (
            <Grid size={{ xs: 6 }} key={stat.label}>
              <Box
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                  px: 1.5,
                  py: 1.5,
                  minHeight: 84,
                }}
              >
                <KpiStat label={stat.label} value={stat.value} size="lg" />
              </Box>
            </Grid>
          ))}
        </Grid>
      </PageSectionCard>

      <PageSectionCard>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Context
        </Typography>

        <Stack spacing={1.25}>
          <Box>
            <Typography sx={statLabelSx}>Scope</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTeam?.name || "Career totals across visible games"}
            </Typography>
          </Box>

          <Box>
            <Typography sx={statLabelSx}>Filters</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedType || "All action types"} ·{" "}
              {selectedGameId ? "Single game selected" : "All games"} ·{" "}
              {clutchFilter ? "Clutch only" : "All situations"}
            </Typography>
          </Box>
        </Stack>
      </PageSectionCard>
    </Stack>
  );
};

export default PlayerSummaryCard;
