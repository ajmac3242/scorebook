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
      <SurfaceCard role="region" aria-label="Offensive Identity KPIs">
        <Typography
          variant="overline"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mb: tokens.semantic.spacing.xs / 8,
            color: tokens.semantic.color.text.secondary,
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
          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.primary,
              }}
            >
              {paintTouchStats.total}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              PAINT TOUCHES
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.primary,
              }}
            >
              {paintTouchStats.pppt}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              PTS / TOUCH
            </Typography>
          </Box>
        </Stack>

        <Typography
          variant="overline"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mt: tokens.semantic.spacing.md / 8,
            mb: tokens.semantic.spacing.xs / 8,
            color: tokens.semantic.color.text.secondary,
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
          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.primary,
              }}
            >
              {shotROI.avgXPts}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              xPTS / POSS
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: roiPositive
                  ? tokens.semantic.color.feedback.success.main
                  : tokens.semantic.color.feedback.error.main,
              }}
            >
              {roiDisplay}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              SHOT ROI
            </Typography>
          </Box>
        </Stack>
      </SurfaceCard>
    );
  },
);

OffensiveKPICard.displayName = "OffensiveKPICard";
