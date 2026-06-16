import React from "react";
import { Paper, PaperProps } from "@mui/material";

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
}) => (
  <Paper
    sx={{
      p: "var(--cs-semantic-spacing-sectionCardPadding)",
      bgcolor: "var(--cs-semantic-color-surface-moleskine)",
      border: "1px solid var(--cs-semantic-color-border-subtle)",
      borderRadius: "var(--cs-semantic-shape-radius-lg)",
      boxShadow: "var(--cs-semantic-elevation-shadow-card)",
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);
