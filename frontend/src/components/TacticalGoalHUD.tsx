import React from "react";
import { Box, Typography, LinearProgress, Stack, Tooltip } from "@mui/material";
import { type TacticalGoal } from "../db";
import { MoleskineCard } from "./SharedUI";
import { CheckCircle, Error } from "@mui/icons-material";

interface TacticalGoalHUDProps {
  goals: TacticalGoal[];
  currentStats: Record<string, number>;
}

const TacticalGoalHUD: React.FC<TacticalGoalHUDProps> = ({
  goals,
  currentStats,
}) => {
  if (!goals || goals.length === 0) return null;

  return (
    <MoleskineCard>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Tactical Goals
      </Typography>
      <Stack spacing={2}>
        {goals.map((goal, idx) => {
          const current = currentStats[goal.type] || 0;
          const target = goal.target;

          let isMet = false;
          switch (goal.operator) {
            case ">":
              isMet = current > target;
              break;
            case "<":
              isMet = current < target;
              break;
            case ">=":
              isMet = current >= target;
              break;
            case "<=":
              isMet = current <= target;
              break;
          }

          const progress = goal.operator.startsWith(">")
            ? Math.min(100, (current / (target || 1)) * 100)
            : Math.max(0, 100 - (current / (target || 1)) * 100);

          return (
            <Box key={idx}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {goal.label}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {current} / {target}
                  </Typography>
                  {isMet ? (
                    <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />
                  ) : (
                    <Error
                      sx={{ fontSize: 14, color: "error.main", opacity: 0.5 }}
                    />
                  )}
                </Box>
              </Box>
              <Tooltip title={`${current} vs ${goal.operator} ${target}`}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color={isMet ? "success" : "warning"}
                  aria-valuenow={current}
                  aria-valuemin={0}
                  aria-valuemax={target}
                  aria-label={`${goal.label} progress`}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "rgba(0,0,0,0.05)",
                  }}
                />
              </Tooltip>
            </Box>
          );
        })}
      </Stack>
    </MoleskineCard>
  );
};

export default TacticalGoalHUD;
