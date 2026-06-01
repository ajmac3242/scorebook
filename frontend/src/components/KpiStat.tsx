import React from "react";
import { Box, Typography } from "@mui/material";

type KpiStatProps = {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
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
}) => (
  <Box>
    <Typography
      sx={{
        fontSize: "var(--cs-typography-fontSize-xs)",
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "text.secondary",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: fontSizeMap[size],
        fontWeight: 800,
        color: valueColor ?? "text.primary",
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Typography>
    {subtitle ? (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 0.25 }}
      >
        {subtitle}
      </Typography>
    ) : null}
  </Box>
);

export default KpiStat;
