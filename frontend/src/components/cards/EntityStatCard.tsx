import React from "react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";

export type EntityStatCardStat = {
  label: string;
  value: string;
};

export type EntityStatCardProps = {
  title: string;
  description?: string;
  badgeLabel?: string;
  accentColor: string;
  accentSoftBg: string;
  accentSofterBg: string;
  accentBorder: string;
  accentRing: string;
  imageUrl?: string;
  fallbackInitials: string;
  isFavorite?: boolean;
  favoriteTooltip?: string;
  favoriteAriaLabel?: string;
  onFavoriteClick?: (event: React.MouseEvent) => void;
  recordValue: string;
  recordLabel?: string;
  stats: EntityStatCardStat[];
  footerLabel: string;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  ariaLabel?: string;
  cardRadius?: number;
  nestedRadius?: number;
  logoRadius?: number;
  sx?: SxProps<Theme>;
};

const EntityStatCard: React.FC<EntityStatCardProps> = ({
  title,
  description,
  badgeLabel,
  accentColor,
  accentSoftBg,
  accentSofterBg,
  accentBorder,
  accentRing,
  imageUrl,
  fallbackInitials,
  isFavorite = false,
  favoriteTooltip,
  favoriteAriaLabel,
  onFavoriteClick,
  recordValue,
  recordLabel = "Win-loss record",
  stats,
  footerLabel,
  onClick,
  onKeyDown,
  ariaLabel,
  cardRadius = 20,
  nestedRadius = 14,
  logoRadius = 14,
  sx,
}) => {
  const theme = useTheme();

  const transitionAll = `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`;

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: `${cardRadius}px`,
        border: "1px solid",
        borderColor: isFavorite ? accentBorder : "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: transitionAll,
        "&:hover": onClick
          ? {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[3],
            borderColor: accentBorder,
          }
          : undefined,
        "&:focus-visible": onClick
          ? {
            outline: "none",
            boxShadow: `0 0 0 3px ${accentRing}`,
            borderColor: accentColor,
          }
          : undefined,
        ...sx,
      }}
    >
      <Box sx={{ height: 6, bgcolor: accentColor, flexShrink: 0 }} />

      <Box
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 0.75 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </Typography>

              {onFavoriteClick ? (
                <Tooltip title={favoriteTooltip || ""}>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFavoriteClick(event);
                    }}
                    sx={{
                      p: 0.5,
                      color: isFavorite ? accentColor : "text.secondary",
                      flexShrink: 0,
                    }}
                    aria-label={favoriteAriaLabel}
                  >
                    {isFavorite ? (
                      <StarIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                lineHeight: 1.5,
                mb: 1.5,
                minHeight: 42,
              }}
            >
              {description?.trim() || "No description yet."}
            </Typography>

            {badgeLabel ? (
              <Chip
                size="small"
                label={badgeLabel}
                sx={{
                  borderRadius: 999,
                  bgcolor: accentSofterBg,
                  color: "text.primary",
                  border: `1px solid ${accentBorder}`,
                  fontWeight: 600,
                }}
              />
            ) : null}
          </Box>

          {imageUrl ? (
            <Avatar
              src={imageUrl}
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                bgcolor: accentSofterBg,
                border: `1px solid ${accentBorder}`,
                p: 0.5,
                color: "text.primary",
                borderRadius: `${logoRadius}px`,
              }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                bgcolor: accentSoftBg,
                color: accentColor,
                border: `1px solid ${accentBorder}`,
                fontWeight: 700,
                borderRadius: `${logoRadius}px`,
              }}
            >
              {fallbackInitials}
            </Avatar>
          )}
        </Box>

        <Box
          sx={{
            borderRadius: `${nestedRadius}px`,
            px: 2,
            py: 1.75,
            mb: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              lineHeight: 1,
              fontWeight: 800,
              color: "text.primary",
              mb: 0.5,
            }}
          >
            {recordValue}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            {recordLabel}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: "auto",
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: `repeat(${Math.min(Math.max(stats.length, 1), 4)}, minmax(0, 1fr))`,
              },
              gap: 1.5,
            }}
          >
            {stats.map((stat) => (
              <Box key={stat.label} sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    lineHeight: 1,
                    fontWeight: 700,
                    color: "text.primary",
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              mt: 2,
              color: accentColor,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {footerLabel}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default EntityStatCard;