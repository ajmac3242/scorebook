import React from "react";
import { Box, Typography } from "@mui/material";

type KpiStatProps = {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
};

const fontSizeMap = {
  sm: "var(--cs-typography-fontSize-lg)",
  md: "var(--cs-typography-fontSize-xl)",
  lg: "var(--cs-typography-fontSize-2xl)",
};

const KpiStat: React.FC<KpiStatProps> = ({
  label,
  value,
  valueColor,
  subtitle,
  size = "md",
  light,
}) => (
  <Box sx={{ textAlign: light ? "center" : "inherit" }}>
    <Typography
      sx={{
        fontSize: "var(--cs-typography-fontSize-xs)",
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: light ? "rgba(255, 255, 255, 0.7)" : "text.secondary",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: fontSizeMap[size],
        fontWeight: 800,
        color: valueColor ?? (light ? "white" : "text.primary"),
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Typography>
    {subtitle ? (
      <Typography
        variant="caption"
        color={light ? "rgba(255, 255, 255, 0.6)" : "text.secondary"}
        sx={{ display: "block", mt: 0.25 }}
      >
        {subtitle}
      </Typography>
    ) : null}
  </Box>
);

export default KpiStat;
