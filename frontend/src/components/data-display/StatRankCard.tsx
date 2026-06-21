import React from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import type { AppTokens } from "../../theme/tokens/tokens";

interface StatRankCardProps {
  label: string;
  value: string | number;
  rank: number;
  total: number;
  percentile: number;
}

function getRingColor(
  rank: number,
  total: number,
  tokens: AppTokens,
): string {
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
  const theme = useTheme();
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
        py: 2.5,
        px: 1.5,
      }}
    >
      {/* Radial ring */}
      <Box sx={{ position: "relative", display: "inline-flex", mb: 1.25 }}>
        {/* Background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={84}
          thickness={3.5}
          sx={{
            color: theme.palette.divider,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        {/* Active ring */}
        <CircularProgress
          variant="determinate"
          value={percentile}
          size={84}
          thickness={3.5}
          sx={{ color: ringColor }}
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
              fontWeight: theme.typography.fontWeightBold,
              lineHeight: 1,
              color: theme.palette.text.primary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: 700,
              letterSpacing: tokens.typography.letterSpacing.wide,
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
              mt: 0.25,
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
          height: 20,
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeightMedium,
          bgcolor: isTop
            ? tokens.semantic.color.feedback.success.light
            : theme.palette.action.hover,
          color: isTop
            ? tokens.semantic.color.feedback.success.dark
            : theme.palette.text.secondary,
          "& .MuiChip-label": { px: 1 },
        }}
      />
    </Box>
  );
};

export default StatRankCard;
