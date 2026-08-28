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
  Tooltip,
  Button,
} from "@mui/material";
import { Mic, MicOff, Edit } from "@mui/icons-material";
import { type Game, type Team } from "../../db";
import { useTokens } from "../../theme/useTokens";

interface TrackingModeToolbarProps {
  trackingMode: string;
  onTrackingModeChange: (_mode: string) => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  isReadOnly: boolean;
  game: Game | null;
  team: Team | null;
  onQuickEditRoster?: () => void;
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
      onQuickEditRoster,
    }) => {
      const tokens = useTokens();

      return (
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Tooltip
            title={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
          >
            <IconButton
              onClick={onVoiceToggle}
              color={voiceEnabled ? "primary" : "default"}
              aria-label={
                voiceEnabled ? "Disable voice mode" : "Enable voice mode"
              }
              sx={{
                border: "1px solid",
                borderColor: voiceEnabled
                  ? tokens.semantic.color.brand.primary.main
                  : tokens.semantic.color.border.default,
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
              }}
            >
              {voiceEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>

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

          {onQuickEditRoster && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              disabled={isReadOnly}
              onClick={onQuickEditRoster}
              startIcon={<Edit />}
              aria-label="Quick Edit Roster"
              sx={{
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                borderColor: tokens.semantic.color.border.default,
              }}
            >
              Edit Roster
            </Button>
          )}
        </Stack>
      );
    },
  );

TrackingModeToolbar.displayName = "TrackingModeToolbar";
