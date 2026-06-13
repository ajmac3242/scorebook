import React from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Assessment } from "@mui/icons-material";
import BasketballCourt from "../../../components/game/BasketballCourt";
import { useTokens } from "../../../theme/useTokens";

interface HeatmapSectionProps {
  selectedPeriod: string;
  setSelectedPeriod: (_val: string) => void;
  periodType: string | undefined;
  heatmapData: Record<string, { makes: number; attempts: number }>;
}

const HeatmapSection: React.FC<HeatmapSectionProps> = ({
  selectedPeriod,
  setSelectedPeriod,
  periodType,
  heatmapData,
}) => {
  const tokens = useTokens();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: "var(--cs-semantic-spacing-md)",
          gap: "var(--cs-semantic-spacing-xs)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "var(--cs-semantic-spacing-xs)",
          }}
        >
          <Assessment
            sx={{ color: tokens.semantic.color.brand.primary.main }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
          >
            Shot Efficiency (Heatmap)
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={selectedPeriod}
          exclusive
          onChange={(_, _val) => _val && setSelectedPeriod(_val)}
          size="small"
          aria-label="Filter stats by period"
        >
          <ToggleButton value="ALL" aria-label="Show all periods">
            All
          </ToggleButton>
          <ToggleButton value="1" aria-label="Show period 1">
            P1
          </ToggleButton>
          <ToggleButton value="2" aria-label="Show period 2">
            P2
          </ToggleButton>
          {periodType === "QUARTERS" && (
            <ToggleButton value="3" aria-label="Show period 3">
              P3
            </ToggleButton>
          )}
          {periodType === "QUARTERS" && (
            <ToggleButton value="4" aria-label="Show period 4">
              P4
            </ToggleButton>
          )}
          <ToggleButton value="OT" aria-label="Show overtime">
            OT
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          p: "var(--cs-semantic-spacing-xs)",
        }}
      >
        <BasketballCourt heatmapData={heatmapData} />
      </Box>
    </Box>
  );
};

export default HeatmapSection;
