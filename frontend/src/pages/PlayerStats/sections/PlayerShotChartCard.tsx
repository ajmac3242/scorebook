import React from "react";
import {
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import BasketballCourt from "../../../components/game/BasketballCourt";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../../theme/useTokens";

type ShotChartView = "markers" | "heatmap";

type PlayerShotChartCardProps = {
  shotChartView: ShotChartView;
  onShotChartViewChange?: (_value: ShotChartView) => void;
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
  onShotChartViewChange,
  courtMarkers,
  heatmapData,
  eventCount,
}) => {
  const tokens = useTokens();

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ShotChartView | null,
  ) => {
    if (!value) return;
    onShotChartViewChange?.(value);
  };

  return (
    <PageSectionCard>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={tokens.semantic.spacing.xs / 8}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: tokens.semantic.spacing.md / 8,
        }}
      >
        <Box>
          <Typography variant="h6">Shot Chart</Typography>
          <Typography
            variant="body2"
            sx={{ color: tokens.semantic.color.text.secondary }}
          >
            {shotChartView === "markers"
              ? "Review each recorded shot location."
              : "See makes and attempts grouped by zone."}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={shotChartView}
            onChange={handleViewChange}
            aria-label="Shot chart view"
          >
            <ToggleButton
              value="markers"
              sx={{ minHeight: tokens.touch.targetComfortable }}
            >
              Markers
            </ToggleButton>
            <ToggleButton
              value="heatmap"
              sx={{ minHeight: tokens.touch.targetComfortable }}
            >
              Heatmap
            </ToggleButton>
          </ToggleButtonGroup>

          <Chip
            label={`${eventCount} tracked events`}
            size="small"
            sx={{
              borderRadius: tokens.semantic.component.radius.button,
              bgcolor: tokens.semantic.color.background.default,
              border: "1px solid",
              borderColor: tokens.semantic.color.border.subtle,
            }}
          />
        </Stack>
      </Stack>

      <Box
        sx={{
          borderRadius: tokens.semantic.component.sectionCard.radius,
          overflow: "hidden",
          border: "1px solid",
          borderColor: tokens.semantic.color.border.subtle,
          bgcolor: tokens.semantic.color.background.default,
          p: {
            xs: tokens.semantic.spacing.xs / 8,
            sm: tokens.semantic.spacing.sm / 8,
          },
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
