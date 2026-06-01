import React from "react";
import { Box, Stack } from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

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
  return (
    <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
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
              width: swatchSize,
              height: swatchSize,
              borderRadius: "50%",
              bgcolor: color,
              cursor: "pointer",
              border: "2px solid",
              borderColor: selected ? "text.primary" : "divider",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              transition:
                "transform 150ms, box-shadow 150ms, border-color 150ms",
              "&:hover": { transform: "scale(1.06)" },
              "&:focus-visible": {
                outline: "none",
                boxShadow: `0 0 0 3px ${alpha(color, 0.35)}`,
              },
            }}
          >
            {selected && (
              <CheckIcon
                sx={{
                  fontSize: swatchSize * 0.5,
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
