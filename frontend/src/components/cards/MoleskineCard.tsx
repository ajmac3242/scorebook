import React from "react";
import { Paper, PaperProps } from "@mui/material";

/**
 * Standardized card component with Moleskine-style paper effects.
 *
 * @param {PaperProps} props - MUI Paper component props.
 * @returns {React.ReactElement}
 */
export const MoleskineCard: React.FC<PaperProps> = ({
  children,
  sx,
  ...props
}) => (
  <Paper
    className="moleskine-card"
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
