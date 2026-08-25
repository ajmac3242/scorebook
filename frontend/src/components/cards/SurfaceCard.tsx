import React from "react";
import { Paper, PaperProps } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

/**
 * Standardized elevated surface container.
 *
 * @param {PaperProps} props - MUI Paper component props.
 * @returns {React.ReactElement}
 */
export const SurfaceCard: React.FC<PaperProps> = ({
  children,
  sx,
  ...props
}) => {
  const tokens = useTokens();

  return (
    <Paper
      className="surface-card"
      sx={{
        p: `${tokens.semantic.spacing.sectionCardPadding}px`,
        bgcolor: tokens.semantic.color.surface.moleskine,
        border: `1px solid ${tokens.semantic.color.border.subtle}`,
        borderRadius: `${tokens.semantic.shape.radius.lg}px`,
        boxShadow: tokens.semantic.elevation.shadow.card,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};
