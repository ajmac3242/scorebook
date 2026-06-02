/**
 * @file SharedUI.tsx
 * @description Provides standardized UI components used throughout the application.
 * Includes layout wrappers, page headers, and statistic display items.
 */

import React from "react";
import {
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AnimatedNumber } from "./data-display/AnimatedNumber";

export { MoleskineCard } from "./cards/MoleskineCard";
export { AnimatedNumber } from "./data-display/AnimatedNumber";

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
 * @deprecated Use AppPageShell + PageBreadcrumb instead.
 * Will be removed once all usages have been migrated.
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
 * @deprecated Use KpiStat in components/data-display/ instead.
 * Will be removed once all usages have been migrated.
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
 * @deprecated Use KpiStat in components/data-display/ instead.
 * Will be removed once all usages have been migrated.
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
