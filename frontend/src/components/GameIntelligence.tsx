import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  Alert,
  keyframes,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Star as StarIcon,
  Scale as BalanceIcon,
  ElectricBolt as ElectricBoltIcon,
} from "@mui/icons-material";
import { MoleskineCard } from "./SharedUI";
import {
  calculateTimeoutRecommendation,
  calculateClutchPlaybookRanking,
  calculatePpp,
  type OfficiatingStats,
  type PaceAnalytics,
  type MatchupStats,
} from "../utils/stats";
import { StatEvent } from "../db";
import { ANALYTICAL_BASELINES } from "../constants/stats";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

interface StrategicAdvisorHUDProps {
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
      teamFoulTrouble: (gameData.momentumAlerts.foulTroublePlayers?.length || 0) > 0,
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

export const ClutchPlaybookAdvisor: React.FC<{
  playbook: string[];
  allStats: StatEvent[];
  matchups: MatchupStats[];
  isClutch: boolean;
}> = ({ playbook: _, allStats, matchups, isClutch }) => {
  const topPlays = useMemo(() => {
    return calculateClutchPlaybookRanking(allStats, 240, matchups);
  }, [allStats, matchups]);

  if (!isClutch || topPlays.length === 0) return null;

  return (
    <MoleskineCard
      sx={{
        border: "2px solid",
        borderColor: "primary.main",
        background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -10,
          right: -10,
          opacity: 0.1,
          transform: "rotate(15deg)"
        }}
      >
        <StarIcon sx={{ fontSize: 80, color: "primary.main" }} />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <StarIcon fontSize="small" /> CLUTCH PLAYBOOK
      </Typography>

      <Stack spacing={1.5}>
        {topPlays.map((play, idx) => (
          <Box key={play.playName} sx={{ p: 1, bgcolor: "rgba(255,255,255,0.5)", borderRadius: 1.5, border: "1px solid rgba(0,0,0,0.05)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {idx + 1}. {play.playName}
              </Typography>
              <Chip
                label={`${play.ppp.toFixed(2)} PPP`}
                size="small"
                color={play.ppp > 1.1 ? "success" : "primary"}
                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 900 }}
              />
            </Box>
            {play.targetMismatches.length > 0 && (
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                🎯 Target Opp #{play.targetMismatches[0].split(":")[1]}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </MoleskineCard>
  );
};

export const OfficiatingHUD: React.FC<{
  stats: OfficiatingStats;
}> = ({ stats }) => {
  const isTight = stats.tightness === "HIGH";

  return (
    <MoleskineCard sx={{ borderLeft: isTight ? "6px solid #f44336" : "1px solid rgba(0,0,0,0.12)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <BalanceIcon sx={{ fontSize: 18, color: "primary.main" }} /> OFFICIATING
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sx={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", textAlign: "center" }}>
            TEAM FOULS
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, textAlign: "center" }}>
            {stats.teamFouls} ({stats.teamFoulPct.toFixed(1)}%)
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", textAlign: "center" }}>
            OPP FOULS
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, textAlign: "center" }}>
            {stats.oppFouls} ({stats.oppFoulPct.toFixed(1)}%)
          </Typography>
        </Grid>
      </Grid>

      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: isTight ? "error.main" : "text.secondary" }}>
            REF TIGHTNESS (FPM)
          </Typography>
          {isTight && <Chip label="TIGHT" size="small" color="error" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 900 }} />}
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, (stats.fpm / (ANALYTICAL_BASELINES.BASELINE_FPM * 2)) * 100)}
          color={isTight ? "error" : "primary"}
          sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.05)" }}
        />
        <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5, fontSize: "0.6rem", opacity: 0.6 }}>
          {stats.fpm.toFixed(2)} fouls/min
        </Typography>
      </Box>
    </MoleskineCard>
  );
};

export const PaceHUD: React.FC<{
  analytics: PaceAnalytics;
  identityPace: number;
}> = ({ analytics, identityPace }) => {
  const isFastShift = analytics.pace > identityPace * 1.15;
  const isSlowShift = analytics.pace < identityPace * 0.85;

  return (
    <MoleskineCard
      sx={{
        bgcolor: analytics.paceShift ? "rgba(255, 235, 59, 0.05)" : "inherit",
        border: analytics.paceShift ? "1px solid #fbc02d" : "1px solid rgba(0,0,0,0.12)"
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <ElectricBoltIcon sx={{ fontSize: 18, color: "#ffb300" }} /> PACE & PRESSURE
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
            {analytics.pace > 0 ? analytics.pace.toFixed(0) : "0"}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>
            POSS / 40M
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: analytics.tempoDelta > 0 ? "success.main" : "error.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end"
            }}
          >
            {analytics.tempoDelta > 0 ? "+" : ""}{analytics.tempoDelta.toFixed(1)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6, fontSize: "0.6rem" }}>
            VS IDENTITY ({identityPace})
          </Typography>
        </Box>
      </Box>

      {analytics.paceShift && (
        <Alert
          severity="warning"
          icon={false}
          sx={{
            mt: 2,
            py: 0,
            px: 1,
            fontSize: "0.65rem",
            fontWeight: 800,
            "& .MuiAlert-message": { p: 0.5 }
          }}
        >
          TEMPO SHIFT: {isFastShift ? "SPEEDING UP" : isSlowShift ? "SLOWING DOWN" : "VOLATILE"}
        </Alert>
      )}
    </MoleskineCard>
  );
};

export const TargetAttackHUD: React.FC<{
  matchups: MatchupStats[];
}> = ({ matchups }) => {
  const target = useMemo(() => {
    return [...matchups]
      .filter((m) => m.isOpponentDefender && m.possessions >= 2)
      .sort((a, b) => {
        const pppA = parseFloat(calculatePpp(a.pointsAllowed, a.possessions));
        const pppB = parseFloat(calculatePpp(b.pointsAllowed, b.possessions));
        return pppB - pppA;
      })[0];
  }, [matchups]);

  if (!target) return null;

  const oppJersey = target.opponentPlayerId.split(":")[1] || "??";
  const ppp = calculatePpp(target.pointsAllowed, target.possessions);
  const isMismatch = parseFloat(target.stopPct) < 30 && target.possessions >= 3;

  return (
    <MoleskineCard
      sx={{
        border: isMismatch ? "2px solid #ff1744" : "1px solid rgba(0,0,0,0.12)",
        animation: isMismatch ? `${pulse} 2s infinite ease-in-out` : "none",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <SecurityIcon sx={{ fontSize: 18, color: "secondary.main" }} /> TARGET ATTACK
        </Typography>
        {isMismatch && (
          <Chip label="MISMATCH" size="small" color="error" sx={{ fontWeight: 900, height: 20, fontSize: "0.6rem" }} />
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40, fontWeight: 800 }}>
          {oppJersey}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Opponent #{oppJersey}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
            Allowing {ppp} PPP | {target.stopPct}% Stop Rate
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 1.5, p: 1, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
          💡 REC: Attack via Isolation or PnR
        </Typography>
      </Box>
    </MoleskineCard>
  );
};
