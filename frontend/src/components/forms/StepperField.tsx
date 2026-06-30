import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

export type StepperFieldProps = {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  helperText: string;
  min?: number;
  max?: number;
};

const StepperField: React.FC<StepperFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  min = 0,
  max = 99,
}) => {
  const tokens = useTokens();
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 8);

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.semantic.spacing.md / 4,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: tokens.typography.fontWeight.semibold,
            lineHeight: 1.3,
            color: tokens.semantic.color.text.primary,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          {helperText}
        </Typography>
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          border: "1px solid",
          borderColor: tokens.semantic.color.border.default,
          borderRadius: `${controlRadius}px`,
          bgcolor: tokens.semantic.color.background.paper,
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label={`decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            p: tokens.spacing[1] / 4,
            color:
              value <= min
                ? tokens.semantic.color.text.disabled
                : tokens.semantic.color.text.primary,
            transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
            "&:hover": {
              bgcolor: tokens.semantic.color.action.hover,
            },
          }}
        >
          <RemoveIcon
            sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
          />
        </IconButton>
        <Typography
          variant="body2"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            minWidth: 28,
            textAlign: "center",
            userSelect: "none",
            color: tokens.semantic.color.text.primary,
          }}
        >
          {value}
        </Typography>
        <IconButton
          aria-label={`increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            p: tokens.spacing[1] / 4,
            color:
              value >= max
                ? tokens.semantic.color.text.disabled
                : tokens.semantic.color.text.primary,
            transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
            "&:hover": {
              bgcolor: tokens.semantic.color.action.hover,
            },
          }}
        >
          <AddIcon sx={{ fontSize: tokens.semantic.component.iconSize.xs }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default StepperField;
