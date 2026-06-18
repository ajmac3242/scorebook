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

  // Typography primitives — live at tokens.typography.*, not tokens.semantic.typography.*
  const fw = tokens.typography.fontWeight;
  const fs = tokens.typography.fontSize;

  const transitionAll = `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`;

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (event) => {
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
          height: `${tokens.semantic.component.entityCard.accentStripHeight}px`,
          bgcolor: accentColor,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />

      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: `${tokens.semantic.spacing.sm}px`,
          px: `${cardPadding}px`,
          pt: `${cardPadding}px`,
          mb: `${cardPadding}px`,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: fw.bold,
              color: tokens.semantic.color.text.primary,
              lineHeight: 1.2,
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
                  p: tokens.layout.pagePaddingXUnits / 6,
                  color: isFavorite
                    ? tokens.semantic.color.brand.primary.main
                    : tokens.semantic.color.text.secondary,
                  flexShrink: 0,
                }}
                aria-label={
                  favoriteAriaLabel ||
                  (isFavorite ? "Remove from favorites" : "Add to favorites")
                }
              >
                {isFavorite ? (
                  <StarIcon fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          ) : null}

          {isFavorite && (
            <Chip
              label={badgeLabel || "DEFAULT"}
              size="small"
              sx={{
                height: 20,
                fontSize: fs.xs,
                fontWeight: fw.semibold,
                bgcolor: tokens.semantic.color.surface.accentSoft,
                color: tokens.semantic.color.brand.primary.main,
                border: "1px solid",
                borderColor: tokens.semantic.color.border.accent,
              }}
            />
          )}

          {/* Only render subtitle when it has a value — avoids phantom line-height space */}
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          )}

          {badgeLabel && !isFavorite ? (
            <Chip
              label={badgeLabel}
              size="small"
              sx={{
                height: 20,
                fontSize: fs.xs,
                mt: 0.5,
              }}
            />
          ) : null}
        </Box>

        {/* Logo / Avatar */}
        <Avatar
          src={imageUrl}
          alt={title}
          sx={{
            width: 48,
            height: 48,
            borderRadius: `${logoRadius}px`,
            bgcolor: accentColor,
            fontSize: fs.lg,
            fontWeight: fw.bold,
            flexShrink: 0,
            border: "2px solid",
            borderColor: tokens.semantic.color.border.subtle,
          }}
        >
          {fallbackInitials}
        </Avatar>
      </Box>

      {/* Highlight Section — always rendered at fixed height so all cards are uniform.
          win/loss record or "No games yet" both occupy the same vertical space. */}
      <Box
        sx={{
          mx: `${cardPadding}px`,
          mb: `${tokens.semantic.spacing.md}px`,
          borderRadius: `${nestedRadius}px`,
          px: `${highlightPaddingX}px`,
          py: `${tokens.semantic.spacing.xs}px`,
          minHeight: `${highlightHeight}px`,
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
            <Typography
              variant="h6"
              sx={{
                color: tokens.semantic.color.text.tertiary,
                lineHeight: 1.2,
                fontWeight: fw.semibold,
              }}
            >
              —
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.tertiary, mt: 0.25 }}
            >
              No games yet
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant="h5"
              sx={{
                fontWeight: fw.bold,
                color: tokens.semantic.color.text.primary,
                lineHeight: 1.2,
              }}
            >
              {highlightValue}
            </Typography>
            {highlightLabel && (
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary, mt: 0.25 }}
              >
                {highlightLabel}
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Stats Grid & Footer Section */}
      {stats.length > 0 && (
        <Stack
          direction="row"
          sx={{
            px: `${cardPadding}px`,
            pb: `${cardPadding}px`,
            pt: `${tokens.semantic.spacing.sm}px`,
            borderTop: "1px solid",
            borderColor: tokens.semantic.color.border.subtle,
          }}
        >
          {stats.map((stat) => (
            <Box key={stat.label} sx={{ flex: 1, textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: tokens.semantic.color.text.tertiary,
                  fontWeight: fw.medium,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: fs.xs,
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: fw.bold,
                  color: tokens.semantic.color.text.primary,
                }}
              >
                {gamesPlayed === 0 ? "—" : stat.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default EntityCard;
