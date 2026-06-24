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
        px: tokens.semantic.spacing.md / 8,
        gap: tokens.semantic.spacing.sm / 8,
        minHeight: tokens.semantic.spacing["2xl"] * 6,
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
        mb: tokens.semantic.spacing.xs / 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 64,
        height: 64,
        borderRadius: "50%",
        bgcolor: "action.hover",
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{
        fontSize: "var(--cs-typography-fontSize-md)",
        fontWeight: tokens.semantic.typography.h6.fontWeight,
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
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
