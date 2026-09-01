/**
 * @file VoiceModeBanner.tsx
 * @description Displays an alert banner when voice mode is active or paused.
 * Shows real-time listening state and last heard transcript.
 */
import React from "react";
import { Alert, Typography } from "@mui/material";
import { Mic, MicOff } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

interface VoiceModeBannerProps {
  isListening: boolean;
  lastTranscript: string;
}

export const VoiceModeBanner: React.FC<VoiceModeBannerProps> = React.memo(
  ({ isListening, lastTranscript }) => {
    const tokens = useTokens();
    return (
      <Alert
        severity={isListening ? "success" : "warning"}
        icon={
          isListening ? <Mic fontSize="small" /> : <MicOff fontSize="small" />
        }
        sx={{
          mb: tokens.semantic.spacing.md / 8,
          borderRadius: `${tokens.semantic.shape.radius.md}px`,
          fontWeight: tokens.typography.fontWeight.bold,
        }}
      >
        {isListening
          ? "Voice Mode Active: Listening for commands..."
          : "Voice Mode Paused"}
        {lastTranscript && (
          <Typography
            variant="caption"
            sx={{
              mt: tokens.semantic.spacing.xs / 16,
              opacity: 0.85,
              display: "block",
            }}
          >
            Last heard: &ldquo;{lastTranscript}&rdquo;
          </Typography>
        )}
      </Alert>
    );
  },
);

VoiceModeBanner.displayName = "VoiceModeBanner";
