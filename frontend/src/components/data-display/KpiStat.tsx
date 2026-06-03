import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";

type KpiStatProps = {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
  /** When true, renders — instead of value (no games played yet). */
  isEmpty?: boolean;
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
  isEmpty = false,
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
    <Tooltip
      title={isEmpty ? "No games played yet" : ""}
      placement="top"
      disableHoverListener={!isEmpty}
      disableFocusListener={!isEmpty}
      disableTouchListener={!isEmpty}
    >
      <Typography
        sx={{
          fontSize: fontSizeMap[size],
          fontWeight: 800,
          color: isEmpty
            ? light
              ? "rgba(255, 255, 255, 0.35)"
              : "text.disabled"
            : (valueColor ?? (light ? "white" : "text.primary")),
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isEmpty ? "—" : value}
      </Typography>
    </Tooltip>
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
