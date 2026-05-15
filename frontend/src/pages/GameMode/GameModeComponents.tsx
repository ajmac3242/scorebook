import React from "react";
import {
  Tooltip,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";
import { type Player, type Game, type Team } from "../../db";
import { type PlayerAggregates } from "../../utils/stats";
import { formatClock } from "../../utils/mathUtils";
import { pulse } from "../../styles/animations";

/**
 * @file GameModeComponents.tsx
 * @description Shared sub-components for the GameMode page.
 */

interface QuickActionProps {
  type: string;
  label: string;
  icon: React.ElementType;
  statType: string | null;
  onClick: (_type: string | null) => void;
}

/**
 * ⚡ Bolt: Memoized quick action button to prevent redundant renders
 * during high-frequency stat recording.
 */
export const QuickAction: React.FC<QuickActionProps> = React.memo(
  ({ type, label, icon: Icon, statType, onClick }) => (
    <Tooltip title={label} arrow>
      <Button
        variant={statType === type ? "contained" : "outlined"}
        color="inherit"
        aria-pressed={statType === type}
        aria-label={`Record ${label}`}
        onClick={() => {
          onClick(type);
        }}
        sx={{
          flexDirection: "column",
          py: 2,
          minWidth: 80,
          borderColor: "#D1D1D1",
          backgroundColor: statType === type ? "primary.main" : "transparent",
          color: statType === type ? "white" : "text.primary",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: "2px",
          },
        }}
      >
        <Icon sx={{ mb: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Button>
    </Tooltip>
  ),
);

interface LineupPlayerButtonProps {
  player: Player;
  stats: PlayerAggregates | undefined;
  jerseyNumber: string;
  isReadOnly: boolean;
  period: number;
  game: Game | null;
  team: Team | null;
  stintSecs: number;
  periodFouls: number;
  streak: string | undefined;
  onClick: (_playerId: string) => void;
}

/**
 * ⚡ Bolt: Memoized lineup button. Uses primitive props where possible
 * to optimize React's shallow comparison during rapid game events.
 */
export const LineupPlayerButton: React.FC<LineupPlayerButtonProps> = React.memo(
  ({
    player,
    stats,
    jerseyNumber,
    isReadOnly,
    period,
    game,
    team,
    stintSecs,
    periodFouls,
    streak,
    onClick,
  }) => {
    const theme = useTheme();
    const pf = stats?.fouls || 0;
    const foulLimit = game?.foulLimit || team?.defaultFoulLimit || 5;
    const isFoulTrouble = pf === foulLimit - 1;
    const isFouledOut = pf >= foulLimit;

    const curPeriodKey = `P${period}`;
    const periodFoulLimit = team?.foulWarningThresholds?.[curPeriodKey] || 99;
    const isFoulTroubleInPeriod = periodFouls >= periodFoulLimit;

    const maxStint = (team?.maxStintDuration || 8) * 60;
    const isFatigued = stintSecs > maxStint;

    return (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Button
          fullWidth
          disabled={isReadOnly}
          variant="contained"
          onClick={() => onClick(player.id!)}
          sx={{
            justifyContent: "flex-start",
            px: 1,
            bgcolor: isFouledOut
              ? "error.main"
              : isFoulTrouble || isFoulTroubleInPeriod
                ? "warning.main"
                : "primary.main",
            color: "white",
            borderWidth: "1.5px",
            animation:
              isFoulTrouble || isFouledOut || isFoulTroubleInPeriod
                ? `${pulse} 2s infinite ease-in-out`
                : "none",
            "&.Mui-disabled": {
              bgcolor: isFouledOut
                ? "error.main"
                : isFoulTrouble
                  ? "warning.main"
                  : "primary.main",
              color: "white",
            },
          }}
        >
          <Avatar
            sx={{
              width: 24,
              height: 24,
              mr: 1,
              bgcolor: "white",
              color: "primary.main",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            {jerseyNumber}
          </Avatar>
          <Box sx={{ flex: 1, textAlign: "left" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: "block", lineHeight: 1 }}
            >
              {player.name}
              {isFatigued && (
                <Tooltip
                  title={`Fatigue Alert: Exceeded ${maxStint / 60} mins`}
                >
                  <Box component="span" sx={{ ml: 0.5, fontSize: "0.8rem" }}>
                    ⚠️
                  </Box>
                </Tooltip>
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: "0.6rem", opacity: 0.8 }}
            >
              {stats?.points || 0} pts | {stats?.rebounds || 0} reb | {pf} pf |{" "}
              {(() => {
                const color =
                  stintSecs > maxStint
                    ? theme.palette.error.main
                    : stintSecs > maxStint * 0.75
                      ? theme.palette.warning.main
                      : "inherit";
                return (
                  <Box component="span" sx={{ color }}>
                    {formatClock(stintSecs)}
                  </Box>
                );
              })()}
            </Typography>
          </Box>
          {streak === "HOT" && (
            <Box sx={{ fontSize: "0.8rem", ml: 0.5 }}>🔥</Box>
          )}
          {isFouledOut && (
            <Chip
              label="OUT"
              size="small"
              color="error"
              sx={{ height: 16, fontSize: "0.5rem" }}
            />
          )}
        </Button>
      </Box>
    );
  },
);
