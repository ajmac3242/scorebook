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
        py: { xs: 6, md: 10 },
        px: tokens.semantic.spacing.lg / 8,
        gap: tokens.semantic.spacing.sm / 8,
        minHeight: 300,
        borderRadius: `${tokens.semantic.shape.radius["2xl"]}px`,
        border: "1px dashed",
        borderColor: tokens.semantic.color.border.subtle,
        bgcolor: tokens.semantic.color.background.paper,
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          color: tokens.semantic.color.text.secondary,
          mb: tokens.semantic.spacing.xs / 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: "50%",
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
        <Box sx={{ mt: tokens.semantic.spacing.sm / 8 }}>{action}</Box>
      )}
    </Box>
  );
};

export default EmptyState;
