import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { pulse } from "../styles/animations";
import { OpponentThreat } from "../utils/stats";

interface MomentumAlertsProps {
  momentumAlerts: {
    opponentRun: string | null;
    scoringDrought: string | null;
    opponentThreats: OpponentThreat[];
  };
}

export const MomentumAlerts: React.FC<MomentumAlertsProps> = ({ momentumAlerts }) => {
  if (!momentumAlerts.opponentRun && !momentumAlerts.scoringDrought && momentumAlerts.opponentThreats.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {momentumAlerts.opponentRun && (
        <Stack spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
            role="status"
            aria-live="polite"
            sx={{
              bgcolor: "error.main",
              color: "white",
              px: 1,
              borderRadius: 1,
              fontSize: "0.6rem",
              fontWeight: 800,
              animation: `${pulse} 2s infinite ease-in-out`,
            }}
          >
            RUN: {momentumAlerts.opponentRun}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              bgcolor: "rgba(255,255,255,0.9)",
              color: "error.main",
              px: 1,
              borderRadius: 1,
              fontSize: "0.5rem",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            Suggest Timeout
          </Typography>
        </Stack>
      )}
      {momentumAlerts.opponentThreats.map((t) => (
        <Stack key={t.playerId} spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
            sx={{
              bgcolor: "warning.main",
              color: "black",
              px: 1,
              borderRadius: 1,
              fontSize: "0.55rem",
              fontWeight: 900,
              animation: `${pulse} 2.5s infinite ease-in-out`,
            }}
          >
            {t.straightPoints >= 6
              ? `THREAT: Opp #${t.playerId.split(":")[1] || "??"} has scored ${t.straightPoints} STRAIGHT`
              : `THREAT: Opp #${t.playerId.split(":")[1] || "??"} (${t.points} pts)`}
          </Typography>
          {t.straightPoints >= 8 && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "warning.dark",
                px: 1,
                borderRadius: 1,
                fontSize: "0.45rem",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Change Matchup
            </Typography>
          )}
        </Stack>
      ))}
    </Box>
  );
};

export default MomentumAlerts;
