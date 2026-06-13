import React from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup, Grid } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";
import KpiStat from "../../../components/data-display/KpiStat";
import { useTokens } from "../../../theme/useTokens";

interface TeamAggregatesSectionProps {
  gameCountFilter: string;
  setGameCountFilter: (val: string) => void;
  aggregates: {
    record: string;
    ppg: string;
    oppg: string;
    rpg: string;
  };
}

const TeamAggregatesSection: React.FC<TeamAggregatesSectionProps> = ({
  gameCountFilter,
  setGameCountFilter,
  aggregates,
}) => {
  const tokens = useTokens();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "var(--cs-semantic-spacing-lg)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "var(--cs-semantic-spacing-xs)",
          }}
        >
          <TrendingUp color="primary" />
          <Typography
            variant="h6"
            sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
          >
            Team Aggregates
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={gameCountFilter}
          exclusive
          onChange={(_, val) => val && setGameCountFilter(val)}
          size="small"
          aria-label="Filter team aggregates by last games count"
        >
          <ToggleButton value="5" sx={{ px: "var(--cs-semantic-spacing-xs)" }}>
            L5
          </ToggleButton>
          <ToggleButton value="10" sx={{ px: "var(--cs-semantic-spacing-xs)" }}>
            L10
          </ToggleButton>
          <ToggleButton value="all" sx={{ px: "var(--cs-semantic-spacing-xs)" }}>
            All
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Grid container spacing="var(--cs-semantic-spacing-md)">
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStat label="Record" value={aggregates.record} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStat label="PPG" value={aggregates.ppg} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStat label="OPPG" value={aggregates.oppg} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStat label="RPG" value={aggregates.rpg} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamAggregatesSection;
