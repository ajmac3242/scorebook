/**
 * @file OffensiveKPICard.tsx
 * @description Paint touches, xPTS/possession, and Shot ROI KPI grid.
 * Covers both Offensive Identity and Quality Control sections.
 */
import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import { SurfaceCard } from "../../components/cards/SurfaceCard";

interface PaintTouchStats {
  total: number;
  pppt: string;
}

interface ShotROI {
  avgXPts: string;
  roi: string;
}

interface OffensiveKPICardProps {
  paintTouchStats: PaintTouchStats;
  shotROI: ShotROI;
}

export const OffensiveKPICard: React.FC<OffensiveKPICardProps> = React.memo(
  ({ paintTouchStats, shotROI }) => {
    const tokens = useTokens();
    const roiValue = parseFloat(shotROI.roi);
    const roiPositive = roiValue >= 0;
    const roiDisplay = `${roiPositive ? "+" : ""}${Math.round(roiValue * 100)}%`;

    return (
      <SurfaceCard aria-label="Offensive Identity KPIs">
        <Typography
          variant="overline"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mb: tokens.semantic.spacing.xs / 8,
          }}
        >
          Offensive Identity (KPIs)
        </Typography>
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.sm / 8}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
              {paintTouchStats.total}
            </Typography>
            <Typography variant="caption">PAINT TOUCHES</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
              {paintTouchStats.pppt}
            </Typography>
            <Typography variant="caption">PTS / TOUCH</Typography>
          </Box>
        </Stack>

        <Typography
          variant="overline"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mt: tokens.semantic.spacing.md / 8,
            mb: tokens.semantic.spacing.xs / 8,
          }}
        >
          Quality Control (xPTS)
        </Typography>
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.sm / 8}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
              {shotROI.avgXPts}
            </Typography>
            <Typography variant="caption">xPTS / POSS</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: roiPositive ? "success.main" : "error.main",
              }}
            >
              {roiDisplay}
            </Typography>
            <Typography variant="caption">SHOT ROI</Typography>
          </Box>
        </Stack>
      </SurfaceCard>
    );
  },
);

OffensiveKPICard.displayName = "OffensiveKPICard";
