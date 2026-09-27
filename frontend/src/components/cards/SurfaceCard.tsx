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

  const role = props["aria-label"] ? "region" : undefined;

  return (
    <Paper
      className="surface-card"
      role={role}
      sx={{
        p: `${tokens.semantic.spacing.sectionCardPadding}px`,
        bgcolor: tokens.semantic.color.surface.moleskine,
        border: `${tokens.semantic.focus.width / 2}px solid ${tokens.semantic.color.border.subtle}`,
        borderRadius: `${tokens.semantic.shape.radius.lg}px`,
        boxShadow: tokens.semantic.elevation.shadow.card,
        transition: `box-shadow ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}, border-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
        "&:focus-visible": {
          outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
          outlineOffset: `${tokens.semantic.focus.offset}px`,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};
