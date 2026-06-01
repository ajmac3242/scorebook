import React from "react";
import { Box, Typography } from "@mui/material";

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
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      py: { xs: 6, md: 10 },
      px: 3,
      gap: 1.5,
      minHeight: 300,
      borderRadius: "20px",
      border: "1px dashed",
      borderColor: "divider",
      bgcolor: "background.paper",
      justifyContent: "center",
    }}
  >
    <Box sx={{ color: "text.secondary", mb: 0.5, display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", bgcolor: "action.hover" }}>
      {icon}
    </Box>
    <Typography
      sx={{
        fontSize: "var(--cs-typography-fontSize-md)",
        fontWeight: 600,
        color: "text.primary",
      }}
    >
      {title}
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ maxWidth: 340 }}
    >
      {description}
    </Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Box>
);

export default EmptyState;
