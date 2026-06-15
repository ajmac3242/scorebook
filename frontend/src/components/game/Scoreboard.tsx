import React from "react";
import { Box, Typography, Stack, Tooltip } from "@mui/material";
import {
  LocalFireDepartment,
  Shield,
  SportsBasketball,
} from "@mui/icons-material";
import { OpponentThreat, HaltAlert } from "../../utils/stats";
import { formatClock } from "../../utils/mathUtils";
import { pulse, slideBackAndForth } from "../../styles/animations";
import { TeamPanel } from "./TeamPanel";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

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
      teamRun: string | null;
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
    const timeoutTotal = game?.timeoutLimit ?? team?.defaultTimeoutLimit ?? 3;
    const [showKillOverlay, setShowKillOverlay] = React.useState(false);
    const lastKillCount = React.useRef(gameData.defensiveStats.totalKills);

    React.useEffect(() => {
      if (gameData.defensiveStats.totalKills > lastKillCount.current) {
        setShowKillOverlay(true);
        const timer = setTimeout(() => setShowKillOverlay(false), 3000);
        lastKillCount.current = gameData.defensiveStats.totalKills;
        return () => clearTimeout(timer);
      }
      lastKillCount.current = gameData.defensiveStats.totalKills;
    }, [gameData.defensiveStats.totalKills]);

    return (
      <Box
        sx={{
          background:
            "var(--cs-semantic-color-component-scoreboard-background)",
          borderRadius: "var(--cs-semantic-shape-radius-xl)",
          p: "var(--cs-semantic-spacing-lg)",
          mb: "var(--cs-semantic-spacing-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--cs-semantic-color-component-scoreboard-shadow)",
          border: "var(--cs-semantic-color-component-scoreboard-border)",
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
            height: "4px",
            background: `linear-gradient(90deg, var(--cs-semantic-color-brand-primary-main) 0%, var(--cs-semantic-color-brand-secondary-main) 100%)`,
            opacity: 0.8,
          }}
        />

        {/* KILL ACHIEVED Overlay */}
        {showKillOverlay && (
          <Box
            role="alert"
            aria-live="assertive"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(45deg, rgba(255,107,26,0.9) 0%, rgba(217,85,13,0.9) 100%)",
              animation: `${pulse} 0.5s ease-in-out`,
            }}
          >
            <Stack sx={{ alignItems: "center" }} spacing={1}>
              <LocalFireDepartment sx={{ fontSize: "4rem", color: "white" }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-inverse)",
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  letterSpacing: 4,
                }}
              >
                KILL ACHIEVED
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}
              >
                3 STOPS IN A ROW
              </Typography>
            </Stack>
          </Box>
        )}

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
                      ? "var(--cs-semantic-color-feedback-error-main)"
                      : alert.severity === "warning"
                        ? "var(--cs-semantic-color-feedback-warning-main)"
                        : "var(--cs-semantic-color-feedback-info-main)",
                  color:
                    alert.severity === "warning"
                      ? "var(--cs-semantic-color-text-primary)"
                      : "var(--cs-semantic-color-text-inverse)",
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
        <Box
          sx={{ position: "relative" }}
          aria-live="polite"
          aria-label={
            gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
              ? "Our Team has possession"
              : ""
          }
        >
          <TeamPanel
            name={team?.name || "TEAM"}
            logoUrl={team?.logoUrl}
            score={gameData.currentScore}
            timeouts={gameData.timeoutStats.teamTOL}
            timeoutTotal={timeoutTotal}
            isOpponent={false}
          />
          {gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM && (
            <Tooltip title="Current Possession">
              <SportsBasketball
                sx={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  color: "var(--cs-semantic-color-brand-primary-main)",
                  fontSize: "1.2rem",
                  animation: `${pulse} 2s infinite ease-in-out`,
                }}
              />
            </Tooltip>
          )}
        </Box>

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
            gameData.momentumAlerts.teamRun ||
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
              {gameData.momentumAlerts.scoringDrought && (
                <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                  <Typography
                    variant="caption"
                    role="status"
                    aria-live="polite"
                    sx={{
                      bgcolor: "var(--cs-semantic-color-feedback-warning-main)",
                      color: "var(--cs-semantic-color-text-primary)",
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    {"DROUGHT: "}
                    {gameData.momentumAlerts.scoringDrought}
                  </Typography>
                </Stack>
              )}
              {gameData.momentumAlerts.teamRun && (
                <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                  <Typography
                    variant="caption"
                    role="status"
                    aria-live="polite"
                    sx={{
                      bgcolor: "var(--cs-semantic-color-feedback-success-main)",
                      color: "var(--cs-semantic-color-text-inverse)",
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    {"TEAM RUN: "}
                    {gameData.momentumAlerts.teamRun}
                  </Typography>
                </Stack>
              )}
              {gameData.momentumAlerts.opponentRun && (
                <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                  <Typography
                    variant="caption"
                    role="status"
                    aria-live="polite"
                    sx={{
                      bgcolor: "var(--cs-semantic-color-feedback-error-main)",
                      color: "var(--cs-semantic-color-text-inverse)",
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    {"RUN: "}
                    {gameData.momentumAlerts.opponentRun}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: "var(--cs-semantic-color-background-elevated)",
                      color: "var(--cs-semantic-color-feedback-error-main)",
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
                  sx={{ alignItems: "center" }}
                  role="alert"
                  aria-live="polite"
                >
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: "var(--cs-semantic-color-feedback-warning-main)",
                      color: "var(--cs-semantic-color-text-primary)",
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
                        bgcolor: "var(--cs-semantic-color-background-elevated)",
                        color: "var(--cs-semantic-color-feedback-warning-dark)",
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
              color: "var(--cs-semantic-color-text-tertiary)",
              fontWeight: "var(--cs-typography-fontWeight-bold)",
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
                aria-live="off"
                sx={{
                  color: "var(--cs-semantic-color-text-inverse)",
                  fontSize: { xs: "1.5rem", sm: "2.5rem" },
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  fontFamily: "var(--cs-typography-fontFamily-mono)",
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
                    background: `linear-gradient(90deg, transparent, var(--cs-semantic-color-brand-primary-main), transparent)`,
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
                  color: "var(--cs-semantic-color-feedback-warning-main)",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                }}
              >
                BONUS →
              </Typography>
            )}

            {/* Defensive Momentum HUD */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Tooltip
                title={`Total Defensive Stops: ${gameData.defensiveStats.totalStops}`}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: "center" }}
                >
                  <Shield
                    sx={{
                      fontSize: "1rem",
                      color: "var(--cs-semantic-color-brand-primary-main)",
                      opacity: 0.8,
                    }}
                  />
                  <Typography
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      fontSize: "0.75rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                    }}
                  >
                    {gameData.defensiveStats.totalStops}
                  </Typography>
                </Stack>
              </Tooltip>

              <Tooltip
                title={`Total Kills: ${gameData.defensiveStats.totalKills}`}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: "center" }}
                >
                  <LocalFireDepartment
                    sx={{
                      fontSize: "1.1rem",
                      color: "var(--cs-semantic-color-feedback-error-main)",
                      animation:
                        gameData.defensiveStats.totalKills > 0
                          ? `${pulse} 2s infinite ease-in-out`
                          : "none",
                    }}
                  />
                  <Typography
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      fontSize: "0.85rem",
                      fontWeight: 900,
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
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "var(--cs-semantic-color-action-disabledBackground)",
                      boxShadow:
                        gameData.defensiveStats.currentStreak >= dot
                          ? `0 0 8px var(--cs-semantic-color-feedback-error-main)`
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
                  color: "var(--cs-semantic-color-feedback-warning-main)",
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
        <Box
          sx={{ position: "relative" }}
          aria-live="polite"
          aria-label={
            gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
              ? "Opponent has possession"
              : ""
          }
        >
          <TeamPanel
            name={game?.opponent || "OPPONENT"}
            logoUrl={game?.opponentLogoUrl}
            score={gameData.opponentScore}
            timeouts={gameData.timeoutStats.oppTOL}
            timeoutTotal={timeoutTotal}
            isOpponent={true}
          />
          {gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT && (
            <Tooltip title="Current Possession">
              <SportsBasketball
                sx={{
                  position: "absolute",
                  top: -10,
                  left: -10,
                  color: "var(--cs-semantic-color-brand-secondary-main)",
                  fontSize: "1.2rem",
                  animation: `${pulse} 2s infinite ease-in-out`,
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  },
);
