/**
 * @file OffensiveKPICard.tsx
 * @description Paint touches, xPTS/possession, and Shot ROI KPI grid.
 * Covers both Offensive Identity and Quality Control sections.
 */
import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";

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
    const roiValue = parseFloat(shotROI.roi);
    const roiPositive = roiValue >= 0;
    const roiDisplay = `${roiPositive ? "+" : ""}${Math.round(roiValue * 100)}%`;

    return (
      <MoleskineCard aria-label="Offensive Identity KPIs">
        <Typography variant="overline" fontWeight={700} display="block" mb={1}>
          Offensive Identity (KPIs)
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={800}>
              {paintTouchStats.total}
            </Typography>
            <Typography variant="caption">PAINT TOUCHES</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={800}>
              {paintTouchStats.pppt}
            </Typography>
            <Typography variant="caption">PTS / TOUCH</Typography>
          </Box>
        </Stack>

        <Typography variant="overline" fontWeight={700} display="block" mt={2} mb={1}>
          Quality Control (xPTS)
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={800}>
              {shotROI.avgXPts}
            </Typography>
            <Typography variant="caption">xPTS / POSS</Typography>
          </Box>
          <Box textAlign="center">
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: roiPositive ? "success.main" : "error.main" }}
            >
              {roiDisplay}
            </Typography>
            <Typography variant="caption">SHOT ROI</Typography>
          </Box>
        </Stack>
      </MoleskineCard>
    );
  },
);

OffensiveKPICard.displayName = "OffensiveKPICard";
