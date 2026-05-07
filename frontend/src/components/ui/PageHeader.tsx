import React from "react";
import { Box, Tooltip, IconButton, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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
          <Tooltip title="Go back">
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
          </Tooltip>
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
