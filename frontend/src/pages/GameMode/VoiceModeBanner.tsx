/**
 * @file VoiceModeBanner.tsx
 * @description Displays an alert banner when voice mode is active or paused.
 * Shows real-time listening state and last heard transcript.
 */
import React from "react";
import { Alert, Typography } from "@mui/material";
import { Mic, MicOff } from "@mui/icons-material";

interface VoiceModeBannerProps {
  isListening: boolean;
  lastTranscript: string;
}

export const VoiceModeBanner: React.FC<VoiceModeBannerProps> = React.memo(
  ({ isListening, lastTranscript }) => (
    <Alert
      severity={isListening ? "success" : "warning"}
      icon={isListening ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
      sx={{ mb: 2, borderRadius: 2, fontWeight: 700 }}
    >
      {isListening
        ? "Voice Mode Active: Listening for commands..."
        : "Voice Mode Paused"}
      {lastTranscript && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.85 }}>
          Last heard: &ldquo;{lastTranscript}&rdquo;
        </Typography>
      )}
    </Alert>
  ),
);

VoiceModeBanner.displayName = "VoiceModeBanner";
