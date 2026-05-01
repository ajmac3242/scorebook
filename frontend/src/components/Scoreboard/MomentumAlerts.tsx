import React from "react";
import { Box, Typography, Stack, keyframes } from "@mui/material";
import { OpponentThreat } from "../../utils/stats";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

interface MomentumAlertsProps {
  momentumAlerts: {
    opponentRun: string | null;
    scoringDrought: string | null;
    opponentThreats: OpponentThreat[];
    opponentPlayThreats?: { name: string; ppp: string; frequency: number }[];
    isClutchMode?: boolean;
    teamBonusApproaching?: boolean;
    oppBonusApproaching?: boolean;
    foulTroublePlayers?: string[];
  };
}

const MomentumAlerts: React.FC<MomentumAlertsProps> = ({ momentumAlerts }) => {
  const alerts = momentumAlerts;
  const hasAlerts =
    alerts.opponentRun ||
    alerts.scoringDrought ||
    alerts.isClutchMode ||
    alerts.teamBonusApproaching ||
    alerts.oppBonusApproaching ||
    (alerts.foulTroublePlayers?.length || 0) > 0 ||
    alerts.opponentThreats.length > 0;

  if (!hasAlerts) return null;

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
      {alerts.isClutchMode && (
        <Typography
          variant="caption"
          sx={{
            bgcolor: "primary.main",
            color: "white",
            px: 1,
            borderRadius: 1,
            fontSize: "0.6rem",
            fontWeight: 900,
            animation: `${pulse} 1.5s infinite ease-in-out`,
          }}
        >
          🔥 CLUTCH MODE ACTIVE
        </Typography>
      )}
      {alerts.teamBonusApproaching && (
        <Typography
          variant="caption"
          sx={{
            bgcolor: "warning.main",
            color: "black",
            px: 1,
            borderRadius: 1,
            fontSize: "0.55rem",
            fontWeight: 800,
          }}
        >
          ⚠️ BONUS APPROACHING (TEAM)
        </Typography>
      )}
      {alerts.oppBonusApproaching && (
        <Typography
          variant="caption"
          sx={{
            bgcolor: "warning.main",
            color: "black",
            px: 1,
            borderRadius: 1,
            fontSize: "0.55rem",
            fontWeight: 800,
          }}
        >
          ⚠️ BONUS APPROACHING (OPP)
        </Typography>
      )}
      {alerts.foulTroublePlayers?.map((pName) => (
        <Typography
          key={pName}
          variant="caption"
          sx={{
            bgcolor: "error.main",
            color: "white",
            px: 1,
            borderRadius: 1,
            fontSize: "0.55rem",
            fontWeight: 800,
          }}
        >
          🚩 FOUL TROUBLE: {pName}
        </Typography>
      ))}
      {alerts.opponentRun && (
        <Stack spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
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
            RUN: {alerts.opponentRun}
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
      {alerts.opponentThreats.map((t) => (
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
              ? `THREAT: Opp #${t.playerId.split(":")[1] ?? "??"} has scored ${t.straightPoints} STRAIGHT`
              : `THREAT: Opp #${t.playerId.split(":")[1] ?? "??"} (${t.points} pts)`}
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

      {alerts.opponentPlayThreats?.map((play) => (
        <Stack key={play.name} spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
            sx={{
              bgcolor: "secondary.main",
              color: "white",
              px: 1,
              borderRadius: 1,
              fontSize: "0.55rem",
              fontWeight: 900,
              animation: `${pulse} 3s infinite ease-in-out`,
            }}
          >
            THREAT: {play.name} ({play.ppp} PPP)
          </Typography>
          <Typography
            variant="caption"
            sx={{
              bgcolor: "rgba(255,255,255,0.9)",
              color: "secondary.dark",
              px: 1,
              borderRadius: 1,
              fontSize: "0.45rem",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            Switch Defense
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

export default React.memo(MomentumAlerts);
