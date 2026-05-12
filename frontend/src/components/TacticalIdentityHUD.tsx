import React from "react";
import { Box, Typography, Stack, LinearProgress, Tooltip } from "@mui/material";
import { pulse } from "../styles/animations";

export interface TacticalKPI {
  key: string;
  label: string;
  value: string | number;
  target?: number;
  goalType: "MIN" | "MAX";
}

interface TacticalIdentityHUDProps { kpis: TacticalKPI[]; }

export const TacticalIdentityHUD: React.FC<TacticalIdentityHUDProps> = ({ kpis }) => {
  if (kpis.length === 0) return null;
  return (
    <Stack direction="row" spacing={3} sx={{ bgcolor: "rgba(0,0,0,0.2)", px: 3, py: 1, borderRadius: "0 0 12px 12px", border: "1px solid rgba(255,255,255,0.05)", borderTop: "none", width: "fit-content", mx: "auto" }}>
      {kpis.map((kpi) => {
        const val = typeof kpi.value === "string" ? parseFloat(kpi.value) : kpi.value;
        const target = kpi.target || 0;
        const isMet = kpi.goalType === "MIN" ? val >= target : val <= target;
        const progress = target > 0 ? Math.min((val / target) * 100, 100) : 0;
        return (
          <Tooltip key={kpi.key} title={`Goal: ${kpi.goalType === "MIN" ? ">=" : "<="} ${target}`}>
            <Box sx={{ minWidth: 80, textAlign: "center" }}>
              <Typography variant="caption" sx={{ display: "block", fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", mb: 0.5 }}>{kpi.label}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isMet ? "success.main" : progress > 70 ? "warning.main" : "white", lineHeight: 1, animation: isMet ? `${pulse} 2s infinite` : "none" }}>{kpi.value}</Typography>
              {target > 0 && <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5, height: 2, borderRadius: 1, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: isMet ? "success.main" : "primary.main" } }} />}
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
};
