import React from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

type EntityRowCardProps = {
  leading?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  metrics?: React.ReactNode;
  actions?: React.ReactNode;
  /** Inline trailing content rendered right-aligned inside the main row (no divider). */
  trailing?: React.ReactNode;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement | HTMLDivElement>;
  ariaLabel?: string;
  accentColor?: string;
};

const EntityRowCard: React.FC<EntityRowCardProps> = ({
  leading,
  eyebrow,
  title,
  subtitle,
  badges,
  metrics,
  actions,
  trailing,
  onClick,
  onKeyDown,
  ariaLabel,
  accentColor,
}) => {
  const tokens = useTokens();

  const cardRadius = tokens.semantic.shape.radius.lg;
  const nestedRadius = tokens.semantic.shape.radius.md;
  const isClickable = Boolean(onClick);

  const content = (
    <Box
      sx={{
        width: "100%",
        borderRadius: `${cardRadius}px`,
        border: "1px solid",
        borderColor: "var(--cs-semantic-color-border-subtle)",
        bgcolor: "var(--cs-semantic-color-background-paper)",
        overflow: "hidden",
        transition: [
          `transform ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          `box-shadow ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          `border-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
        ].join(", "),
        boxShadow: tokens.semantic.elevation.shadow.xs,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: actions ? "minmax(0, 1fr) auto" : "1fr",
          },
          alignItems: "stretch",
        }}
      >
        <Stack
          direction="row"
          spacing={`${tokens.semantic.spacing.md / 8}px`}
          sx={{
            alignItems: "center",
            px: `${tokens.semantic.spacing.md / 8}px`,
            py: `${tokens.semantic.spacing.sm / 8}px`,
            minWidth: 0,
          }}
        >
          {leading ? (
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              {leading}
            </Box>
          ) : null}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {eyebrow ? (
              <Box
                sx={{
                  color: "var(--cs-semantic-color-text-secondary)",
                  fontSize: tokens.semantic.typography.supporting.fontSize,
                  lineHeight: tokens.semantic.typography.supporting.lineHeight,
                  mb: 0.25,
                }}
              >
                {eyebrow}
              </Box>
            ) : null}

            <Typography
              variant="h6"
              sx={{
                fontWeight: tokens.semantic.typography.h6.fontWeight,
                fontSize: tokens.semantic.typography.h6.fontSize,
                lineHeight: tokens.semantic.typography.h6.lineHeight,
                color: "var(--cs-semantic-color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            {subtitle ? (
              <Typography
                variant="body2"
                sx={{
                  color: "var(--cs-semantic-color-text-secondary)",
                  mt: 0.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle}
              </Typography>
            ) : null}

            {badges || metrics ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  mt: 1,
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                {badges ? <Box>{badges}</Box> : <Box />}
                {metrics ? <Box>{metrics}</Box> : null}
              </Stack>
            ) : null}
          </Box>

          {trailing ? (
            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                pl: `${tokens.semantic.spacing.md / 8}px`,
              }}
            >
              {trailing}
            </Box>
          ) : null}
        </Stack>

        {actions ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: `${tokens.semantic.spacing.md / 8}px`,
              py: `${tokens.semantic.spacing.sm / 8}px`,
              borderTop: { xs: "1px solid", md: "none" },
              borderLeft: {
                xs: "none",
                md: "1px solid",
              },
              borderColor: "var(--cs-semantic-color-border-subtle)",
              borderRadius: {
                xs: `0 0 ${cardRadius}px ${cardRadius}px`,
                md: `0 ${cardRadius}px ${cardRadius}px 0`,
              },
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: { xs: "space-between", md: "flex-end" },
                alignItems: "center",
                gap: `${tokens.semantic.spacing.sm / 8}px`,
                flexWrap: "wrap",
              }}
            >
              {actions}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  );

  if (!isClickable) {
    return content;
  }

  return (
    <ButtonBase
      component="div"
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        display: "block",
        borderRadius: `${nestedRadius}px`,
        textAlign: "left",
        cursor: "pointer",
        "&:hover > div": {
          transform: `translateY(-${tokens.semantic.spacing.xs / 8}px)`,
          boxShadow: tokens.semantic.elevation.shadow.card,
          borderColor:
            accentColor || "var(--cs-semantic-color-brand-primary-main)",
        },
        "&:focus-visible": {
          outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
          outlineOffset: tokens.semantic.focus.offset,
          borderRadius: `${nestedRadius}px`,
        },
      }}
    >
      {content}
    </ButtonBase>
  );
};

export default EntityRowCard;
