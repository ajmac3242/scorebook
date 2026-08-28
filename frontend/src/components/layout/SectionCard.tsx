import React from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { SurfaceCard } from "../cards/SurfaceCard";
import { useTokens } from "../../theme/useTokens";

type SectionCardProps = {
  title: React.ReactNode;
  onExpand?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  expandAriaLabel?: string;
};

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  onExpand,
  actions,
  children,
  expandAriaLabel = "Expand section",
}) => {
  const tokens = useTokens();
  return (
    <SurfaceCard sx={{ p: 0 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: tokens.semantic.spacing.md,
          py: tokens.semantic.spacing.xs,
          borderBottom: "1px solid",
          borderColor: tokens.semantic.color.border.subtle,
        }}
      >
        <Typography
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            fontSize: tokens.typography.fontSize.sm,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            color: tokens.semantic.color.text.secondary,
          }}
        >
          {title}
        </Typography>
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{ alignItems: "center" }}
        >
          {actions}
          {onExpand ? (
            <Tooltip title={expandAriaLabel}>
              <IconButton
                size="small"
                onClick={onExpand}
                aria-label={expandAriaLabel}
                sx={{
                  color: tokens.semantic.color.text.secondary,
                  borderRadius: `${tokens.semantic.shape.radius.sm}px`,
                }}
              >
                <OpenInFullIcon
                  sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
                />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
      <Box sx={{ p: tokens.semantic.spacing.md }}>{children}</Box>
    </SurfaceCard>
  );
};

export default SectionCard;
