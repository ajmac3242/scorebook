import React from "react";
import {
  Box,
  Typography,
  Grid,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import { MoleskineCard } from "./SharedUI";

interface FactorProps {
  label: string;
  value: number;
  seasonAvg?: number;
  isInverse?: boolean;
  tooltip: string;
}

const Factor: React.FC<FactorProps> = ({ label, value, seasonAvg, isInverse, tooltip }) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const numSeasonAvg = typeof seasonAvg === "string" ? parseFloat(seasonAvg) : seasonAvg;

  const diff = numSeasonAvg !== undefined && !isNaN(numSeasonAvg) ? numValue - numSeasonAvg : 0;
  const isBetter = isInverse ? diff < 0 : diff > 0;
  const color = isBetter ? "success.main" : diff === 0 ? "text.secondary" : "error.main";

  return (
    <Box sx={{ flex: 1, minWidth: 100 }}>
      <Tooltip title={tooltip}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block" }}>
            {label}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {isNaN(numValue) ? "0.0" : numValue.toFixed(1)}{label.includes("%") ? "" : ""}
            </Typography>
            {numSeasonAvg !== undefined && !isNaN(numSeasonAvg) && (
              <Typography variant="caption" sx={{ fontWeight: 700, color }}>
                {diff > 0 ? "+" : ""}{diff.toFixed(1)}
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, isNaN(numValue) ? 0 : numValue)}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.05)",
              "& .MuiLinearProgress-bar": {
                bgcolor: color
              }
            }}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};

interface FourFactorsHUDProps {
  teamStats: any;
  oppStats: any;
  seasonAvg?: any;
}

const FourFactorsHUD: React.FC<FourFactorsHUDProps> = ({ teamStats, oppStats, seasonAvg }) => {
  if (!teamStats || !oppStats) return null;
  return (
    <MoleskineCard sx={{ bgcolor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, letterSpacing: 1, color: "text.secondary" }}>
        FOUR FACTORS PERFORMANCE HUD
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" sx={{ fontWeight: 900, mb: 1, display: "block", color: "primary.main" }}>
            OFFENSIVE EFFICIENCY
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Factor
              label="eFG%"
              value={teamStats.efgPct}
              seasonAvg={seasonAvg?.efgPct}
              tooltip="Effective Field Goal Percentage: (FG + 0.5 * 3P) / FGA"
            />
            <Factor
              label="TO%"
              value={teamStats.toPct}
              seasonAvg={seasonAvg?.toPct}
              isInverse
              tooltip="Turnover Percentage: Estimated turnovers per 100 possessions"
            />
            <Factor
              label="ORB%"
              value={teamStats.orbPct}
              seasonAvg={seasonAvg?.orbPct}
              tooltip="Offensive Rebound Percentage: % of available offensive rebounds grabbed"
            />
            <Factor
              label="FT RATE"
              value={teamStats.ftRate}
              seasonAvg={seasonAvg?.ftRate}
              tooltip="Free Throw Rate: FT Made per FG Attempt"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" sx={{ fontWeight: 900, mb: 1, display: "block", color: "secondary.main" }}>
            DEFENSIVE EFFICIENCY (OPPONENT FACTORS)
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Factor
              label="eFG%"
              value={oppStats.efgPct}
              isInverse
              tooltip="Opponent Effective Field Goal Percentage"
            />
            <Factor
              label="TO%"
              value={oppStats.toPct}
              tooltip="Opponent Turnover Percentage (Forced TOs)"
            />
            <Factor
              label="ORB%"
              value={oppStats.orbPct}
              isInverse
              tooltip="Opponent Offensive Rebound Percentage (Allowed OREBs)"
            />
            <Factor
              label="FT RATE"
              value={oppStats.ftRate}
              isInverse
              tooltip="Opponent Free Throw Rate"
            />
          </Box>
        </Grid>
      </Grid>
    </MoleskineCard>
  );
};

export default FourFactorsHUD;
