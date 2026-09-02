import React from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useTokens } from "../../theme/useTokens";

const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
  100% { opacity: 1; transform: scale(1); }
`;

export interface SyncBadgeProps {
  isLive?: boolean;
}

const SyncBadge: React.FC<SyncBadgeProps> = ({ isLive = false }) => {
  const tokens = useTokens();
  const liveColor = tokens.semantic.color.feedback.success.main;
  const offlineColor = tokens.semantic.color.text.muted;

  return (
    <Box
      role="status"
      aria-label={isLive ? "Live synchronization active" : "Offline mode"}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.semantic.spacing.xs / 2}px`,
        px: `${tokens.semantic.spacing.xs}px`,
        py: `${tokens.semantic.spacing.xs / 2}px`,
        borderRadius: `${tokens.semantic.shape.radius.sm}px`,
        bgcolor: isLive
          ? tokens.semantic.color.feedback.success.light
          : tokens.semantic.color.action.disabledBackground,
        opacity: isLive ? 1 : 0.8,
      }}
    >
      <Box
        sx={{
          width: tokens.semantic.spacing.xs,
          height: tokens.semantic.spacing.xs,
          borderRadius: "50%",
          bgcolor: isLive ? liveColor : offlineColor,
          animation: isLive ? `${pulse} 1.8s ease-in-out infinite` : "none",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: tokens.semantic.typography.overline.fontWeight,
          fontSize: tokens.typography.fontSize.xs,
          letterSpacing: tokens.semantic.typography.overline.letterSpacing,
          color: isLive ? liveColor : offlineColor,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {isLive ? "LIVE" : "OFFLINE"}
      </Typography>
    </Box>
  );
};

export default SyncBadge;
