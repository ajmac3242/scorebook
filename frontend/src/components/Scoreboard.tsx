import React from "react";
import {
  Box,
  Typography,
  Chip,
  useTheme,
  keyframes,
} from "@mui/material";
import { OpponentThreat } from "../utils/stats";
import TeamSection from "./Scoreboard/TeamSection";
import MomentumAlerts from "./Scoreboard/MomentumAlerts";
import GameClock from "./Scoreboard/GameClock";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;


interface ScoreboardProps {
  game:
    | {
        opponent?: string;
        opponentLogoUrl?: string;
        completed?: number;
        deletedAt?: string;
        timeoutLimit?: number;
      }
    | null
    | undefined;
  team:
    | {
        name?: string;
        logoUrl?: string;
        periodType?: string;
        fouls?: number;
        deletedAt?: string;
        defaultTimeoutLimit?: number;
      }
    | null
    | undefined;
  gameData: {
    currentScore: number;
    opponentScore: number;
    teamPpp: string;
    oppPpp: string;
    teamFoulStats: {
      teamFouls: number;
      oppFouls: number;
      teamBonusLabel: string;
      teamIsDouble: boolean;
      teamBonusColor: string;
      oppBonusLabel: string;
      oppIsDouble: boolean;
      oppBonusColor: string;
    };
    timeoutStats: {
      teamTOL: number;
      oppTOL: number;
    };
    possessionState: string | null;
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
  };
  period: number;
  periodLabel: string;
  maxPeriod: number;
  isReadOnly: boolean;
  clockSeconds: number;
  isClockRunning: boolean;
  onEditClock?: () => void;
}

export const Scoreboard = React.memo(
  ({
    game,
    team,
    gameData,
    period,
    periodLabel,
    maxPeriod,
    isReadOnly,
    clockSeconds,
    isClockRunning,
    onEditClock,
  }: ScoreboardProps) => {
    const theme = useTheme();
    const timeoutTotal = game?.timeoutLimit ?? team?.defaultTimeoutLimit ?? 3;

    const renderTeamSection = (
      name: string,
      logoUrl: string | undefined,
      score: number,
      timeouts: number,
      isOpponent: boolean,
    ) => {
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
                data-testid={
                  isOpponent ? "opp-timeout-dots" : "team-timeout-dots"
                }
              />
              {!isOpponent && (
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      timeouts <= 1 ? "error.light" : "rgba(255,255,255,0.5)",
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

    return (
      <Box
        sx={{
          background:
            "linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)",
          borderRadius: 4,
          p: { xs: 1.5, sm: 3 },
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Accent Line */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            opacity: 0.8,
          }}
        />

        {/* Our Team */}
        <TeamSection
          name={team?.name || "TEAM"}
          logoUrl={team?.logoUrl}
          score={gameData.currentScore}
          timeouts={gameData.timeoutStats.teamTOL}
          timeoutTotal={timeoutTotal}
          isOpponent={false}
        />

        {/* Center: Period, Clock, Bonus */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            px: 2,
          }}
          role="status"
          aria-live="off"
        >
          {/* 🏀 Assistant Coach: Live Sync Indicator */}
          {!isReadOnly && !game?.completed && (
            <Box
              role="status"
              aria-live="polite"
              sx={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Chip
                label="LIVE SYNC ACTIVE"
                size="small"
                color="success"
                sx={{
                  height: 16,
                  fontSize: "0.55rem",
                  fontWeight: 800,
                  opacity: 0.8,
                  animation: `${pulse} 3s infinite ease-in-out`,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.5rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                1 Assistant Connected
              </Typography>
            </Box>
          )}
          {/* Momentum Alerts */}
          <MomentumAlerts momentumAlerts={gameData.momentumAlerts} />

          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontWeight: 800,
              fontSize: { xs: "0.7rem", sm: "1rem" },
              letterSpacing: 2,
              mb: 0.5,
            }}
            aria-label={`Current Period: ${period > maxPeriod ? `Overtime ${period - maxPeriod}` : `${periodLabel} ${period}`}`}
            aria-current="step"
          >
            {period > maxPeriod
              ? `OT ${period - maxPeriod}`
              : `${periodLabel} ${period}`.toUpperCase()}
          </Typography>

          <GameClock
            clockSeconds={clockSeconds}
            isClockRunning={isClockRunning}
            period={period}
            onEditClock={onEditClock}
            isReadOnly={isReadOnly}
          />

          {/* Bonus Indicators */}
          <Box
            sx={{ mt: 1.5, height: 20, display: "flex", gap: 2 }}
            aria-label="Bonus status"
          >
            {gameData.teamFoulStats.teamBonusLabel && (
              <Typography
                sx={{
                  color: "#FFD700",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                }}
                aria-label="Team is in bonus"
              >
                BONUS →
              </Typography>
            )}
            {gameData.teamFoulStats.oppBonusLabel && (
              <Typography
                sx={{
                  color: "#FFD700",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                }}
                aria-label="Opponent is in bonus"
              >
                ← BONUS
              </Typography>
            )}
          </Box>
        </Box>

        {/* Opponent Team */}
        <TeamSection
          name={game?.opponent || "OPPONENT"}
          logoUrl={game?.opponentLogoUrl}
          score={gameData.opponentScore}
          timeouts={gameData.timeoutStats.oppTOL}
          timeoutTotal={timeoutTotal}
          isOpponent={true}
        />
      </Box>
    );
  },
);
