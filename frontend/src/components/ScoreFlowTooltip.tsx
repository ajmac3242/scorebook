import React from "react";
import { Box, Typography, Chip, Divider, Avatar, Grid, Stack, useTheme } from "@mui/material";
import { ScoreFlowPoint } from "../utils/stats";

interface ScoreFlowTooltipProps {
  active?: boolean;
  payload?: { payload: ScoreFlowPoint }[];
  label?: string;
  jerseyMap: Map<string, string>;
}

export const ScoreFlowTooltip: React.FC<ScoreFlowTooltipProps> = ({
  active,
  payload,
  label,
  jerseyMap,
}) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: "white",
          p: 2,
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: theme.shadows[3],
          borderRadius: 1,
          minWidth: 200,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
          {label} - Spread: {data.Spread > 0 ? "+" : ""}
          {data.Spread}
        </Typography>
        {data.event && (
          <Chip
            label={data.event}
            size="small"
            color="primary"
            sx={{ mb: 1, height: 20, fontSize: "0.65rem", fontWeight: 700 }}
          />
        )}
        <Divider sx={{ my: 1 }} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
        >
          ACTIVE LINEUP:
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
          {data.lineup?.map((pId: string) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: "0.65rem",
                bgcolor: theme.palette.grey[200],
                color: "black",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {jerseyMap.get(pId) || "??"}
            </Avatar>
          ))}
          {(!data.lineup || data.lineup.length === 0) && (
            <Typography variant="caption" color="text.secondary">
              Unknown
            </Typography>
          )}
        </Stack>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ display: "block" }}>
              TEAM PPP
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {data.teamPpp || "0.00"}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ display: "block" }}>
              OPP PPP
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {data.oppPpp || "0.00"}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  }
  return null;
};

export default ScoreFlowTooltip;
