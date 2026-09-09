/**
 * @file FoulTroubleAlertBanner.tsx
 * @description Renders a real-time HUD alert banner when an on-court player enters foul trouble (foulLimit - 1).
 */
import React from "react";
import { Alert, Box, Typography } from "@mui/material";
import { Warning } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

export interface FoulTroubleAlert {
  playerId: string;
  jerseyNumber: string;
  playerName: string;
  foulCount: number;
}

interface FoulTroubleAlertBannerProps {
  alert: FoulTroubleAlert | null;
  onDismiss: () => void;
}

export const FoulTroubleAlertBanner: React.FC<FoulTroubleAlertBannerProps> = React.memo(
  ({ alert, onDismiss }) => {
    const tokens = useTokens();

    if (!alert) return null;

    return (
      <Alert
        severity="warning"
        variant="filled"
        role="alert"
        aria-live="assertive"
        icon={<Warning fontSize="small" />}
        onClose={onDismiss}
        data-testid="foul-trouble-alert-banner"
        sx={{
          mb: tokens.semantic.spacing.md / 8,
          borderRadius: `${tokens.semantic.shape.radius.md}px`,
          fontWeight: tokens.typography.fontWeight.bold,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography
            component="span"
            variant="subtitle2"
            sx={{ fontWeight: tokens.typography.fontWeight.black }}
          >
            #{alert.jerseyNumber} {alert.playerName}
          </Typography>
          <Typography component="span" variant="body2">
            - Foul Trouble ({alert.foulCount} Fouls)
          </Typography>
        </Box>
      </Alert>
    );
  },
);

FoulTroubleAlertBanner.displayName = "FoulTroubleAlertBanner";
