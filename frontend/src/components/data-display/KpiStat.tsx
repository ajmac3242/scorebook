import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import type { AppTokens } from "../../theme/tokens/tokens";

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

const fontSizeMap = (tokens: AppTokens) => ({
  sm: tokens.typography.fontSize.lg,
  md: tokens.typography.fontSize.xl,
  lg: tokens.typography.fontSize["2xl"],
});

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

  return (
    <Box sx={{ textAlign: light ? "center" : "inherit" }}>
      <Typography
        sx={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.semantic.typography.overline.fontWeight,
          letterSpacing: tokens.semantic.typography.overline.letterSpacing,
          textTransform: tokens.semantic.typography.overline.textTransform,
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
            fontSize: fontSizeMap(tokens)[size],
            fontWeight: tokens.semantic.typography.h1.fontWeight,
            color: isEmpty
              ? light
                ? tokens.semantic.color.text.inverseDisabled
                : tokens.semantic.color.text.disabled
              : (valueColor ??
                (light ? inverseColor : tokens.semantic.color.text.primary)),
            lineHeight: tokens.semantic.typography.h1.lineHeight,
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
            color: light
              ? tokens.semantic.color.text.inverseSubtle
              : tokens.semantic.color.text.secondary,
            display: "block",
            mt: tokens.semantic.spacing.xs / 16,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
};

export default KpiStat;
