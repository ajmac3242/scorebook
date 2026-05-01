import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { AnimatedNumber } from "../SharedUI";
import TimeoutDots from "../TimeoutDots";

interface TeamSectionProps {
  name: string;
  logoUrl: string | undefined;
  score: number;
  timeouts: number;
  timeoutTotal: number;
  isOpponent: boolean;
}

const TeamSection: React.FC<TeamSectionProps> = ({
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
          aria-live="assertive"
          aria-atomic="true"
          aria-label={`${name} score: ${score}`}
        >
          <AnimatedNumber value={score} />
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <TimeoutDots
            count={timeouts}
            total={timeoutTotal}
            data-testid={isOpponent ? "opp-timeout-dots" : "team-timeout-dots"}
          />
          {!isOpponent && (
            <Typography
              variant="caption"
              sx={{
                color: timeouts <= 1 ? "error.light" : "rgba(255,255,255,0.5)",
                fontSize: "0.5rem",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {timeouts <= 1 ? "CRITICAL" : "SAFE"}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(TeamSection);
