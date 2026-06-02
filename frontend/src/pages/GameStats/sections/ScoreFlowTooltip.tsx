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
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: "var(--cs-semantic-color-background-paper)",
          p: "var(--cs-semantic-spacing-md)",
          border: "1px solid var(--cs-semantic-color-border-subtle)",
          boxShadow: "var(--cs-semantic-elevation-shadow-dialog)",
          borderRadius: "var(--cs-semantic-shape-radius-md)",
          minWidth: 200,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            mb: "var(--cs-semantic-spacing-xs)",
            fontSize: "var(--cs-typography-fontSize-sm)",
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
              mb: "var(--cs-semantic-spacing-xs)",
              height: 20,
              fontSize: "var(--cs-typography-fontSize-xs)",
              fontWeight: "var(--cs-typography-fontWeight-bold)",
            }}
          />
        )}
        <Divider sx={{ my: "var(--cs-semantic-spacing-xs)" }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            display: "block",
            mb: "var(--cs-semantic-spacing-xs)",
            fontSize: "var(--cs-typography-fontSize-xs)",
          }}
        >
          ACTIVE LINEUP:
        </Typography>
        <Stack
          direction="row"
          spacing="var(--cs-semantic-spacing-xs)"
          sx={{ mb: "var(--cs-semantic-spacing-md)" }}
        >
          {data.lineup?.map((pId: string) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: "var(--cs-typography-fontSize-xs)",
                bgcolor: "var(--cs-semantic-color-surface-subtle)",
                color: "var(--cs-semantic-color-text-primary)",
                border: "1px solid var(--cs-semantic-color-border-subtle)",
              }}
            >
              {shotChartJerseyMap.get(pId) || "??"}
            </Avatar>
          ))}
          {(!data.lineup || data.lineup.length === 0) && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
            >
              Unknown
            </Typography>
          )}
        </Stack>
        <Grid container spacing="var(--cs-semantic-spacing-xs)">
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "var(--cs-typography-fontSize-xs)",
              }}
            >
              TEAM PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                fontSize: "var(--cs-typography-fontSize-sm)",
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
                fontSize: "var(--cs-typography-fontSize-xs)",
              }}
            >
              OPP PPP
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                fontSize: "var(--cs-typography-fontSize-sm)",
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
