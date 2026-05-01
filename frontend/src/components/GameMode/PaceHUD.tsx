import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import { ElectricBolt as ElectricBoltIcon } from "@mui/icons-material";
import { MoleskineCard } from "../SharedUI";
import { PaceAnalytics } from "../../utils/stats";

export const PaceHUD: React.FC<{
  analytics: PaceAnalytics;
  identityPace: number;
}> = ({ analytics, identityPace }) => {
  const isFastShift = analytics.pace > identityPace * 1.15;
  const isSlowShift = analytics.pace < identityPace * 0.85;

  return (
    <MoleskineCard
      sx={{
        bgcolor: analytics.paceShift ? "rgba(255, 235, 59, 0.05)" : "inherit",
        border: analytics.paceShift
          ? "1px solid #fbc02d"
          : "1px solid rgba(0,0,0,0.12)",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: "text.primary",
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <ElectricBoltIcon sx={{ fontSize: 18, color: "#ffb300" }} /> PACE &
        PRESSURE
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
            {analytics.pace > 0 ? analytics.pace.toFixed(0) : "0"}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>
            POSS / 40M
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: analytics.tempoDelta > 0 ? "success.main" : "error.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {analytics.tempoDelta > 0 ? "+" : ""}
            {analytics.tempoDelta.toFixed(1)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, opacity: 0.6, fontSize: "0.6rem" }}
          >
            VS IDENTITY ({identityPace})
          </Typography>
        </Box>
      </Box>

      {analytics.paceShift && (
        <Alert
          severity="warning"
          icon={false}
          sx={{
            mt: 2,
            py: 0,
            px: 1,
            fontSize: "0.65rem",
            fontWeight: 800,
            "& .MuiAlert-message": { p: 0.5 },
          }}
        >
          TEMPO SHIFT:{" "}
          {isFastShift
            ? "SPEEDING UP"
            : isSlowShift
              ? "SLOWING DOWN"
              : "VOLATILE"}
        </Alert>
      )}
    </MoleskineCard>
  );
};
