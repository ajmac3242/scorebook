import React from "react";
import { Box, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import BasketballCourt from "../../../components/BasketballCourt";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../../theme/useTokens";

type PlayerShotChartCardProps = {
  shotChartView: "markers" | "heatmap";
  setShotChartView: (view: "markers" | "heatmap") => void;
  courtMarkers: any[];
  heatmapData: Record<string, { makes: number; attempts: number }>;
  accentColor: string;
  eventCount: number;
};

const PlayerShotChartCard: React.FC<PlayerShotChartCardProps> = ({
  shotChartView,
  setShotChartView,
  courtMarkers,
  heatmapData,
  accentColor,
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

          <ToggleButtonGroup
            size="small"
            exclusive
            value={shotChartView}
            onChange={(_, value) => {
              if (value) setShotChartView(value);
            }}
            aria-label="shot chart view"
            sx={{
              "& .MuiToggleButton-root": {
                borderRadius: `${tokens.semantic.component.radius.button}px !important`,
                px: 1.5,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value="markers" aria-label="markers">
              Markers
            </ToggleButton>
            <ToggleButton value="heatmap" aria-label="heatmap">
              Heatmap
            </ToggleButton>
          </ToggleButtonGroup>
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
