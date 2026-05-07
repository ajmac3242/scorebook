import React from "react";
import { Box, Typography } from "@mui/material";
import { AnimatedNumber } from "./AnimatedNumber";

/**
 * Interface representing the props for the StatItem component.
 */
interface StatItemProps {
  label: string;
  value: string | number;
  light?: boolean;
}

/**
 * Standardized component for displaying a single numerical statistic with a label.
 *
 * @param {StatItemProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const StatItem: React.FC<StatItemProps> = ({ label, value, light }) => (
  <Box
    sx={{ textAlign: "center" }}
    role="img"
    aria-label={`${label}: ${value}`}
  >
    <Typography
      variant="caption"
      sx={{ opacity: 0.8, color: light ? "white" : "text.secondary" }}
      aria-hidden="true"
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{ fontWeight: 700, color: light ? "white" : "text.primary" }}
      aria-hidden="true"
    >
      {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
    </Typography>
  </Box>
);
