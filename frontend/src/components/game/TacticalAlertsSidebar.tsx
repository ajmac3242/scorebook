import React from "react";
import { Box, Typography, Paper, Stack, Button } from "@mui/material";
import {
  Warning,
  Error as ErrorIcon,
  SwapHoriz,
  Gavel,
} from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

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
  const tokens = useTokens();

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.secondary,
          mb: `${tokens.semantic.spacing.md}px`,
          display: "block",
          textTransform: "uppercase",
          letterSpacing: tokens.typography.letterSpacing.wider,
        }}
      >
        Tactical Alerts (HALT)
      </Typography>
      <Stack
        spacing={`${tokens.semantic.spacing.sm}px`}
        role="region"
        aria-live="polite"
        aria-label="Tactical alerts list"
      >
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
                p: `${tokens.semantic.spacing.md}px`,
                borderLeft: "4px solid",
                borderColor:
                  alert.severity === "CRITICAL" || alert.severity === "error"
                    ? tokens.semantic.color.feedback.error.main
                    : alert.severity === "info"
                      ? tokens.semantic.color.feedback.info.main
                      : tokens.semantic.color.feedback.warning.main,
                bgcolor:
                  alert.severity === "CRITICAL" || alert.severity === "error"
                    ? tokens.semantic.color.feedback.error.light
                    : alert.severity === "info"
                      ? tokens.semantic.color.feedback.info.light
                      : tokens.semantic.color.feedback.warning.light,
                borderRadius: `${tokens.semantic.shape.radius.md}px`,
              }}
            >
              <Stack
                direction="row"
                spacing={tokens.semantic.spacing.xs / 8}
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
                      fontWeight: tokens.typography.fontWeight.bold,
                      display: "block",
                      mb: `${tokens.semantic.spacing.xs / 2}px`,
                      color: tokens.semantic.color.text.primary,
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
                        fontSize: tokens.typography.fontSize.xs,
                        py: 0,
                        px: `${tokens.semantic.spacing.xs}px`,
                        textTransform: "none",
                        fontWeight: tokens.typography.fontWeight.black,
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
