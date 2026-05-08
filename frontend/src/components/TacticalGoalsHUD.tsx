import React from "react";
import { Box, Typography, Stack, Tooltip } from "@mui/material";
import { pulse } from "../styles/animations";

interface Goal {
  metric: string;
  threshold: number;
  direction: "above" | "below";
  currentValue: number;
  isMet: boolean;
}

interface TacticalGoalsHUDProps {
  goals: Goal[];
}

/**
 * 🏀 Assistant Coach: Tactical Goals HUD
 * WHY: Keeps the team's identity goals front-and-center during the game.
 * Status is color-coded and pulses when thresholds are met.
 */
export const TacticalGoalsHUD: React.FC<TacticalGoalsHUDProps> = ({ goals }) => {
  if (!goals || goals.length === 0) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "rgba(0,0,0,0.03)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "text.secondary",
          display: "block",
          mb: 1.5,
        }}
      >
        Tactical Identity Goals
      </Typography>
      <Stack spacing={1.5}>
        {goals.map((goal, idx) => (
          <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                {goal.metric}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                Target: {goal.direction === "above" ? ">" : "<"} {goal.threshold}
              </Typography>
            </Box>
            <Tooltip title={goal.isMet ? "Goal Met" : "Below Target"}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: goal.isMet ? "success.main" : "error.light",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "0.8rem",
                  animation: goal.isMet ? `${pulse} 2s infinite ease-in-out` : "none",
                  transition: "all 0.3s ease",
                  minWidth: 50,
                  textAlign: "center",
                }}
              >
                {goal.currentValue}
                {goal.metric.includes("%") ? "%" : ""}
              </Box>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
