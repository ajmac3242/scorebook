/**
 * @file SharedUI.tsx
 * @description Provides standardized UI components used throughout the application.
 * Includes layout wrappers, page headers, and statistic display items.
 */

import React, { useState, useEffect } from "react";
import {
  Paper,
  PaperProps,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
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
    <Box sx={{ mb: { xs: 3, sm: 4 }, position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 48,
          position: "relative",
          px: 6,
        }}
      >
        {showBack && (
          <IconButton
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="Go back"
            sx={{
              position: "absolute",
              left: 0,
              color: "text.primary",
              "&:hover": {
                transform: "scale(1.1)",
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
            sx={{
              fontFamily: "var(--serif)",
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      {subtitle && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            textAlign: "center",
            mt: 0.5,
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {subtitle}
        </Typography>
      )}
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
  <Box
    sx={{ textAlign: "center" }}
    role="img"
    aria-label={`${label}: ${value}`}
  >
    <Typography
      variant="caption"
      sx={{ opacity: 0.8, color: light ? "white" : "text.secondary" }}
      aria-hidden="true"
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{ fontWeight: 700, color: light ? "white" : "text.primary" }}
      aria-hidden="true"
    >
      {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
    </Typography>
  </Box>
);

/**
 * Interface representing the props for the StatCard component.
 */
interface StatCardProps {
  label: string;
  value: string | number;
}

/**
 * Standardized component for displaying a statistic within a card.
 *
 * @param {StatCardProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <Card
    sx={{
      bgcolor: "#FFFDF5",
      border: "1px solid #D1D1D1",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-4px)" },
    }}
  >
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </Typography>
    </CardContent>
  </Card>
);

/**
 * Interface representing the props for the AnimatedNumber component.
 */
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
}

/**
 * Component that animates a number from 0 to its target value.
 *
 * @param {AnimatedNumberProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 500,
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(progress * value);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <>{displayValue.toFixed(decimals)}</>;
};
