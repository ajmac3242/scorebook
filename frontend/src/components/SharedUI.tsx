import React from "react";
import { Paper, PaperProps, Typography, Box, IconButton } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

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
