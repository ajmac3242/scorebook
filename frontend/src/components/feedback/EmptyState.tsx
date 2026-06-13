import React from "react";
import { Box, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const tokens = useTokens();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: {
          xs: tokens.layout.pagePaddingXUnits * 2,
          md: tokens.layout.pagePaddingXUnits * 3.3,
        },
        px: tokens.layout.pagePaddingXUnits,
        gap: tokens.layout.pagePaddingXUnits / 2,
        minHeight: 300,
        borderRadius: `${tokens.semantic.shape.radius.xl}px`,
        border: "1px dashed",
        borderColor: tokens.semantic.color.border.default,
        bgcolor: tokens.semantic.color.background.paper,
        justifyContent: "center",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          color: tokens.semantic.color.text.secondary,
          mb: tokens.layout.pagePaddingXUnits / 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: tokens.semantic.spacing.xl * 2,
          height: tokens.semantic.spacing.xl * 2,
          borderRadius: tokens.semantic.shape.radius.full,
          bgcolor: tokens.semantic.color.action.hover,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: tokens.typography.fontSize.md,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: tokens.semantic.color.text.secondary,
          maxWidth: 340,
        }}
      >
        {description}
      </Typography>
      {action && (
        <Box sx={{ mt: tokens.layout.pagePaddingXUnits / 3 }}>{action}</Box>
      )}
    </Box>
  );
};

export default EmptyState;
