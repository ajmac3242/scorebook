import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { SurfaceCard } from "../SharedUI";
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
          px: 2.5,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "var(--cs-typography-fontSize-sm)",
            letterSpacing: 0.3,
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {actions}
          {onExpand ? (
            <IconButton
              size="small"
              onClick={onExpand}
              aria-label={expandAriaLabel}
              sx={{
                color: "text.secondary",
                borderRadius: `${tokens.semantic.shape.radius.sm}px`,
              }}
            >
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
        </Stack>
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </SurfaceCard>
  );
};

export default SectionCard;
