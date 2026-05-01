import React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  Gavel as GavelIcon,
  Scale as BalanceIcon,
} from "@mui/icons-material";
import { MoleskineCard } from "../SharedUI";
import { OfficiatingStats } from "../../utils/stats";
import { ANALYTICAL_BASELINES } from "../../constants/stats";

export const OfficiatingHUD: React.FC<{
  stats: OfficiatingStats;
}> = ({ stats }) => {
  const isTight = stats.tightness === "HIGH";

  return (
    <MoleskineCard sx={{ borderLeft: isTight ? "6px solid #f44336" : "1px solid rgba(0,0,0,0.12)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <BalanceIcon sx={{ fontSize: 18, color: "primary.main" }} /> OFFICIATING
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sx={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", textAlign: "center" }}>
            TEAM FOULS
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, textAlign: "center" }}>
            {stats.teamFouls} ({stats.teamFoulPct.toFixed(1)}%)
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", textAlign: "center" }}>
            OPP FOULS
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, textAlign: "center" }}>
            {stats.oppFouls} ({stats.oppFoulPct.toFixed(1)}%)
          </Typography>
        </Grid>
      </Grid>

      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: isTight ? "error.main" : "text.secondary" }}>
            REF TIGHTNESS (FPM)
          </Typography>
          {isTight && <Chip label="TIGHT" size="small" color="error" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 900 }} />}
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, (stats.fpm / (ANALYTICAL_BASELINES.BASELINE_FPM * 2)) * 100)}
          color={isTight ? "error" : "primary"}
          sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.05)" }}
        />
        <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5, fontSize: "0.6rem", opacity: 0.6 }}>
          {stats.fpm.toFixed(2)} fouls/min
        </Typography>
      </Box>
    </MoleskineCard>
  );
};
