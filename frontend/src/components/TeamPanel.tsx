import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { AnimatedNumber } from "./SharedUI";
import TimeoutDots from "./TimeoutDots";

export interface TeamPanelProps {
  name: string;
  logoUrl?: string;
  score: number;
  timeouts: number;
  timeoutTotal: number;
  isOpponent: boolean;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({
  name,
  logoUrl,
  score,
  timeouts,
  timeoutTotal,
  isOpponent,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 3 },
        flexDirection: isOpponent ? "row-reverse" : "row",
      }}
    >
      {/* Logo & Name */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: { xs: 50, sm: 80 },
        }}
      >
        <Avatar
          src={logoUrl}
          sx={{
            width: { xs: 36, sm: 56 },
            height: { xs: 36, sm: 56 },
            bgcolor: isOpponent ? "secondary.main" : "primary.main",
            border: "2px solid rgba(255,255,255,0.2)",
            mb: 0.5,
          }}
        >
          {name.charAt(0)}
        </Avatar>
        <Typography
          variant="caption"
          sx={{
            color: "white",
            fontWeight: 700,
            fontSize: { xs: "0.6rem", sm: "0.8rem" },
            textTransform: "uppercase",
            letterSpacing: 1,
            textAlign: "center",
            maxWidth: { xs: 60, sm: 100 },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
      </Box>

      {/* Score & Timeouts */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: "white",
            fontSize: { xs: "2rem", sm: "3.5rem" },
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "'Inter', sans-serif",
            mb: 1,
          }}
          aria-live="polite"
          aria-label={`${name} score: ${score}`}
        >
          <AnimatedNumber value={score} />
        </Typography>
        <TimeoutDots
          count={timeouts}
          total={timeoutTotal}
          data-testid={isOpponent ? "opp-timeout-dots" : "team-timeout-dots"}
        />
      </Box>
    </Box>
  );
};
