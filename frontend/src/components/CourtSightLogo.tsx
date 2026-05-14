import React from "react";
import { Box, Typography } from "@mui/material";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";

interface CourtSightLogoProps {
  width?: number;
  markOnly?: boolean;
}

const CourtSightLogo: React.FC<CourtSightLogoProps> = ({
  width = 140,
  markOnly = false,
}) => {
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
          color: "#FF6B1A",
          lineHeight: 0,
        }}>
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
        gap: 1,
        width: "fit-content",
        color: "text.primary",
        lineHeight: 1,
      }}>
      <SportsBasketballIcon
        sx={{
          fontSize: iconSize,
          color: "#FF6B1A",
          flexShrink: 0,
        }} />
      <Typography
        sx={{
          fontSize: Math.max(18, Math.round(width * 0.13)),
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "inherit",
          lineHeight: 1,
        }}>
        <Box component="span" sx={{ color: "#FF6B1A" }}>
          Court
        </Box>
        Sight
      </Typography>
    </Box>
  );
};

export default CourtSightLogo;
