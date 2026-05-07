import React from "react";
import { Box, Typography } from "@mui/material";
import { pulse } from "../styles/animations";
import { HaltAlert } from "../utils/stats";

interface HaltAlertsOverlayProps {
  haltAlerts: HaltAlert[];
}

export const HaltAlertsOverlay: React.FC<HaltAlertsOverlayProps> = ({ haltAlerts }) => {
  if (haltAlerts.length === 0) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      {haltAlerts.map((alert) => (
        <Box
          key={alert.id}
          sx={{
            bgcolor:
              alert.severity === "error"
                ? "error.main"
                : alert.severity === "warning"
                  ? "warning.main"
                  : "info.main",
            color: alert.severity === "warning" ? "black" : "white",
            px: 3,
            py: 1,
            borderRadius: 2,
            mb: 1,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            animation: `${pulse} 2s infinite ease-in-out`,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, fontSize: "1.2rem" }}
          >
            {alert.message}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default HaltAlertsOverlay;
