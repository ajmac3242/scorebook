import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import BasketballCourt from "../../../components/BasketballCourt";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../theme/useTokens";

type PlayerShotChartCardProps = {
  shotChartView: "markers" | "heatmap";
  courtMarkers: {
    id: string;
    x: number;
    y: number;
    type: string;
    label: string;
    color: string;
    playerId: string | undefined;
    playerName: string;
  }[];
  heatmapData: Record<string, { makes: number; attempts: number }>;
  eventCount: number;
};

const PlayerShotChartCard: React.FC<PlayerShotChartCardProps> = ({
  shotChartView,
  courtMarkers,
  heatmapData,
  eventCount,
}) => {
  const tokens = useTokens();

  return (
    <PageSectionCard>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6">Shot Chart</Typography>
          <Typography variant="body2" color="text.secondary">
            {shotChartView === "markers"
              ? "Review each recorded shot location."
              : "See makes and attempts grouped by zone."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            label={`${eventCount} tracked events`}
            size="small"
            sx={{
              borderRadius: tokens.semantic.component.radius.button,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        </Stack>
      </Stack>

      <Box
        sx={{
          borderRadius: tokens.semantic.component.sectionCard.radius,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          p: { xs: 1, sm: 2 },
        }}
      >
        <BasketballCourt
          markers={shotChartView === "markers" ? courtMarkers : []}
          heatmapData={shotChartView === "heatmap" ? heatmapData : undefined}
        />
      </Box>
    </PageSectionCard>
  );
};

export default PlayerShotChartCard;
