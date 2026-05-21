/**
 * @file SharedUI.tsx
 * @description Provides standardized UI components used throughout the application.
 * Includes layout wrappers, page headers, and statistic display items.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Paper,
  PaperProps,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Tooltip,
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
    <Box sx={{ mb: "var(--cs-semantic-spacing-lg)", position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "var(--cs-touch-targetComfortable)",
          position: "relative",
          px: "var(--cs-semantic-spacing-pagePaddingX)",
        }}
      >
        {showBack && (
          <Tooltip title="Go back">
            <IconButton
              onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
              aria-label="Go back"
              sx={{
                position: "absolute",
                left: 0,
                color: "var(--cs-semantic-color-text-primary)",
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              color: "var(--cs-semantic-color-text-primary)",
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      {subtitle && (
        <Typography
          variant="h6"
          sx={{
            color: "var(--cs-semantic-color-text-secondary)",
            textAlign: "center",
            mt: 0.5,
          }}
        >
          {subtitle}
        </Typography>
      )}
      {actions && (
        <Box
          sx={{
            mt: "var(--cs-semantic-spacing-md)",
            textAlign: "center",
          }}
        >
          {actions}
        </Box>
      )}
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
    role="text"
    aria-label={`${value} ${label}`}
  >
    <Typography
      variant="caption"
      sx={{
        color: light
          ? "var(--cs-semantic-color-text-inverse)"
          : "var(--cs-semantic-color-text-secondary)",
        fontWeight: "var(--cs-typography-fontWeight-bold)",
        textTransform: "uppercase",
        letterSpacing: "var(--cs-typography-letterSpacing-wider)",
      }}
      aria-hidden="true"
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{
        fontWeight: "var(--cs-typography-fontWeight-bold)",
        color: light
          ? "var(--cs-semantic-color-text-inverse)"
          : "var(--cs-semantic-color-text-primary)",
      }}
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
      bgcolor: "var(--cs-semantic-color-surface-moleskine)",
      border: "1px solid var(--cs-semantic-color-border-default)",
      transition: `transform var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)`,
      "&:hover": { transform: "translateY(-4px)" },
    }}
  >
    <CardContent
      sx={{
        p: "var(--cs-semantic-spacing-md)",
        "&:last-child": { pb: "var(--cs-semantic-spacing-md)" },
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "var(--cs-semantic-color-text-secondary)" }}
        gutterBottom
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
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
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const startValue = prevValueRef.current;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(startValue + progress * (value - startValue));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = value;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      prevValueRef.current = value;
    };
  }, [value, duration]);

  return <>{displayValue.toFixed(decimals)}</>;
};
