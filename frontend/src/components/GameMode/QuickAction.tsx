import React from "react";
import {
  Typography,
  Button,
  Tooltip,
  keyframes,
} from "@mui/material";
import { ACTION_TYPES } from "../../constants/stats";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

export const QuickAction: React.FC<{
  type: string;
  label: string;
  icon: React.ElementType;
  statType: string | null;
  setStatType: (_type: string | null) => void;
  warning?: boolean;
}> = React.memo(
  ({ type, label, icon: Icon, statType, setStatType, warning }) => (
    <Tooltip title={warning && type === ACTION_TYPES.FOUL ? `${label} (Foul Trouble!)` : label}>
      <Button
        variant={statType === type ? "contained" : "outlined"}
        color={warning && type === ACTION_TYPES.FOUL ? "error" : "inherit"}
        aria-pressed={statType === type}
        aria-label={`Record ${label}${warning && type === ACTION_TYPES.FOUL ? " - Foul Trouble!" : ""}`}
        onClick={() => {
          setStatType(type);
        }}
        sx={{
          flexDirection: "column",
          py: 2,
          minWidth: 80,
          borderColor: warning && type === ACTION_TYPES.FOUL ? "error.main" : "#D1D1D1",
          backgroundColor:
            statType === type
              ? warning && type === ACTION_TYPES.FOUL
                ? "error.main"
                : "primary.main"
              : "transparent",
          color:
            statType === type
              ? "white"
              : warning && type === ACTION_TYPES.FOUL
                ? "error.main"
                : "text.primary",
          animation:
            warning && type === ACTION_TYPES.FOUL && statType !== type
              ? `${pulse} 2s infinite ease-in-out`
              : "none",
        }}
      >
        <Icon sx={{ mb: 1 }} />
        <Typography variant="caption">{label}</Typography>
      </Button>
    </Tooltip>
  ),
);
