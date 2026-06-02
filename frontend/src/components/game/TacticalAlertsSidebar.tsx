import React from "react";
import { Box, Typography, Paper, Stack, Button } from "@mui/material";
import {
  Warning,
  Error as ErrorIcon,
  SwapHoriz,
  Gavel,
} from "@mui/icons-material";

/**
 * @file TacticalAlertsSidebar.tsx
 * @description Proactive side-rail HUD for real-time tactical risk management (HALT).
 */

export interface TacticalAlert {
  id: string;
  type: "FATIGUE" | "FOUL" | "CONFLICT" | "BONUS" | "CLUTCH" | "REF_CONFLICT";
  severity: "WARNING" | "CRITICAL" | "warning" | "error" | "info";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface TacticalAlertsSidebarProps {
  alerts: TacticalAlert[];
}

export const TacticalAlertsSidebar: React.FC<TacticalAlertsSidebarProps> = ({
  alerts,
}) => {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-secondary)",
          mb: "var(--cs-semantic-spacing-md)",
          display: "block",
          textTransform: "uppercase",
          letterSpacing: "var(--cs-typography-letterSpacing-wider)",
        }}
      >
        Tactical Alerts (HALT)
      </Typography>
      <Stack spacing={1.5}>
        {alerts.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ fontStyle: "italic", opacity: 0.5 }}
          >
            No active tactical threats.
          </Typography>
        ) : (
          alerts.map((alert) => (
            <Paper
              key={alert.id}
              elevation={0}
              sx={{
                p: "var(--cs-semantic-spacing-md)",
                borderLeft: "4px solid",
                borderColor:
                  alert.severity === "CRITICAL" || alert.severity === "error"
                    ? "var(--cs-semantic-color-feedback-error-main)"
                    : alert.severity === "info"
                      ? "var(--cs-semantic-color-feedback-info-main)"
                      : "var(--cs-semantic-color-feedback-warning-main)",
                bgcolor:
                  alert.severity === "CRITICAL" || alert.severity === "error"
                    ? "var(--cs-semantic-color-feedback-error-light)"
                    : alert.severity === "info"
                      ? "var(--cs-semantic-color-feedback-info-light)"
                      : "var(--cs-semantic-color-feedback-warning-light)",
                borderRadius: "var(--cs-semantic-shape-radius-md)",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "flex-start" }}
              >
                {alert.severity === "CRITICAL" || alert.severity === "error" ? (
                  <ErrorIcon color="error" fontSize="small" />
                ) : (
                  <Warning
                    color={alert.severity === "info" ? "info" : "warning"}
                    fontSize="small"
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      display: "block",
                      mb: 0.5,
                      color: "var(--cs-semantic-color-text-primary)",
                    }}
                  >
                    {alert.message}
                  </Typography>
                  {alert.actionLabel && (
                    <Button
                      size="small"
                      variant="outlined"
                      color={
                        alert.severity === "CRITICAL" ? "error" : "warning"
                      }
                      onClick={alert.onAction}
                      sx={{
                        fontSize: "0.6rem",
                        py: 0,
                        px: 1,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                      startIcon={
                        alert.type === "FATIGUE" ? (
                          <SwapHoriz />
                        ) : alert.type === "FOUL" ? (
                          <Gavel />
                        ) : undefined
                      }
                    >
                      {alert.actionLabel}
                    </Button>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Box>
  );
};
