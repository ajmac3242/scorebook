import React from "react";
import { Box, Typography, Stack, useTheme, Tooltip } from "@mui/material";
import { LocalFireDepartment, Shield } from "@mui/icons-material";
import { OpponentThreat, HaltAlert } from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { pulse, slideBackAndForth } from "../styles/animations";
import { TeamPanel } from "./TeamPanel";

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
    defensiveStats: {
      totalStops: number;
      totalKills: number;
      currentStreak: number;
    };
    possessionState: string | null;
    momentumAlerts: {
      opponentRun: string | null;
      scoringDrought: string | null;
      opponentThreats: OpponentThreat[];
    };
  };
  haltAlerts?: HaltAlert[];
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
    haltAlerts = [],
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

        {/* HALT Alerts Overlay */}
        {haltAlerts.length > 0 && (
          <Box
            role="alert"
            aria-live="assertive"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            {haltAlerts.map((alert) => (
              <Box
                key={alert.id}
                sx={{
                  bgcolor:
                    alert.severity === "error"
                      ? "error.main"
                      : alert.severity === "warning"
                        ? "warning.main"
                        : "info.main",
                  color: alert.severity === "warning" ? "black" : "white",
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  mb: 1,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  animation: `${pulse} 2s infinite ease-in-out`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, fontSize: "1.2rem" }}
                >
                  {alert.message}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Our Team */}
        <TeamPanel
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
                <Stack
                  key={t.playerId}
                  spacing={0.5}
                  alignItems="center"
                  role="status"
                  aria-live="polite"
                >
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

          <Tooltip
            title={isReadOnly ? "" : "Adjust Game Time and Clock Status"}
          >
            <Box
              onClick={onEditClock}
              role="button"
              tabIndex={isReadOnly ? -1 : 0}
              aria-label={`Game clock: ${formatClock(clockSeconds)}, ${isClockRunning ? "Running" : "Paused"}, Period ${period}. ${isReadOnly ? "" : "Click to edit."}`}
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
          </Tooltip>

          {/* Defensive Momentum & Bonus Indicators */}
          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              minHeight: 24,
            }}
          >
            {/* Team Bonus */}
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

            {/* Defensive Momentum HUD */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip
                title={`Total Defensive Stops: ${gameData.defensiveStats.totalStops}`}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Shield
                    sx={{
                      fontSize: "1rem",
                      color: "primary.main",
                      opacity: 0.8,
                    }}
                  />
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {gameData.defensiveStats.totalStops}
                  </Typography>
                </Stack>
              </Tooltip>

              <Tooltip
                title={`Total Kills: ${gameData.defensiveStats.totalKills}`}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocalFireDepartment
                    sx={{
                      fontSize: "1.1rem",
                      color: "error.main",
                      animation:
                        gameData.defensiveStats.totalKills > 0
                          ? `${pulse} 2s infinite ease-in-out`
                          : "none",
                    }}
                  />
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "0.85rem",
                      fontWeight: 900,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {gameData.defensiveStats.totalKills}
                  </Typography>
                </Stack>
              </Tooltip>

              {/* Current Stop Streak Dots */}
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor:
                        gameData.defensiveStats.currentStreak >= dot
                          ? "error.main"
                          : "rgba(255,255,255,0.1)",
                      boxShadow:
                        gameData.defensiveStats.currentStreak >= dot
                          ? `0 0 8px ${theme.palette.error.main}`
                          : "none",
                    }}
                  />
                ))}
              </Stack>
            </Stack>

            {/* Opponent Bonus */}
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
        <TeamPanel
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
