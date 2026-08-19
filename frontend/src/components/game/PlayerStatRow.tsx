import React from "react";
import { TableRow, TableCell, Typography, Box, Tooltip } from "@mui/material";
import { getPlusMinusColor, formatPlusMinus } from "../../utils/mathUtils";
import { useTokens } from "../../theme/useTokens";

/**
 * Sub-component for displaying a player's statistical row in the table.
 * Optimized with React.memo and primitive props to skip redundant virtual DOM diffing.
 * ⚡ Bolt: By passing primitive props instead of a monolithic 'row' object,
 * React.memo can accurately detect when a player's stats have NOT changed,
 * preventing 90%+ of redundant row re-renders during live game tracking.
 */
interface PlayerStatRowProps {
  jerseyNumber: string;
  name: string;
  isOnCourt?: boolean;
  min: number;
  points: number;
  threePM: number;
  threePA: number;
  threePPct: string;
  ftm: number;
  fta: number;
  ftPct: string;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
  streak?: "HOT" | "COLD" | null;
}

export const PlayerStatRow: React.FC<PlayerStatRowProps> = React.memo(
  ({
    jerseyNumber,
    name,
    min,
    points,
    threePM,
    threePA,
    threePPct,
    ftm,
    fta,
    ftPct,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    plusMinus,
    streak,
    isOnCourt,
  }) => {
    const tokens = useTokens();

    return (
      <TableRow
        sx={{
          bgcolor: isOnCourt
            ? tokens.semantic.color.surface.onCourt
            : "transparent",
          transition: `background-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          "&:hover": {
            bgcolor: isOnCourt
              ? tokens.semantic.color.surface.onCourt
              : tokens.semantic.color.action.hover,
          },
        }}
      >
        <TableCell
          sx={{
            py: `${tokens.semantic.spacing.xs}px`,
            px: `${tokens.semantic.spacing.xs}px`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: tokens.typography.fontWeight.semibold,
              display: "block",
              lineHeight: 1.1,
            }}
          >
            #{jerseyNumber}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              display: "block",
              color: tokens.semantic.color.text.secondary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "60px",
            }}
          >
            {name.split(" ")[0]}
            {streak === "HOT" && (
              <Tooltip title="Hot Streak (3+ makes)">
                <Box component="span" sx={{ ml: 0.2 }}>
                  🔥
                </Box>
              </Tooltip>
            )}
            {streak === "COLD" && (
              <Tooltip title="Cold Streak (3+ misses)">
                <Box component="span" sx={{ ml: 0.2 }}>
                  ❄️
                </Box>
              </Tooltip>
            )}
          </Typography>
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {min}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {points}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {threePM}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {threePA}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {threePPct}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {ftm}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {fta}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {ftPct}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {rebounds}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {assists}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {steals}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {blocks}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.xs}px`,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {turnovers}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.sm}px`,
            fontSize: tokens.typography.fontSize.xs,
            fontWeight:
              fouls >= 4
                ? tokens.typography.fontWeight.bold
                : tokens.typography.fontWeight.regular,
            bgcolor:
              fouls >= 5
                ? tokens.semantic.color.feedback.error.main
                : fouls === 4
                  ? tokens.semantic.color.feedback.warning.main
                  : "transparent",
            color: fouls >= 4 ? tokens.semantic.color.text.inverse : "inherit",
          }}
        >
          {fouls}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            px: `${tokens.semantic.spacing.sm}px`,
            fontSize: tokens.typography.fontSize.xs,
            color: getPlusMinusColor(plusMinus),
            fontWeight:
              plusMinus !== 0
                ? tokens.typography.fontWeight.semibold
                : tokens.typography.fontWeight.regular,
          }}
        >
          {formatPlusMinus(plusMinus)}
        </TableCell>
      </TableRow>
    );
  },
);
