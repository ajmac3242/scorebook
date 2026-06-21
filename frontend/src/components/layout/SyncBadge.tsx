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
        gap: 0.75,
        px: `${tokens.semantic.spacing.xs}px`,
        py: 0.5,
        borderRadius: `${tokens.semantic.shape.radius.sm}px`,
        bgcolor: isLive
          ? tokens.semantic.color.feedback.success.light
          : tokens.semantic.color.action.disabledBackground,
        opacity: isLive ? 1 : 0.8,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: isLive ? liveColor : offlineColor,
          animation: isLive ? `${pulse} 1.8s ease-in-out infinite` : "none",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: tokens.semantic.typography.overline.fontWeight,
          fontSize: "0.65rem",
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
