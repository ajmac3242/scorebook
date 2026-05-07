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
      p: 2,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);
