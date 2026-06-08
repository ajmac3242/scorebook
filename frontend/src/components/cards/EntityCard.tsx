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
  SportsBasketball as SportsBasketballIcon,
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
  /** Accessibility key handler */
  onKeyDown?: (_event: React.KeyboardEvent) => void;
  /** ARIA label for the whole card */
  ariaLabel?: string;
  /** Override for card border radius */
  cardRadius?: number;
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
  onKeyDown,
  ariaLabel,
  cardRadius = 20,
  gamesPlayed,
  sx,
}) => {
  const theme = useTheme();
  const tokens = useTokens();

  // Common radii based on cardRadius
  const nestedRadius = Math.max(cardRadius - 6, 14);
  const logoRadius = Math.max(cardRadius - 6, 14);

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
        borderColor: isFavorite
          ? "var(--cs-semantic-color-border-accent)"
          : "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: transitionAll,
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              boxShadow: theme.shadows[4],
              borderColor: accentColor,
            }
          : undefined,
        "&:focus-visible": onClick
          ? {
              outline: "none",
              boxShadow: `0 0 0 3px var(--cs-semantic-color-action-focusRing)`,
              borderColor: "var(--cs-semantic-color-brand-primary-main)",
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
          p: 2.5,
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
            gap: 2,
            alignItems: "flex-start",
            mb: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 0.5 }}
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
                      p: 0.5,
                      color: isFavorite
                        ? "var(--cs-semantic-color-brand-primary-main)"
                        : "text.secondary",
                      flexShrink: 0,
                    }}
                    aria-label={favoriteAriaLabel}
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
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                lineHeight: tokens.semantic.typography.body2.lineHeight,
                mb: 1.5,
                minHeight: theme.spacing(5),
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
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  color: "text.secondary",
                  border: `1px solid var(--cs-semantic-color-border-subtle)`,
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
              width: 64,
              height: 64,
              bgcolor: "var(--cs-semantic-color-surface-elevated)",
              border: `1px solid var(--cs-semantic-color-border-subtle)`,
              p: 0.5,
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
              px: 2.5,
              py: 2,
              mb: 2.5,
              bgcolor: "var(--cs-semantic-color-surface-subtle)",
              border: "1px solid",
              borderColor: "var(--cs-semantic-color-border-subtle)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              boxShadow: tokens.semantic.elevation.shadow.xs,
            }}
          >
            {gamesPlayed === 0 ? (
              /* No games yet — guide user toward the next action */
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  minHeight: theme.spacing(5),
                }}
              >
                <SportsBasketballIcon
                  sx={{
                    fontSize: tokens.semantic.component.iconSize.sm,
                    color: "text.disabled",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    fontWeight: tokens.semantic.typography.overline.fontWeight,
                    letterSpacing:
                      tokens.semantic.typography.overline.letterSpacing,
                    textTransform: "uppercase",
                    fontSize: tokens.semantic.typography.overline.fontSize,
                  }}
                >
                  No games yet
                </Typography>
              </Stack>
            ) : (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    lineHeight: tokens.semantic.typography.h6.lineHeight,
                    fontWeight: tokens.semantic.typography.h6.fontWeight,
                    color: "text.primary",
                    mb: 0.5,
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
                      textTransform: "uppercase",
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
            pt: 2.5,
            pl: 0.5,
            borderTop: "1px solid",
            borderColor: "var(--cs-semantic-color-border-subtle)",
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
                gap: 2,
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
                      textTransform: "uppercase",
                      color: "text.tertiary",
                      mb: 0.5,
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
                        gamesPlayed === 0 ? "text.disabled" : "text.primary",
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
