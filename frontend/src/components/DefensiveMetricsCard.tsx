import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import { MoleskineCard } from "./SharedUI";

interface DefensiveMetricsCardProps {
  defensiveStats: {
    totalStops: number;
    totalKills: number;
    currentStreak: number;
  };
}

export const DefensiveMetricsCard: React.FC<DefensiveMetricsCardProps> = ({ defensiveStats }) => {
  return (
    <MoleskineCard>
      <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
        Defensive Metrics
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {defensiveStats.totalStops}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              TOTAL STOPS
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
              {defensiveStats.totalKills}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              KILLS (3x STOPS)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {defensiveStats.currentStreak}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              CURRENT STOP STREAK
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MoleskineCard>
  );
};

export default DefensiveMetricsCard;
