import React from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
  100% { opacity: 1; transform: scale(1); }
`;

export interface SyncBadgeProps {
  isLive?: boolean;
}

const SyncBadge: React.FC<SyncBadgeProps> = ({ isLive = false }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        bgcolor: isLive ? "rgba(34,197,94,0.12)" : "rgba(156,163,175,0.12)",
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: isLive ? "#22c55e" : "#9ca3af",
          animation: isLive ? `${pulse} 1.8s ease-in-out infinite` : "none",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          color: isLive ? "#22c55e" : "#9ca3af",
          lineHeight: 1,
        }}
      >
        {isLive ? "LIVE" : "OFFLINE"}
      </Typography>
    </Box>
  );
};

export default SyncBadge;
