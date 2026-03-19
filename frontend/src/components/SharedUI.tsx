import React from "react";
import { Paper, PaperProps, Typography, Box } from "@mui/material";

export const MoleskineCard: React.FC<PaperProps> = ({ children, sx, ...props }) => (
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

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <Box sx={{ mb: 4, textAlign: "center" }}>
    <Typography
      variant="h4"
      sx={{ fontFamily: "var(--serif)", mb: subtitle ? 1 : 0 }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="h6" color="text.secondary">
        {subtitle}
      </Typography>
    )}
    {actions && <Box sx={{ mt: 2 }}>{actions}</Box>}
  </Box>
);

interface StatItemProps {
  label: string;
  value: string | number;
  light?: boolean;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, light }) => (
  <Box sx={{ textAlign: "center" }}>
    <Typography
      variant="caption"
      sx={{ opacity: 0.8, color: light ? "white" : "text.secondary" }}
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{ fontWeight: 700, color: light ? "white" : "text.primary" }}
    >
      {value}
    </Typography>
  </Box>
);
