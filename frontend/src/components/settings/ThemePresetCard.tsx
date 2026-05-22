import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  Typography,
  useTheme,
} from "@mui/material";
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
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1.9 / 1",
        borderRadius: `${previewRadius}px`,
        overflow: "hidden",
        bgcolor: isDark ? "grey.900" : "grey.100",
        border: "1px solid",
        borderColor: alpha(theme.palette.text.primary, 0.08),
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
            borderColor: alpha(theme.palette.text.primary, 0.08),
            p: 1.25,
          }}
        >
          <Box
            sx={{
              height: 5,
              width: "78%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.700" : "grey.300",
              mb: 0.75,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "62%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.800" : "grey.200",
              mb: 0.5,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "48%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.800" : "grey.200",
            }}
          />
        </Box>

        <Box sx={{ p: 1.25 }}>
          <Box sx={{ display: "flex", gap: 0.75, mb: 1.25 }}>
            <Box
              sx={{
                flex: 1,
                height: 28,
                borderRadius: 1,
                border: "1px solid",
                borderColor: alpha(theme.palette.text.primary, 0.08),
              }}
            />
            <Box
              sx={{
                flex: 1,
                height: 28,
                borderRadius: 1,
                border: "1px solid",
                borderColor: alpha(theme.palette.text.primary, 0.08),
              }}
            />
          </Box>

          <Box
            sx={{
              height: 4,
              width: "72%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.700" : "grey.300",
              mb: 0.625,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "58%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.800" : "grey.200",
              mb: 0.5,
            }}
          />
          <Box
            sx={{
              height: 4,
              width: "82%",
              borderRadius: 999,
              bgcolor: isDark ? "grey.800" : "grey.200",
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
          <CheckIcon sx={{ fontSize: checkSize * 0.58, color: "#fff" }} />
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
          ? `${selectedBorderWidth}px solid ${theme.palette.primary.main}`
          : `${borderWidth}px solid ${alpha(theme.palette.text.primary, 0.12)}`,
        bgcolor: "background.paper",
        cursor: "pointer",
        transition:
          "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
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
    >
      <CardActionArea disableRipple sx={{ p: `${padding}px` }}>
        <ThemeMiniPreview
          color={preset.previewColor}
          selected={selected}
          previewRadius={previewRadius}
          checkSize={checkSize}
          checkOffset={checkOffset}
        />

        <Box
          sx={{
            mt: `${titleGap + 8}px`,
            pt: 0.25,
          }}
        >
          <Typography
            variant="body2"
            color="text.primary"
            noWrap
            sx={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.2 }}
          >
            {preset.label}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
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