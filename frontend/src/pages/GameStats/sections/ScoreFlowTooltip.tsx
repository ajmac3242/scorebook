import React from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Stack,
  Avatar,
} from "@mui/material";
import { type ScoreFlowPoint } from "../../../utils/stats";
import { useTokens } from "../../../theme/useTokens";

interface ScoreFlowTooltipProps {
  active?: boolean;
  payload?: { payload: ScoreFlowPoint }[];
  label?: string;
  shotChartJerseyMap: Map<string, string>;
}

export const ScoreFlowTooltip: React.FC<ScoreFlowTooltipProps> = ({
  active,
  payload,
  label,
  shotChartJerseyMap,
}) => {
  const tokens = useTokens();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: tokens.semantic.color.background.paper,
          p: `${tokens.semantic.spacing.md}px`,
          border: `1px solid ${tokens.semantic.color.border.subtle}`,
          boxShadow: tokens.semantic.elevation.shadow.dialog,
          borderRadius: `${tokens.semantic.shape.radius.md}px`,
          minWidth: 200,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            mb: tokens.semantic.spacing.xs / 8,
            fontSize: `${tokens.typography.fontSize.sm}px`,
          }}
        >
          {label} - Spread: {data.Spread > 0 ? "+" : ""}
          {data.Spread}
        </Typography>
        {data.event && (
          <Chip
            label={data.event}
            size="small"
            color="primary"
            sx={{
              mb: tokens.semantic.spacing.xs / 8,
              height: 20,
              fontSize: `${tokens.typography.fontSize.xs}px`,
              fontWeight: tokens.typography.fontWeight.bold,
            }}
          />
        )}
        <Divider sx={{ my: tokens.semantic.spacing.xs / 8 }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mb: tokens.semantic.spacing.xs / 8,
            fontSize: `${tokens.typography.fontSize.xs}px`,
          }}
        >
          ACTIVE LINEUP:
        </Typography>
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{ mb: tokens.semantic.spacing.md / 8 }}
        >
          {data.lineup?.map((pId: string) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: `${tokens.typography.fontSize.xs}px`,
                bgcolor: tokens.semantic.color.surface.subtle,
                color: tokens.semantic.color.text.primary,
                border: `1px solid ${tokens.semantic.color.border.subtle}`,
              }}
            >
              {shotChartJerseyMap.get(pId) ?? "??"}
            </Avatar>
          ))}
          {(!data.lineup || data.lineup.length === 0) && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.semantic.color.text.secondary,
                fontSize: `${tokens.typography.fontSize.xs}px`,
              }}
            >
              Unknown
            </Typography>
          )}
        </Stack>
        <Grid container spacing={tokens.semantic.spacing.xs / 8}>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: `${tokens.typography.fontSize.xs}px`,
              }}
            >
              TEAM PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                fontSize: `${tokens.typography.fontSize.sm}px`,
              }}
            >
              {data.teamPpp || "0.00"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: `${tokens.typography.fontSize.xs}px`,
              }}
            >
              OPP PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                fontSize: `${tokens.typography.fontSize.sm}px`,
              }}
            >
              {data.oppPpp || "0.00"}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  }
  return null;
};
