import React, { useMemo } from "react";
import { Typography, Button } from "@mui/material";
import {} from "@mui/icons-material";
import { MoleskineCard } from "../SharedUI";
import { calculateTimeoutRecommendation } from "../../utils/stats";

export interface StrategicAdvisorHUDProps {
  gameData: {
    currentScore: number;
    opponentScore: number;
    timeoutStats: { teamTOL: number };
    momentumAlerts: {
      opponentRun: string | null;
      foulTroublePlayers?: string[];
      isClutchMode?: boolean;
    };
  };
  clockSeconds: number;
  period: number;
  isClockRunning: boolean;
}

export const StrategicAdvisorHUD: React.FC<StrategicAdvisorHUDProps> = ({
  gameData,
  clockSeconds,
  period,
  isClockRunning,
}) => {
  const recommendation = useMemo(() => {
    return calculateTimeoutRecommendation({
      opponentRun: gameData.momentumAlerts.opponentRun,
      teamFoulTrouble:
        (gameData.momentumAlerts.foulTroublePlayers?.length || 0) > 0,
      clutchMode: !!gameData.momentumAlerts.isClutchMode,
      timeoutsRemaining: gameData.timeoutStats.teamTOL,
      isClockRunning,
      scoreSpread: gameData.currentScore - gameData.opponentScore,
      clockSeconds,
      period,
    });
  }, [gameData, clockSeconds, period, isClockRunning]);

  if (!recommendation.recommendation) return null;

  const color =
    recommendation.urgency === "HIGH"
      ? "error.main"
      : recommendation.urgency === "MEDIUM"
        ? "warning.main"
        : "primary.main";

  return (
    <MoleskineCard sx={{ borderLeft: `6px solid ${color}` }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color }}>
        🏆 STRATEGIC ADVISOR
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
        {recommendation.recommendation}
      </Typography>
      {recommendation.urgency === "HIGH" && (
        <Button
          variant="contained"
          color="error"
          size="small"
          fullWidth
          sx={{ mt: 2, fontWeight: 900 }}
          onClick={() => {
            // In a real app, this might open the timeout dialog
          }}
        >
          ADVISE TIMEOUT
        </Button>
      )}
    </MoleskineCard>
  );
};
