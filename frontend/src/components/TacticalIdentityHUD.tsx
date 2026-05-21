import React from "react";
import { Box, Typography, Stack, LinearProgress, Tooltip } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

/**
 * @file TacticalIdentityHUD.tsx
 * @description Header widget tracking coach-selected KPIs (Tactical Identity Adherence).
 */

export interface IdentityKPI {
  name: string;
  value: number | string;
  target: number;
  label: string;
  isPercentage?: boolean;
  inverse?: boolean; // True if lower is better (e.g., Turnover Rate)
}

interface TacticalIdentityHUDProps {
  kpis: IdentityKPI[];
}

const getKPIDescription = (name: string) => {
  switch (name) {
    case "stop_pct":
      return "Stop %: Percentage of opponent possessions that result in zero points.";
    case "efg":
      return "eFG%: Effective Field Goal Percentage - adjusts for the fact that 3PT shots are worth more than 2PT shots.";
    case "paint_touches":
      return "Paint Touches: Number of times the ball enters the key during offensive possessions.";
    default:
      return "";
  }
};

export const TacticalIdentityHUD: React.FC<TacticalIdentityHUDProps> = ({
  kpis,
}) => {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        width: "100%",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {kpis.map((kpi) => {
        const val =
          typeof kpi.value === "string" ? parseFloat(kpi.value) : kpi.value;
        const progress = Math.min((val / kpi.target) * 100, 100);
        const isMet = kpi.inverse ? val <= kpi.target : val >= kpi.target;
        const description = getKPIDescription(kpi.name);

        return (
          <Box
            key={kpi.name}
            sx={{ flex: 1, maxWidth: 200 }}
            aria-label={`${kpi.label}: ${kpi.value}${kpi.isPercentage ? "%" : ""}. Target: ${kpi.target}${kpi.isPercentage ? "%" : ""}`}
          >
            <Stack
              direction="row"
              sx={{
                mb: 0.5,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Tooltip title={description} arrow placement="top">
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    fontSize: "0.6rem",
                    color: "var(--cs-semantic-color-text-secondary)",
                    cursor: "help",
                    borderBottom:
                      "1px dotted var(--cs-semantic-color-border-subtle)",
                  }}
                >
                  {kpi.label.toUpperCase()}
                </Typography>
              </Tooltip>
              {isMet && (
                <CheckCircle
                  sx={{
                    fontSize: 12,
                    color: "var(--cs-semantic-color-feedback-success-main)",
                  }}
                />
              )}
            </Stack>
            <Tooltip
              title={`Goal: ${kpi.target}${kpi.isPercentage ? "%" : ""}`}
            >
              <Box sx={{ position: "relative" }}>
                <LinearProgress
                  variant="determinate"
                  value={kpi.inverse ? 100 - progress : progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor:
                      "var(--cs-semantic-color-action-disabledBackground)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: isMet
                        ? "var(--cs-semantic-color-feedback-success-main)"
                        : "var(--cs-semantic-color-brand-primary-main)",
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Tooltip>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                fontSize: "1rem",
                mt: 0.2,
                color: "var(--cs-semantic-color-text-primary)",
              }}
            >
              {kpi.value}
              {kpi.isPercentage ? "%" : ""}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};
