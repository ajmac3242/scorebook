/**
 * @file TrackingModeToolbar.tsx
 * @description Voice mode toggle + Team/Opponent tracking mode selector.
 * Allows coaches to switch between recording team stats and opponent stats.
 */
import React from "react";
import {
  Stack,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Mic, MicOff } from "@mui/icons-material";
import { type Game, type Team } from "../../db";

interface TrackingModeToolbarProps {
  trackingMode: string;
  onTrackingModeChange: (_mode: string) => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  isReadOnly: boolean;
  game: Game | null;
  team: Team | null;
}

export const TrackingModeToolbar: React.FC<TrackingModeToolbarProps> =
  React.memo(
    ({
      trackingMode,
      onTrackingModeChange,
      voiceEnabled,
      onVoiceToggle,
      isReadOnly,
      game,
      team,
    }) => (
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <IconButton
          onClick={onVoiceToggle}
          color={voiceEnabled ? "primary" : "default"}
          aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
          sx={{
            border: "1px solid",
            borderColor: voiceEnabled ? "primary.main" : "divider",
            borderRadius: 1,
          }}
        >
          {voiceEnabled ? <Mic /> : <MicOff />}
        </IconButton>

        <ToggleButtonGroup
          value={trackingMode}
          exclusive
          onChange={(_e, val) => val && onTrackingModeChange(val)}
          size="small"
          disabled={isReadOnly}
          aria-disabled={isReadOnly || undefined}
          sx={{ width: { xs: "100%", sm: "auto" } }}
          aria-label="Tracking mode"
        >
          <ToggleButton
            value="TEAM"
            aria-label={`Track ${team?.name || "Our Team"}`}
          >
            {team?.name || "Our Team"}
          </ToggleButton>
          <ToggleButton
            value="OPPONENT"
            aria-label={`Track ${game?.opponent || "Opponent"}`}
          >
            {game?.opponent || "Opponent"}
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    ),
  );

TrackingModeToolbar.displayName = "TrackingModeToolbar";
