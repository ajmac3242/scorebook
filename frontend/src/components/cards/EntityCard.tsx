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
  /** Label for the primary action button/link */
  footerLabel?: string;
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
  footerLabel,
  onClick,
  onKeyDown,
  ariaLabel,
  cardRadius = 20,
  gamesPlayed,
  sx,
}) => {
  const theme = useTheme();

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
              borderColor: "var(--cs-semantic-color-border-accent)",
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
          height: 12,
          bgcolor: accentColor,
          flexShrink: 0,
          opacity: 0.9,
          borderBottom: "1px solid rgba(0,0,0,0.1)",
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
                  fontWeight: 800,
                  color: "text.primary",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
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
                      <StarIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                lineHeight: 1.4,
                mb: 1.5,
                minHeight: 40,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {subtitle || "No description yet."}
            </Typography>

            {badgeLabel ? (
              <Chip
                size="small"
                label={badgeLabel}
                sx={{
                  borderRadius: 1,
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  color: "text.secondary",
                  border: `1px solid var(--cs-semantic-color-border-subtle)`,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  height: 20,
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
              fontWeight: 800,
              fontSize: "1.5rem",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            {fallbackInitials}
          </Avatar>
        </Box>

        {/* Highlight Section */}
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                lineHeight: 1,
                fontWeight: 900,
                color: "text.primary",
                mb: 0.5,
                letterSpacing: "-0.02em",
              }}
            >
              {highlightValue}
            </Typography>
            {highlightLabel && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "text.tertiary",
                  fontSize: "0.65rem",
                }}
              >
                {highlightLabel}
              </Typography>
            )}
          </Box>
        )}

        {/* Stats Grid & Footer Section */}
        <Box
          sx={{
            mt: "auto",
            pt: 2.5,
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
                mb: footerLabel ? 2.5 : 0,
              }}
            >
              {stats.map((stat) => (
                <Box key={stat.label} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "text.tertiary",
                      mb: 0.5,
                      display: "block",
                      fontSize: "0.6rem",
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Tooltip
                    title={gamesPlayed === 0 ? "No games played yet" : ""}
                    placement="top"
                    disableHoverListener={gamesPlayed !== 0}
                    disableFocusListener={gamesPlayed !== 0}
                    disableTouchListener={gamesPlayed !== 0}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        lineHeight: 1.1,
                        fontWeight: 800,
                        color:
                          gamesPlayed === 0 ? "text.disabled" : "text.primary",
                      }}
                    >
                      {gamesPlayed === 0 ? "—" : stat.value}
                    </Typography>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}

          {footerLabel && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                justifyContent: "center",
                py: 1.25,
                px: 2,
                borderRadius: 1.5,
                bgcolor: "var(--cs-semantic-color-action-hover)",
                color: "var(--cs-semantic-color-brand-primary-main)",
                transition: theme.transitions.create([
                  "background-color",
                  "color",
                ]),
                "&:hover": {
                  bgcolor: "var(--cs-semantic-color-action-active)",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.75rem",
                }}
              >
                {footerLabel}
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EntityCard;
