import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Warning, SwapHoriz, FlashOn, Shield } from "@mui/icons-material";
import { HaltAlert } from "../utils/stats";
import { pulse } from "../styles/animations";

interface TacticalAlertsHUDProps {
  alerts: HaltAlert[];
  onAction: (alert: HaltAlert) => void;
}

export const TacticalAlertsHUD: React.FC<TacticalAlertsHUDProps> = ({ alerts, onAction }) => {
  if (alerts.length === 0) return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", mb: 1.5, display: "block", letterSpacing: 1 }}>
        Tactical Alerts
      </Typography>
      <Stack spacing={1.5}>
        {alerts.map((alert) => (
          <Box key={alert.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: alert.severity === "error" ? "rgba(244, 67, 54, 0.08)" : alert.severity === "warning" ? "rgba(255, 152, 0, 0.08)" : "rgba(33, 150, 243, 0.08)", border: `1px solid ${alert.severity === "error" ? "rgba(244, 67, 54, 0.2)" : alert.severity === "warning" ? "rgba(255, 152, 0, 0.2)" : "rgba(33, 150, 243, 0.2)"}`, animation: alert.severity === "error" ? `${pulse} 2s infinite` : "none" }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: alert.severity === "error" ? "error.main" : alert.severity === "warning" ? "warning.main" : "info.main" }}>
                {alert.type === "FOUL" && <Warning fontSize="small" />}
                {alert.type === "FATIGUE" && <SwapHoriz fontSize="small" />}
                {alert.type === "REF_CONFLICT" && <Shield fontSize="small" />}
                {alert.type === "BONUS" && <FlashOn fontSize="small" />}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, display: "block", mb: 1 }}>{alert.message}</Typography>
                {(alert.type === "FOUL" || alert.type === "FATIGUE") && alert.playerId && (
                  <Button size="small" variant="contained" color={alert.severity === "error" ? "error" : "warning"} startIcon={<SwapHoriz />} onClick={() => onAction(alert)} sx={{ fontSize: "0.6rem", fontWeight: 800, py: 0.5, textTransform: "uppercase" }}>SUB NOW</Button>
                )}
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
