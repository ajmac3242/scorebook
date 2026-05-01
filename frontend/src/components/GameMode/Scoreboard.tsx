import React from "react";
import {
  Box,
  Typography,
  Avatar,
  useTheme,
  Stack,
  keyframes,
} from "@mui/material";
import { formatClock } from "../../utils/mathUtils";
import { OpponentThreat } from "../../utils/stats/types";
import { AnimatedNumber } from "../SharedUI";
import TimeoutDots from "../TimeoutDots";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const slideBackAndForth = keyframes`
  0% { left: 0%; }
  50% { left: 70%; }
  100% { left: 0%; }
`;

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
                mb: 0.5,
                bgcolor: isOpponent ? "grey.800" : "primary.main",
                fontSize: { xs: "1rem", sm: "1.5rem" },
                fontWeight: "bold",
                border: "2px solid",
                borderColor: "divider",
              }}
            >
              {name.charAt(0)}
            </Avatar>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: { xs: "0.6rem", sm: "0.75rem" },
                color: "text.secondary",
                textAlign: "center",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </Typography>
          </Box>

          {/* Score & Possession */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: isOpponent ? "flex-end" : "flex-start",
              position: "relative",
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.5rem", sm: "4.5rem" },
                lineHeight: 1,
                fontFamily: "'Monaco', 'Courier New', monospace",
                color: "text.primary",
                textShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 20px rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              <AnimatedNumber value={score} />
            </Typography>

            {/* Timeouts */}
            <Box sx={{ mt: 1 }}>
              <TimeoutDots total={timeoutTotal} count={timeouts} />
            </Box>
          </Box>
        </Box>
      );
    };

    return (
      <Box
        sx={{
          bgcolor: "#0D1117",
          color: "white",
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "4px solid",
          borderBottomColor: "primary.main",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        {/* Team Section */}
        {renderTeamSection(
          team?.name || "TEAM",
          team?.logoUrl,
          gameData.currentScore,
          gameData.timeoutStats.teamTOL,
          false,
        )}

        {/* Center Clock & Period */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            mx: 2,
            position: "relative",
          }}
        >
          {/* Real-time Alerts Overlay */}
          {(gameData.momentumAlerts.opponentRun ||
            (gameData.momentumAlerts.opponentThreats &&
              gameData.momentumAlerts.opponentThreats.length > 0) ||
            (gameData.momentumAlerts.opponentPlayThreats &&
              gameData.momentumAlerts.opponentPlayThreats.length > 0) ||
            gameData.momentumAlerts.teamBonusApproaching ||
            gameData.momentumAlerts.oppBonusApproaching ||
            (gameData.momentumAlerts.foulTroublePlayers &&
              gameData.momentumAlerts.foulTroublePlayers.length > 0)) && (
            <Box
              sx={{
                position: "absolute",
                top: -60,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                zIndex: 1100,
              }}
            >
              {gameData.momentumAlerts.teamBonusApproaching && (
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
              {gameData.momentumAlerts.oppBonusApproaching && (
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
              {gameData.momentumAlerts.foulTroublePlayers?.map((pName) => (
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
              {gameData.momentumAlerts.opponentRun && (
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

              {gameData.momentumAlerts.opponentPlayThreats?.map((play) => (
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
            aria-label={`Current Period: ${period > maxPeriod ? `Overtime ${period - maxPeriod}` : `${periodLabel} ${period}`}`}
            aria-current="step"
          >
            {period > maxPeriod
              ? `OT ${period - maxPeriod}`
              : `${periodLabel} ${period}`.toUpperCase()}
          </Typography>

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
