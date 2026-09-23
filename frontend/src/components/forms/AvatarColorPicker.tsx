import React from "react";
import { Box, Stack } from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useTokens } from "../../theme/useTokens";

type AvatarColorPickerProps = {
  colors: string[];
  selectedColor: string;
  onChange: (_color: string) => void;
  swatchSize?: number;
};

const AvatarColorPicker: React.FC<AvatarColorPickerProps> = ({
  colors,
  selectedColor,
  onChange,
  swatchSize = 36,
}) => {
  const tokens = useTokens();
  const effectiveSwatchSize = Math.max(
    swatchSize,
    tokens.touch.targetComfortable,
  );

  return (
    <Stack
      direction="row"
      spacing={tokens.semantic.spacing.xs / 8}
      role="radiogroup"
      aria-label="Avatar color options"
      sx={{ flexWrap: "wrap" }}
    >
      {colors.map((color) => {
        const selected = selectedColor === color;
        return (
          <Box
            key={color}
            role="radio"
            aria-checked={selected}
            aria-label={`Select color ${color}`}
            tabIndex={0}
            onClick={() => onChange(color)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(color);
              }
            }}
            sx={{
              width: effectiveSwatchSize,
              height: effectiveSwatchSize,
              borderRadius: tokens.semantic.shape.radius.full,
              bgcolor: color,
              cursor: "pointer",
              border: "2px solid",
              borderColor: selected
                ? tokens.semantic.color.text.primary
                : tokens.semantic.color.border.subtle,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
              "&:hover": { transform: "scale(1.06)" },
              "&:focus-visible": {
                outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
                outlineOffset: `${tokens.semantic.focus.offset}px`,
                boxShadow: `0 0 0 3px ${alpha(color, 0.35)}`,
              },
            }}
          >
            {selected && (
              <CheckIcon
                sx={{
                  fontSize: effectiveSwatchSize * 0.5,
                  color: "white",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                }}
              />
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default AvatarColorPicker;
