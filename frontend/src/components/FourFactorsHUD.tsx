import React from "react";
import {
  Box,
  Typography,
  Grid,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import { MoleskineCard } from "./SharedUI";
import { TeamAggregates, OpponentAggregates } from "../utils/stats";

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
  const isWorse = isInverse ? diff > 0 : diff < 0;
  const color = isBetter ? "success.main" : isWorse ? "error.main" : "text.secondary";
  const statusWording = isBetter ? "better" : isWorse ? "worse" : "equal";
  const ariaLabel = `${label}: ${isNaN(numValue) ? "0.0" : numValue.toFixed(1)}${numSeasonAvg !== undefined && !isNaN(numSeasonAvg) ? `. Season average is ${numSeasonAvg.toFixed(1)}, current performance is ${Math.abs(diff).toFixed(1)} ${statusWording} than average.` : ""}`;

  return (
    <Box sx={{ flex: 1, minWidth: 100 }}>
      <Tooltip title={tooltip}>
        <Box role="group" aria-label={ariaLabel}>
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
  teamStats: TeamAggregates;
  oppStats: OpponentAggregates;
  seasonAvg?: TeamAggregates | null;
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
              value={parseFloat(teamStats.efgPct ?? "0")}
              seasonAvg={parseFloat(seasonAvg?.efgPct ?? "0")}
              tooltip="Effective Field Goal Percentage: (FG + 0.5 * 3P) / FGA"
            />
            <Factor
              label="TO%"
              value={parseFloat(teamStats.toPct ?? "0")}
              seasonAvg={parseFloat(seasonAvg?.toPct ?? "0")}
              isInverse
              tooltip="Turnover Percentage: Estimated turnovers per 100 possessions"
            />
            <Factor
              label="ORB%"
              value={parseFloat(teamStats.orbPct ?? "0")}
              seasonAvg={parseFloat(seasonAvg?.orbPct ?? "0")}
              tooltip="Offensive Rebound Percentage: % of available offensive rebounds grabbed"
            />
            <Factor
              label="FT RATE"
              value={parseFloat(teamStats.ftRate ?? "0")}
              seasonAvg={parseFloat(seasonAvg?.ftRate ?? "0")}
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
              value={parseFloat(oppStats.efgPct ?? "0")}
              isInverse
              tooltip="Opponent Effective Field Goal Percentage"
            />
            <Factor
              label="TO%"
              value={parseFloat(oppStats.toPct ?? "0")}
              tooltip="Opponent Turnover Percentage (Forced TOs)"
            />
            <Factor
              label="ORB%"
              value={parseFloat(oppStats.orbPct ?? "0")}
              isInverse
              tooltip="Opponent Offensive Rebound Percentage (Allowed OREBs)"
            />
            <Factor
              label="FT RATE"
              value={parseFloat(oppStats.ftRate ?? "0")}
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
