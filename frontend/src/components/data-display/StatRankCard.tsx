import React from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import type { AppTokens } from "../../theme/tokens/tokens";

interface StatRankCardProps {
  label: string;
  value: string | number;
  rank: number;
  total: number;
  percentile: number;
}

function getRingColor(rank: number, total: number, tokens: AppTokens): string {
  const pct = rank / total;
  if (pct <= 0.25) return tokens.semantic.color.feedback.success.main;
  if (pct <= 0.5) return tokens.semantic.color.feedback.warning.main;
  return tokens.semantic.color.text.disabled;
}

function getRankLabel(rank: number, total: number): string {
  if (rank === 1) return "#1 on team";
  const suffix = rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
  return `${rank}${suffix} of ${total}`;
}

export const StatRankCard: React.FC<StatRankCardProps> = ({
  label,
  value,
  rank,
  total,
  percentile,
}) => {
  const tokens = useTokens();
  const ringColor = getRingColor(rank, total, tokens);
  const isTop = rank === 1;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: tokens.semantic.spacing.md / 8,
        px: tokens.semantic.spacing.sm / 8,
      }}
    >
      {/* Radial ring */}
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          mb: tokens.semantic.spacing.xs / 8,
        }}
      >
        {/* Background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={84}
          thickness={3.5}
          sx={{
            color: tokens.semantic.color.border.subtle,
            position: "absolute",
            top: 0,
            left: 0,
          }}
          aria-hidden="true"
        />
        {/* Active ring */}
        <CircularProgress
          variant="determinate"
          value={percentile}
          size={84}
          thickness={3.5}
          sx={{ color: ringColor }}
          aria-label={`${label} percentile rank: ${percentile}%`}
        />
        {/* Center content */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              lineHeight: 1,
              color: tokens.semantic.color.text.primary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.bold,
              letterSpacing: tokens.typography.letterSpacing.wide,
              textTransform: "uppercase",
              color: tokens.semantic.color.text.secondary,
              mt: tokens.semantic.spacing.xs / 16,
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>

      {/* Rank chip */}
      <Chip
        label={getRankLabel(rank, total)}
        size="small"
        sx={{
          height: tokens.semantic.spacing.lg / 8,
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.medium,
          bgcolor: isTop
            ? tokens.semantic.color.feedback.success.light
            : tokens.semantic.color.action.hover,
          color: isTop
            ? tokens.semantic.color.feedback.success.dark
            : tokens.semantic.color.text.secondary,
          "& .MuiChip-label": { px: tokens.semantic.spacing.xs / 8 },
        }}
      />
    </Box>
  );
};

export default StatRankCard;
