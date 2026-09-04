import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

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

const KpiStat: React.FC<KpiStatProps> = ({
  label,
  value,
  valueColor,
  subtitle,
  size = "md",
  light,
  isEmpty = false,
}) => {
  const tokens = useTokens();
  const inverseColor = tokens.semantic.color.text.inverse;

  const fontSizeMap = {
    sm: tokens.typography.fontSize.lg,
    md: tokens.typography.fontSize.xl,
    lg: tokens.typography.fontSize["2xl"],
  };

  return (
    <Box
      aria-label={`${label} metric: ${isEmpty ? "No data" : value}`}
      sx={{ textAlign: light ? "center" : "inherit" }}
    >
      <Typography
        sx={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.bold,
          letterSpacing: tokens.typography.letterSpacing.wider,
          textTransform: "uppercase",
          color: light
            ? tokens.semantic.color.text.inverseMuted
            : tokens.semantic.color.text.secondary,
          mb: tokens.semantic.spacing.xs / 8,
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
            fontWeight: tokens.typography.fontWeight.black,
            color: isEmpty
              ? light
                ? tokens.semantic.color.text.inverseDisabled
                : tokens.semantic.color.text.disabled
              : (valueColor ??
                (light ? inverseColor : tokens.semantic.color.text.primary)),
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
          sx={{
            display: "block",
            mt: `${tokens.semantic.spacing.xs / 2}px`,
            color: light
              ? tokens.semantic.color.text.inverseSubtle
              : tokens.semantic.color.text.secondary,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
};

export default KpiStat;
