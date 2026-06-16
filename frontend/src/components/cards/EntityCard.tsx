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
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

export type EntityCardStat = {
  label: string;
  value: string;
};

export interface EntityCardProps {
  /** The main name of the entity */
  title: string;
  /** Optional secondary text or description */
  subtitle?: string;
  /** Badge text shown in the header area */
  badgeLabel?: string;
  /** Primary brand/accent color for the entity */
  accentColor: string;
  /** Optional image/logo URL */
  imageUrl?: string;
  /** Initials to show if no image is present */
  fallbackInitials: string;
  /** Favorite status */
  isFavorite?: boolean;
  /** Tooltip for the favorite button */
  favoriteTooltip?: string;
  /** ARIA label for the favorite button */
  favoriteAriaLabel?: string;
  /** Callback for favorite toggle */
  onFavoriteClick?: (_event: React.MouseEvent) => void;
  /** Hero metric/highlight value (e.g. Win-Loss record) */
  highlightValue?: string;
  /** Label for the hero metric */
  highlightLabel?: string;
  /** Grid of secondary statistics */
  stats?: EntityCardStat[];
  /** Primary click handler for the whole card */
  onClick?: () => void;
  /** ARIA label for the whole card */
  ariaLabel?: string;
  /** Override for card border radius */
  /** When 0, stats render — instead of values (no games played yet). */
  gamesPlayed?: number;
  /** Styling overrides */
  sx?: SxProps<Theme>;
}

const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  badgeLabel,
  accentColor,
  imageUrl,
  fallbackInitials,
  isFavorite = false,
  favoriteTooltip,
  favoriteAriaLabel,
  onFavoriteClick,
  highlightValue,
  highlightLabel,
  stats = [],
  onClick,
  ariaLabel,
  gamesPlayed,
  sx,
}) => {
  const theme = useTheme();
  const tokens = useTokens();

  const cardRadius = tokens.semantic.component.entityCard.radius;
  const nestedRadius = tokens.semantic.shape.radius.lg;
  const logoRadius = tokens.semantic.component.entityCard.logoRadius;
  const cardPadding = tokens.semantic.component.entityCard.padding;
  const highlightPaddingX = tokens.semantic.component.entityCard.highlightPaddingX;
  const highlightHeight = tokens.semantic.component.entityCard.highlightHeight;

  const transitionAll = `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`;

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: `${cardRadius}px`,
        border: "1px solid",
        borderColor: isFavorite
          ? tokens.semantic.color.border.accent
          : tokens.semantic.color.border.subtle,
        bgcolor: tokens.semantic.color.background.paper,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: transitionAll,
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              boxShadow: tokens.semantic.elevation.shadow.card,
              borderColor: accentColor,
            }
          : undefined,
        "&:focus-visible": onClick
          ? {
              outline: "none",
              boxShadow: `0 0 0 3px ${tokens.semantic.color.action.focusRing}`,
              borderColor: tokens.semantic.color.brand.primary.main,
            }
          : undefined,
        ...sx,
      }}
    >
      {/* Identity Banner / Accent Zone */}
      <Box
        sx={{
          height: tokens.semantic.component.entityCard.accentStripHeight,
          bgcolor: accentColor,
          flexShrink: 0,
        }}
      />

      <Box
        sx={{
          p: `${cardPadding}px`,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: tokens.layout.pagePaddingXUnits / 1.5,
            alignItems: "flex-start",
            mb: `${cardPadding}px`,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={tokens.layout.pagePaddingXUnits / 3}
              sx={{
                alignItems: "center",
                mb: tokens.layout.pagePaddingXUnits / 6,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: tokens.semantic.typography.h6.fontWeight,
                  fontSize: tokens.semantic.typography.h6.fontSize,
                  color: "text.primary",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: tokens.semantic.typography.h6.letterSpacing,
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
                      p: tokens.layout.pagePaddingXUnits / 6,
                      color: isFavorite
                        ? tokens.semantic.color.brand.primary.main
                        : tokens.semantic.color.text.secondary,
                      flexShrink: 0,
                    }}
                    aria-label={
                      favoriteAriaLabel ||
                      (isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites")
                    }
                  >
                    {isFavorite ? (
                      <StarIcon
                        sx={{ fontSize: tokens.semantic.component.iconSize.sm }}
                      />
                    ) : (
                      <StarBorderIcon
                        sx={{ fontSize: tokens.semantic.component.iconSize.sm }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
              ) : null}

              {isFavorite && (
                <Chip
                  label="Default"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: tokens.semantic.typography.caption.fontSize,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    bgcolor: tokens.semantic.color.surface.accentSoft,
                    color: tokens.semantic.color.brand.primary.main,
                    border: `1px solid ${tokens.semantic.color.border.accent}`,
                    borderRadius: tokens.semantic.shape.radius.xs,
                    px: tokens.layout.pagePaddingXUnits / 6,
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: tokens.semantic.color.text.secondary,
                lineHeight: tokens.semantic.typography.body2.lineHeight,
                mb: tokens.layout.pagePaddingXUnits / 2,
                minHeight: tokens.semantic.spacing.md * 2.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {subtitle || " "}
            </Typography>

            {badgeLabel ? (
              <Chip
                size="small"
                label={badgeLabel}
                sx={{
                  borderRadius: `${tokens.semantic.component.radius.chip}px`,
                  bgcolor: tokens.semantic.color.surface.subtle,
                  color: tokens.semantic.color.text.secondary,
                  border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  fontWeight: tokens.semantic.typography.overline.fontWeight,
                  fontSize: tokens.semantic.typography.caption.fontSize,
                  letterSpacing:
                    tokens.semantic.typography.overline.letterSpacing,
                  textTransform: "uppercase",
                  height: tokens.semantic.component.iconSize.sm,
                }}
              />
            ) : null}
          </Box>

          <Avatar
            src={imageUrl}
            variant="rounded"
            sx={{
              width: tokens.semantic.spacing.xl * 2,
              height: tokens.semantic.spacing.xl * 2,
              bgcolor: tokens.semantic.color.surface.elevated,
              border: `1px solid ${tokens.semantic.color.border.subtle}`,
              p: tokens.layout.pagePaddingXUnits / 6,
              color: accentColor,
              borderRadius: `${logoRadius}px`,
              fontWeight: tokens.semantic.typography.h6.fontWeight,
              fontSize: tokens.semantic.typography.h5.fontSize,
              boxShadow: tokens.semantic.elevation.shadow.insetSubtle,
            }}
          >
            {fallbackInitials}
          </Avatar>
        </Box>

        {/* Highlight Section — win/loss record or other hero metric.
            Rendered at h6 weight so it reads as a strong supporting stat
            without visually competing with the team name above it. */}
        {highlightValue && (
          <Box
            sx={{
              borderRadius: `${nestedRadius}px`,
              px: tokens.semantic.spacing.md,
              py: tokens.semantic.spacing.md,
              mb: tokens.semantic.spacing.lg,
              bgcolor: tokens.semantic.color.surface.subtle,
              border: "1px solid",
              borderColor: tokens.semantic.color.border.subtle,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              boxShadow: tokens.semantic.elevation.shadow.xs,
            }}
          >
            {gamesPlayed === 0 ? (
              <>
                {/* Empty state: smaller, muted dash — visually distinct from a real 0-0 record */}
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: tokens.semantic.typography.body1.lineHeight,
                    fontWeight: tokens.semantic.typography.body1.fontWeight,
                    color: tokens.semantic.color.text.disabled,
                    mb: tokens.layout.pagePaddingXUnits / 6,
                    fontSize: tokens.semantic.typography.body1.fontSize,
                  }}
                >
                  —
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: tokens.semantic.typography.overline.fontWeight,
                    letterSpacing:
                      tokens.semantic.typography.overline.letterSpacing,
                    color: "text.disabled",
                    fontSize: tokens.semantic.typography.overline.fontSize,
                  }}
                >
                  No games yet
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    lineHeight: tokens.semantic.typography.h6.lineHeight,
                    fontWeight: tokens.semantic.typography.h6.fontWeight,
                    color: tokens.semantic.color.text.primary,
                    mb: tokens.layout.pagePaddingXUnits / 6,
                    letterSpacing: tokens.semantic.typography.h6.letterSpacing,
                  }}
                >
                  {highlightValue}
                </Typography>
                {highlightLabel && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight:
                        tokens.semantic.typography.overline.fontWeight,
                      letterSpacing:
                        tokens.semantic.typography.overline.letterSpacing,
                      color: "text.tertiary",
                      fontSize: tokens.semantic.typography.overline.fontSize,
                    }}
                  >
                    {highlightLabel}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}

        {/* Stats Grid & Footer Section */}
        <Box
          sx={{
            mt: "auto",
            pt: tokens.semantic.spacing.md,
            pl: tokens.layout.pagePaddingXUnits / 6,
            borderTop: "1px solid",
            borderColor: tokens.semantic.color.border.subtle,
          }}
        >
          {stats.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: `repeat(${Math.min(Math.max(stats.length, 1), 4)}, minmax(0, 1fr))`,
                },
                gap: tokens.layout.pagePaddingXUnits / 1.5,
                mb: 0,
              }}
            >
              {stats.map((stat) => (
                <Box key={stat.label} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight:
                        tokens.semantic.typography.overline.fontWeight,
                      letterSpacing:
                        tokens.semantic.typography.overline.letterSpacing,
                      color: tokens.semantic.color.text.tertiary,
                      mb: tokens.layout.pagePaddingXUnits / 6,
                      display: "block",
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: tokens.semantic.typography.h6.fontWeight,
                      color:
                        gamesPlayed === 0
                          ? tokens.semantic.color.text.disabled
                          : tokens.semantic.color.text.primary,
                      fontSize: tokens.semantic.typography.body1.fontSize,
                      lineHeight: tokens.semantic.typography.body1.lineHeight,
                    }}
                  >
                    {gamesPlayed === 0 ? "—" : stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EntityCard;
