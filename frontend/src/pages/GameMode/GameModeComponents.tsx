import React from "react";
import { Tooltip, Button, Typography, Box, Avatar, Chip } from "@mui/material";
import { type Player, type Game, type Team } from "../../db";
import { type PlayerAggregates } from "../../utils/stats";
import { formatClock } from "../../utils/mathUtils";
import { pulse } from "../../styles/animations";
import { useTokens } from "../../theme/useTokens";

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
  ({ type, label, icon: Icon, statType, onClick }) => {
    const tokens = useTokens();
    return (
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
          py: tokens.semantic.spacing.xs / 8,
          minWidth: 80,
          borderColor: tokens.semantic.color.border.default,
          backgroundColor:
            statType === type
              ? tokens.semantic.color.brand.primary.main
              : "transparent",
          color:
            statType === type
              ? tokens.semantic.color.text.inverse
              : tokens.semantic.color.text.primary,
          transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          "&:focus-visible": {
            outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
            outlineOffset: `${tokens.semantic.focus.offset}px`,
          },
        }}
      >
        <Icon sx={{ mb: tokens.semantic.spacing.xs / 16 }} />
        <Typography
          variant="caption"
          sx={{ fontWeight: tokens.typography.fontWeight.bold }}
        >
          {label}
        </Typography>
      </Button>
    );
  },
);

/** Internal helper to avoid inline IIFE for clock color logic. */
const ClockSpan: React.FC<{ stintSecs: number; maxStint: number }> = ({
  stintSecs,
  maxStint,
}) => {
  const tokens = useTokens();
  const color =
    stintSecs > maxStint
      ? tokens.semantic.color.feedback.error.main
      : stintSecs > maxStint * 0.75
        ? tokens.semantic.color.feedback.warning.main
        : "inherit";
  return (
    <Box component="span" sx={{ color }}>
      {formatClock(stintSecs)}
    </Box>
  );
};

QuickAction.displayName = "QuickAction";

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
    const tokens = useTokens();
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
      <Box sx={{ display: "flex", gap: tokens.semantic.spacing.xs / 16, alignItems: "center" }}>
        <Button
          fullWidth
          disabled={isReadOnly}
          variant="contained"
          onClick={() => onClick(player.id!)}
          sx={{
            justifyContent: "flex-start",
            px: tokens.semantic.spacing.xs / 8,
            bgcolor: isFouledOut
              ? tokens.semantic.color.feedback.error.main
              : isFoulTrouble || isFoulTroubleInPeriod
                ? tokens.semantic.color.feedback.warning.main
                : tokens.semantic.color.brand.primary.main,
            color: tokens.semantic.color.text.inverse,
            borderWidth: "1.5px",
            animation:
              isFoulTrouble || isFouledOut || isFoulTroubleInPeriod
                ? `${pulse} 2s infinite ease-in-out`
                : "none",
            "&.Mui-disabled": {
              bgcolor: isFouledOut
                ? tokens.semantic.color.feedback.error.main
                : isFoulTrouble
                  ? tokens.semantic.color.feedback.warning.main
                  : tokens.semantic.color.brand.primary.main,
              color: tokens.semantic.color.text.inverse,
            },
            transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          }}
        >
          <Avatar
            sx={{
              width: 24,
              height: 24,
              mr: tokens.semantic.spacing.xs / 8,
              bgcolor: tokens.semantic.color.background.elevated,
              color: tokens.semantic.color.brand.primary.main,
              fontSize: "0.7rem",
              fontWeight: tokens.typography.fontWeight.bold,
            }}
          >
            {jerseyNumber}
          </Avatar>
          <Box sx={{ flex: 1, textAlign: "left" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                display: "block",
                lineHeight: 1,
                textDecoration: isFouledOut ? "line-through" : "none",
              }}
            >
              {player.name}
              {isFatigued && (
                <Tooltip
                  title={`Fatigue Alert: Exceeded ${maxStint / 60} mins`}
                >
                  <Box component="span" sx={{ ml: tokens.semantic.spacing.xs / 16, fontSize: "0.8rem" }}>
                    ⚠️
                  </Box>
                </Tooltip>
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: "0.6rem", opacity: 0.8 }}
            >
              {stats?.points || 0} pts | {stats?.rebounds || 0} reb | {pf} pf
              |&nbsp;
              <ClockSpan stintSecs={stintSecs} maxStint={maxStint} />
            </Typography>
          </Box>
          {streak === "HOT" && (
            <Box sx={{ fontSize: "0.8rem", ml: tokens.semantic.spacing.xs / 16 }}>🔥</Box>
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
LineupPlayerButton.displayName = "LineupPlayerButton";
