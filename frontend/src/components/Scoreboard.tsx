import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  useTheme,
} from "@mui/material";
import { OpponentThreat } from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { AnimatedNumber } from "./SharedUI";
import TimeoutDots from "./TimeoutDots";
import { pulse, slideBackAndForth } from "../styles/animations";

/**
 * Redesigned TV-style scoreboard header.
 */
export interface ScoreboardProps {
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
              aria-live="polite"
              aria-label={`${name} score: ${score}`}
            >
              <AnimatedNumber value={score} />
            </Typography>
            <TimeoutDots
              count={timeouts}
              total={timeoutTotal}
              data-testid={
                isOpponent ? "opp-timeout-dots" : "team-timeout-dots"
              }
            />
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
        {renderTeamSection(
          team?.name || "TEAM",
          team?.logoUrl,
          gameData.currentScore,
          gameData.timeoutStats.teamTOL,
          false,
        )}

        {/* Center: Period, Clock, Bonus */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            px: 2,
          }}
        >
          {/* Momentum Alerts */}
          {(gameData.momentumAlerts.opponentRun ||
            gameData.momentumAlerts.scoringDrought ||
            gameData.momentumAlerts.opponentThreats.length > 0) && (
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
              {gameData.momentumAlerts.opponentRun && (
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
                    RUN: {gameData.momentumAlerts.opponentRun}
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
              {gameData.momentumAlerts.opponentThreats.map((t) => (
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
          )}

          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontWeight: 800,
              fontSize: { xs: "0.7rem", sm: "1rem" },
              letterSpacing: 2,
              mb: 0.5,
            }}
          >
            {period > maxPeriod
              ? `OT ${period - maxPeriod}`
              : `${periodLabel} ${period}`.toUpperCase()}
          </Typography>

          <Box
            onClick={onEditClock}
            role="button"
            tabIndex={isReadOnly ? -1 : 0}
            aria-label={`Game clock: ${formatClock(clockSeconds)}, Period ${period}. Click to edit.`}
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
              sx={{
                color: "white",
                fontSize: { xs: "1.5rem", sm: "2.5rem" },
                fontWeight: 700,
                fontFamily: "'Courier New', monospace",
                lineHeight: 1,
                letterSpacing: 1,
              }}
            >
              {formatClock(clockSeconds)}
            </Typography>

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

          {/* Bonus Indicators */}
          <Box sx={{ mt: 1.5, height: 20, display: "flex", gap: 2 }}>
            {gameData.teamFoulStats.teamBonusLabel && (
              <Typography
                sx={{
                  color: "#FFD700",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                }}
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
              >
                ← BONUS
              </Typography>
            )}
          </Box>
        </Box>

        {/* Opponent Team */}
        {renderTeamSection(
          game?.opponent || "OPPONENT",
          game?.opponentLogoUrl,
          gameData.opponentScore,
          gameData.timeoutStats.oppTOL,
          true,
        )}
      </Box>
    );
  },
);
