import React from "react";
import { Box, Typography } from "@mui/material";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import { useTokens } from "../theme/useTokens";

interface CourtSightLogoProps {
  width?: number;
  markOnly?: boolean;
}

const CourtSightLogo: React.FC<CourtSightLogoProps> = ({
  width = 140,
  markOnly = false,
}) => {
  const tokens = useTokens();
  const iconSize = Math.max(24, Math.round(width * 0.22));

  if (markOnly) {
    return (
      <Box
        aria-label="CourtSight mark"
        role="img"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: tokens.semantic.color.emphasis.clutch,
          lineHeight: 0,
        }}
      >
        <SportsBasketballIcon sx={{ fontSize: iconSize }} />
      </Box>
    );
  }

  return (
    <Box
      aria-label="CourtSight"
      role="img"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: tokens.spacing[1] / 8,
        width: "fit-content",
        color: tokens.semantic.color.text.primary,
        lineHeight: 1,
      }}
    >
      <SportsBasketballIcon
        sx={{
          fontSize: iconSize,
          color: tokens.semantic.color.emphasis.clutch,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: Math.max(18, Math.round(width * 0.13)),
          fontWeight: tokens.typography.fontWeight.bold,
          letterSpacing: tokens.typography.letterSpacing.tighter,
          color: "inherit",
          lineHeight: 1,
        }}
      >
        <Box component="span" sx={{ color: tokens.semantic.color.emphasis.clutch }}>
          Court
        </Box>
        Sight
      </Typography>
    </Box>
  );
};

export default CourtSightLogo;
