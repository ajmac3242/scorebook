/**
 * @file SharedUI.tsx
 * @description Provides standardized UI components used throughout the application.
 * Includes layout wrappers, page headers, and statistic display items.
 */

import React from "react";
import { Paper, PaperProps, Typography, Box, IconButton } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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

/**
 * Interface representing the props for the PageHeader component.
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

/**
 * Standardized page header component with optional back button and action area.
 *
 * @param {PageHeaderProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  showBack,
  backTo,
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4, position: "relative" }}>
      {showBack && (
        <IconButton
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          sx={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            color: "text.primary",
            "&:hover": {
              transform: "translateY(-50%) scale(1.1)",
              transition: "transform 0.2s",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box sx={{ textAlign: "center" }}>
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
      </Box>
      {actions && <Box sx={{ mt: 2, textAlign: "center" }}>{actions}</Box>}
    </Box>
  );
};

/**
 * Interface representing the props for the StatItem component.
 */
interface StatItemProps {
  label: string;
  value: string | number;
  light?: boolean;
}

/**
 * Standardized component for displaying a single numerical statistic with a label.
 *
 * @param {StatItemProps} props - Component props.
 * @returns {React.ReactElement}
 */
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
