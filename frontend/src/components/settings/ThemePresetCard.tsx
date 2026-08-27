import React from "react";
import { Box, Card, CardActionArea, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Check as CheckIcon } from "@mui/icons-material";
import { ThemePreset } from "../../theme/ThemeContext";
import { useTokens } from "../../theme/useTokens";

interface ThemeMiniPreviewProps {
  color: string;
  selected: boolean;
  previewRadius: number;
  checkSize: number;
  checkOffset: number;
}

const ThemeMiniPreview: React.FC<ThemeMiniPreviewProps> = ({
  color,
  selected,
  previewRadius,
  checkSize,
  checkOffset,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1.9 / 1",
        borderRadius: previewRadius,
        overflow: "hidden",
        bgcolor: isDark
          ? tokens.semantic.color.background.inset
          : tokens.semantic.color.background.subtle,
        border: "1px solid",
        borderColor: tokens.semantic.color.border.subtle,
      }}
    >
      <Box sx={{ height: 8, width: "100%", bgcolor: color }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "0.8fr 1.4fr",
          height: "calc(100% - 8px)",
        }}
      >
        <Box
          sx={{
            borderRight: "1px solid",
            borderColor: tokens.semantic.color.border.subtle,
            p: 1.25,
          }}
        >
          <Box
            sx={{
              height: 5,
              width: "78%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.strong
                : tokens.semantic.color.border.strong,
              mb: 0.75,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "62%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.elevated
                : tokens.semantic.color.surface.strong,
              mb: 0.5,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "48%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.elevated
                : tokens.semantic.color.surface.strong,
            }}
          />
        </Box>

        <Box sx={{ p: 1.25 }}>
          <Box sx={{ display: "flex", gap: 0.75, mb: 1.25 }}>
            <Box
              sx={{
                flex: 1,
                height: 28,
                borderRadius: tokens.semantic.shape.radius.xs,
                border: "1px solid",
                borderColor: tokens.semantic.color.border.subtle,
              }}
            />
            <Box
              sx={{
                flex: 1,
                height: 28,
                borderRadius: tokens.semantic.shape.radius.xs,
                border: "1px solid",
                borderColor: tokens.semantic.color.border.subtle,
              }}
            />
          </Box>

          <Box
            sx={{
              height: 4,
              width: "72%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.strong
                : tokens.semantic.color.border.strong,
              mb: 0.625,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "58%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.elevated
                : tokens.semantic.color.surface.strong,
              mb: 0.5,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "82%",
              borderRadius: 999,
              bgcolor: isDark
                ? tokens.semantic.color.surface.elevated
                : tokens.semantic.color.surface.strong,
            }}
          />
        </Box>
      </Box>

      {selected ? (
        <Box
          sx={{
            position: "absolute",
            top: checkOffset,
            right: checkOffset,
            width: checkSize,
            height: checkSize,
            borderRadius: "50%",
            bgcolor: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.18)}`,
          }}
        >
          <CheckIcon
            sx={{
              fontSize: checkSize * 0.58,
              color: tokens.semantic.color.text.inverse,
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
};

interface ThemePresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

const ThemePresetCard: React.FC<ThemePresetCardProps> = ({
  preset,
  selected,
  onSelect,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const card = tokens.settings.selectionCard;

  const radius = card?.radius ?? 10;
  const borderWidth = card?.borderWidth ?? 1;
  const selectedBorderWidth = card?.selectedBorderWidth ?? 2;
  const padding = card?.padding ?? 10;
  const titleGap = card?.titleGap ?? 4;
  const previewRadius = card?.previewRadius ?? 6;
  const checkSize = card?.checkSize ?? 18;
  const checkOffset = card?.checkOffset ?? 10;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: `${radius}px`,
        overflow: "hidden",
        border: selected
          ? `${selectedBorderWidth}px solid ${tokens.semantic.color.brand.primary.main}`
          : `${borderWidth}px solid ${tokens.semantic.color.border.subtle}`,
        bgcolor: tokens.semantic.color.background.paper,
        cursor: "pointer",
        transition: `border-color ${tokens.motion.duration.fast}, box-shadow ${tokens.motion.duration.fast}, transform ${tokens.motion.duration.fast}`,
        "&:hover": {
          borderColor: selected
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.38),
          boxShadow: `0 4px 14px ${alpha(
            theme.palette.common.black,
            theme.palette.mode === "dark" ? 0.18 : 0.08,
          )}`,
          transform: "translateY(-1px)",
        },
      }}
      onClick={onSelect}
      aria-label={`${preset.label} theme preset (${preset.mode} mode)${selected ? ", selected" : ""}`}
    >
      <CardActionArea
        disableRipple
        sx={{ p: padding / 8 }}
        aria-pressed={selected}
      >
        <ThemeMiniPreview
          color={preset.previewColor}
          selected={selected}
          previewRadius={previewRadius}
          checkSize={checkSize}
          checkOffset={checkOffset}
        />

        <Box
          sx={{
            mt: (titleGap + 8) / 8,
            pt: 0.25,
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              color: tokens.semantic.color.text.primary,
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.sm,
              lineHeight: 1.2,
            }}
          >
            {preset.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: tokens.semantic.color.text.secondary,
              textTransform: "capitalize",
              lineHeight: 1.25,
              mt: 0.375,
              display: "block",
            }}
          >
            {preset.mode}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default ThemePresetCard;
