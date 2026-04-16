/**
 * @file SharedUI.tsx
 * @description Provides standardized UI components using HeroUI.
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button
} from "@heroui/react";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/**
 * Standardized card component using HeroUI.
 */
export const AppCard: React.FC<React.HTMLAttributes<HTMLDivElement> & { sx?: any }> = ({
  children,
  className = "",
  sx, // Ignored for MUI compatibility during migration
  ...props
}) => (
  <Card className={`p-2 shadow-md ${className}`} {...props}>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

// Alias for migration compatibility
export const MoleskineCard = AppCard;

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
 * Standardized page header component using HeroUI.
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
    <div className="mb-6 sm:mb-8 relative">
      <div className="flex items-center justify-center min-h-[48px] relative px-12">
        {showBack && (
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="Go back"
            className="absolute left-0 hover:scale-110 transition-transform"
          >
            <ArrowBackIcon />
          </Button>
        )}
        <div className="text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
            {title}
          </h1>
        </div>
      </div>
      {subtitle && (
        <p className="text-center mt-1 text-gray-500 text-lg sm:text-xl">
          {subtitle}
        </p>
      )}
      {actions && <div className="mt-4 text-center">{actions}</div>}
    </div>
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
 */
export const StatItem: React.FC<StatItemProps> = ({ label, value, light }) => (
  <div
    className="text-center"
    role="img"
    aria-label={`${label}: ${value}`}
  >
    <span
      className={`text-xs uppercase tracking-wider block ${light ? "text-white/80" : "text-gray-500"}`}
      aria-hidden="true"
    >
      {label}
    </span>
    <span
      className={`text-3xl sm:text-4xl font-black block mt-1 ${light ? "text-white" : "text-gray-900"}`}
      aria-hidden="true"
    >
      {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
    </span>
  </div>
);

/**
 * Standardized component for displaying a statistic within a card.
 */
export const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <Card className="hover:-translate-y-1 transition-transform border border-gray-200">
    <CardContent className="p-4">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <h2 className="font-serif text-2xl mt-1 text-gray-900">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </h2>
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
