import React from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTokens } from "../../theme/useTokens";

type EntityRowCardProps = {
  leading?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  metrics?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement | HTMLDivElement>;
  ariaLabel?: string;
  accentColor?: string;
  interactive?: boolean;
};

const DEFAULT_ACCENT = "#154C56";

const EntityRowCard: React.FC<EntityRowCardProps> = ({
  leading,
  eyebrow,
  title,
  subtitle,
  badges,
  metrics,
  actions,
  onClick,
  onKeyDown,
  ariaLabel,
  accentColor = DEFAULT_ACCENT,
  interactive = true,
}) => {
  const tokens = useTokens();

  const cardRadius = Math.max(tokens.semantic.component.sectionCard.radius, 20);
  const nestedRadius = Math.max(cardRadius - 6, 14);
  const isClickable = interactive && Boolean(onClick);

  const content = (
    <Box
      sx={{
        width: "100%",
        borderRadius: `${cardRadius}px`,
        border: "1px solid",
        borderColor: alpha(accentColor, 0.16),
        bgcolor: "background.paper",
        overflow: "hidden",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
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
          spacing={2}
          sx={{
            alignItems: "center",
            px: 2,
            py: 1.5,
            minWidth: 0,
          }}
        >
          {leading ? (
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{leading}</Box>
          ) : null}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {eyebrow ? (
              <Box
                sx={{
                  color: "text.secondary",
                  fontSize: "var(--cs-typography-fontSize-sm)",
                  lineHeight: 1.4,
                  mb: 0.25,
                }}
              >
                {eyebrow}
              </Box>
            ) : null}

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "var(--cs-typography-fontSize-md)",
                lineHeight: 1.25,
                color: "text.primary",
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
                color="text.secondary"
                sx={{
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
        </Stack>

        {actions ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: 2,
              py: 1.5,
              borderTop: { xs: "1px solid", md: "none" },
              borderLeft: { xs: "none", md: "1px solid" },
              borderColor: "divider",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(accentColor, 0.08)
                  : alpha(accentColor, 0.04),
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
                gap: 1,
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
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        display: "block",
        borderRadius: `${nestedRadius}px`,
        textAlign: "left",
        "&:hover > div": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          borderColor: alpha(accentColor, 0.24),
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 3,
          borderRadius: `${nestedRadius}px`,
        },
      }}
    >
      {content}
    </ButtonBase>
  );
};

export default EntityRowCard;