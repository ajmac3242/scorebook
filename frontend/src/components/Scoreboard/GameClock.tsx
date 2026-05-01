import React from "react";
import { Box, Typography, useTheme, keyframes } from "@mui/material";
import { formatClock } from "../../utils/mathUtils";

const slideBackAndForth = keyframes`
  0% { left: 0%; }
  50% { left: 70%; }
  100% { left: 0%; }
`;

interface GameClockProps {
  clockSeconds: number;
  isClockRunning: boolean;
  period: number;
  onEditClock?: () => void;
  isReadOnly: boolean;
}

const GameClock: React.FC<GameClockProps> = ({
  clockSeconds,
  isClockRunning,
  period,
  onEditClock,
  isReadOnly,
}) => {
  const theme = useTheme();

  return (
    <Box
      onClick={onEditClock}
      role="button"
      tabIndex={isReadOnly ? -1 : 0}
      aria-label={`Game clock: ${formatClock(clockSeconds)}, Period ${period}, ${isClockRunning ? "Running" : "Paused"}. Click to edit.`}
      aria-haspopup="dialog"
      onKeyDown={(e) => {
        if (!isReadOnly && (e.key === "Enter" || e.key === " ")) {
          onEditClock?.();
        }
      }}
      sx={{
        cursor: isReadOnly ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        "&:hover": {
          opacity: isReadOnly ? 1 : 0.8,
        },
        "&:focus-visible": {
          outline: "2px solid white",
          outlineOffset: "4px",
          borderRadius: "4px",
        },
      }}
    >
      <Typography
        role="timer"
        aria-relevant="all"
        sx={{
          color: isClockRunning ? "white" : "rgba(255,255,255,0.4)",
          fontSize: { xs: "1.5rem", sm: "2.5rem" },
          fontWeight: 700,
          fontFamily: "'Courier New', monospace",
          lineHeight: 1,
          letterSpacing: 1,
          transition: "color 0.3s ease",
        }}
      >
        {formatClock(clockSeconds)}
      </Typography>

      {!isClockRunning && clockSeconds > 0 && (
        <Typography
          variant="caption"
          aria-live="polite"
          sx={{
            color: "rgba(255,255,255,0.3)",
            fontWeight: 900,
            fontSize: "0.55rem",
            letterSpacing: 1,
            mt: 0.5,
          }}
        >
          PAUSED
        </Typography>
      )}

      {/* Sliding Progress Indicator */}
      <Box
        sx={{
          width: "80%",
          height: "3px",
          bgcolor: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          mt: 1,
          position: "relative",
          overflow: "hidden",
          visibility: isClockRunning ? "visible" : "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "30%",
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
            animation: `${slideBackAndForth} 1.5s infinite ease-in-out`,
          }}
        />
      </Box>
    </Box>
  );
};

export default React.memo(GameClock);
