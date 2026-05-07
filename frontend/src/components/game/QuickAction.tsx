import React from "react";
import { Button, Typography, Tooltip } from "@mui/material";

interface QuickActionProps {
  type: string;
  label: string;
  icon: React.ElementType;
  statType: string | null;
  setStatType: (_type: string | null) => void;
}

/**
 * QuickAction component for one-tap statistical entry.
 * WHY: Extracted from GameMode.tsx to reduce file size and improve maintainability.
 */
export const QuickAction: React.FC<QuickActionProps> = React.memo(
  ({ type, label, icon: Icon, statType, setStatType }) => (
    <Tooltip title={label}>
      <Button
        variant={statType === type ? "contained" : "outlined"}
        color="inherit"
        aria-pressed={statType === type}
        aria-label={`Record ${label}`}
        onClick={() => {
          setStatType(type);
        }}
        sx={{
          flexDirection: "column",
          py: 2,
          minWidth: 80,
          borderColor: "#D1D1D1",
          backgroundColor: statType === type ? "primary.main" : "transparent",
          color: statType === type ? "white" : "text.primary",
        }}
      >
        <Icon sx={{ mb: 1 }} />
        <Typography variant="caption">{label}</Typography>
      </Button>
    </Tooltip>
  ),
);
