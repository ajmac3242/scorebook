import React from "react";
import { Box, Typography, Stack, Tooltip } from "@mui/material";
import {
  LocalFireDepartment,
  Shield,
  SportsBasketball,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { OpponentThreat, HaltAlert } from "../../utils/stats";
import { formatClock, formatClockWithTenths } from "../../utils/mathUtils";
import { pulse, slideBackAndForth } from "../../styles/animations";
import { TeamPanel } from "./TeamPanel";
import {
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
  WHISTLE_ACTION_TYPES,
} from "../../constants/stats";
import { StatEvent } from "../../db";
import { useTokens } from "../../theme/useTokens";

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
        timeoutsPerTeam?: number;
        teamFoulsToBonus?: number;
        teamFoulsToDoubleBonus?: number;
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
    possessionArrow?: "OUR_TEAM" | "OPPONENT";
    momentumAlerts: {
      opponentRun: string | null;
      teamRun: string | null;
      scoringDrought: string | null;
      opponentThreats: OpponentThreat[];
    };
    onCourtTeamFouls: { jersey: string; fouls: number }[];
    onCourtOppFouls: { jersey: string; fouls: number }[];
    recentStats?: StatEvent[];
  };
  haltAlerts?: HaltAlert[];
  period: number;
  periodLabel: string;
  maxPeriod: number;
  isReadOnly: boolean;
  clockSeconds: number;
  isClockRunning: boolean;
  onEditClock?: () => void;
  onScoreClick?: (_targetTeam: "TEAM" | "OPPONENT") => void;
  jerseyMap?: Map<string, string | undefined>;
  foulLimit?: number;
  isIntermission?: boolean;
  intermissionSeconds?: number;
  intermissionLabel?: "INTERMISSION" | "HALFTIME";
  isBuzzerActive?: boolean;
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
    onScoreClick,
    jerseyMap,
    foulLimit = 5,
    isIntermission = false,
    intermissionSeconds = 0,
    intermissionLabel = "INTERMISSION",
    isBuzzerActive = false,
  }: ScoreboardProps) => {
    const tokens = useTokens();
    const pType = team?.periodType || "QUARTERS";
    const bonusThreshold =
      team?.teamFoulsToBonus ?? BONUS_CONFIG[pType]?.single ?? 5;

    const lastRecentStat = gameData.recentStats?.[0];
    const isStoppedByWhistle =
      !isClockRunning &&
      lastRecentStat &&
      WHISTLE_ACTION_TYPES.has(lastRecentStat.type);

    const teamFtg = Math.max(
      0,
      bonusThreshold - gameData.teamFoulStats.teamFouls,
    );
    const oppFtg = Math.max(
      0,
      bonusThreshold - gameData.teamFoulStats.oppFouls,
    );

    const getFoulColor = (fCount: number) => {
      if (fCount >= bonusThreshold) {
        return tokens.semantic.color.feedback.error.main;
      }
      if (fCount === bonusThreshold - 1) {
        return tokens.semantic.color.feedback.warning.main;
      }
      return tokens.semantic.color.text.inverse;
    };

    const timeoutTotal =
      game?.timeoutLimit ??
      team?.timeoutsPerTeam ??
      team?.defaultTimeoutLimit ??
      3;
    const isWinningTime =
      clockSeconds < 60 && (period === maxPeriod || period > maxPeriod);

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
          background: tokens.semantic.component.scoreboard.background,
          borderRadius: `${tokens.semantic.shape.radius.xl}px`,
          p: `${tokens.semantic.spacing.lg}px`,
          mb: `${tokens.semantic.spacing.lg}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: tokens.semantic.component.scoreboard.shadow,
          border: tokens.semantic.component.scoreboard.border,
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
            background: `linear-gradient(90deg, ${tokens.semantic.color.brand.primary.main} 0%, ${tokens.semantic.color.brand.secondary.main} 100%)`,
            opacity: 0.8,
          }}
        />

        {/* PERIOD END BUZZER Overlay */}
        {(isBuzzerActive ||
          (clockSeconds === 0 && !isIntermission && !isReadOnly)) && (
          <Box
            role="alert"
            aria-live="assertive"
            data-testid="period-end-buzzer-overlay"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(45deg, rgba(211, 47, 47, 0.95) 0%, rgba(183, 28, 28, 0.95) 100%)",
              animation: `${pulse} 0.4s infinite ease-in-out`,
            }}
          >
            <Stack sx={{ alignItems: "center" }} spacing={1}>
              <SportsBasketball
                sx={{ fontSize: "3.5rem", color: "white" }}
                aria-hidden="true"
              />
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.inverse,
                  textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                PERIOD END
              </Typography>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: 2,
                }}
              >
                BUZZER
              </Typography>
            </Stack>
          </Box>
        )}

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
              <LocalFireDepartment
                sx={{ fontSize: "4rem", color: "white" }}
                aria-hidden="true"
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.inverse,
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  letterSpacing: 4,
                }}
              >
                KILL ACHIEVED
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: "rgba(255,255,255,0.8)",
                }}
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
                      ? tokens.semantic.color.feedback.error.main
                      : alert.severity === "warning"
                        ? tokens.semantic.color.feedback.warning.main
                        : tokens.semantic.color.feedback.info.main,
                  color:
                    alert.severity === "warning"
                      ? tokens.semantic.color.text.primary
                      : tokens.semantic.color.text.inverse,
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
                  sx={{
                    fontWeight: tokens.typography.fontWeight.black,
                    fontSize: "1.2rem",
                  }}
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
              ? `${team?.name || "Our team"} has possession`
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
            fouls={gameData.teamFoulStats.teamFouls}
            foulColor={getFoulColor(gameData.teamFoulStats.teamFouls)}
            bonusLabel={gameData.teamFoulStats.teamBonusLabel}
            isDouble={gameData.teamFoulStats.teamIsDouble}
            ftg={teamFtg}
            onCourtFouls={(gameData.onCourtTeamFouls || []).map((f) => ({
              jersey: jerseyMap?.get(f.jersey) || f.jersey,
              fouls: f.fouls,
            }))}
            foulLimit={foulLimit}
            isReadOnly={isReadOnly}
            onScoreClick={() => onScoreClick?.("TEAM")}
          />
          {gameData.possessionArrow === "OUR_TEAM" && (
            <Tooltip title="Possession Arrow">
              <ArrowBack
                sx={{
                  position: "absolute",
                  top: -25,
                  right: 0,
                  color: tokens.semantic.color.brand.primary.main,
                  fontSize: "1.5rem",
                  animation: `${pulse} 3s infinite ease-in-out`,
                }}
              />
            </Tooltip>
          )}
          {gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM && (
            <Tooltip title="Current Possession">
              <SportsBasketball
                sx={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  color: tokens.semantic.color.brand.primary.main,
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
                      bgcolor: tokens.semantic.color.feedback.warning.main,
                      color: tokens.semantic.color.text.primary,
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: tokens.typography.fontWeight.bold,
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    DROUGHT: {gameData.momentumAlerts.scoringDrought}
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
                      bgcolor: tokens.semantic.color.feedback.success.main,
                      color: tokens.semantic.color.text.inverse,
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: tokens.typography.fontWeight.bold,
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    TEAM RUN: {gameData.momentumAlerts.teamRun}
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
                      bgcolor: tokens.semantic.color.feedback.error.main,
                      color: tokens.semantic.color.text.inverse,
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: tokens.typography.fontWeight.bold,
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    RUN: {gameData.momentumAlerts.opponentRun}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: tokens.semantic.color.background.elevated,
                      color: tokens.semantic.color.feedback.error.main,
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.5rem",
                      fontWeight: tokens.typography.fontWeight.black,
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
                      bgcolor: tokens.semantic.color.feedback.warning.main,
                      color: tokens.semantic.color.text.primary,
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.55rem",
                      fontWeight: tokens.typography.fontWeight.black,
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
                        bgcolor: tokens.semantic.color.background.elevated,
                        color: tokens.semantic.color.feedback.warning.dark,
                        px: 1,
                        borderRadius: 1,
                        fontSize: "0.45rem",
                        fontWeight: tokens.typography.fontWeight.black,
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
              color: isIntermission
                ? tokens.semantic.color.feedback.warning.main
                : tokens.semantic.color.text.tertiary,
              fontWeight: tokens.typography.fontWeight.bold,
              fontSize: { xs: "0.7rem", sm: "1rem" },
              letterSpacing: 2,
              mb: 0.5,
            }}
          >
            {isIntermission
              ? intermissionLabel
              : period > maxPeriod
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
              aria-label={`Game clock: ${isWinningTime ? formatClockWithTenths(clockSeconds) : formatClock(clockSeconds)}, ${isClockRunning ? "Running" : "Paused"}, Period ${period}. ${isReadOnly ? "" : "Click to edit."}`}
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
                p: "4px 8px",
                borderRadius: `${tokens.semantic.shape.radius.sm}px`,
                border: isStoppedByWhistle
                  ? `1px solid ${tokens.semantic.color.feedback.warning.main}`
                  : "1px solid transparent",
                backgroundColor: isStoppedByWhistle
                  ? "rgba(255, 183, 77, 0.1)"
                  : "transparent",
                animation: isStoppedByWhistle
                  ? `${pulse} 2s infinite ease-in-out`
                  : "none",
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
                  color: isIntermission
                    ? tokens.semantic.color.feedback.warning.main
                    : isWinningTime
                      ? tokens.semantic.color.feedback.error.main
                      : tokens.semantic.color.text.inverse,
                  fontSize: { xs: "1.5rem", sm: "2.5rem" },
                  fontWeight: tokens.typography.fontWeight.bold,
                  fontFamily: tokens.typography.fontFamily.mono,
                  lineHeight: 1,
                  letterSpacing: 1,
                }}
              >
                {isIntermission
                  ? formatClock(intermissionSeconds)
                  : isWinningTime
                    ? formatClockWithTenths(clockSeconds)
                    : formatClock(clockSeconds)}
              </Typography>

              {isStoppedByWhistle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: tokens.semantic.color.feedback.warning.main,
                    fontWeight: 900,
                    fontSize: "0.55rem",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    mt: 0.5,
                  }}
                >
                  OFFICIAL STOP
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
                    background: `linear-gradient(90deg, transparent, ${tokens.semantic.color.brand.primary.main}, transparent)`,
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
                      color: tokens.semantic.color.brand.primary.main,
                      opacity: 0.8,
                    }}
                  />
                  <Typography
                    sx={{
                      color: tokens.semantic.color.text.inverse,
                      fontSize: "0.75rem",
                      fontWeight: tokens.typography.fontWeight.bold,
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
                      color: tokens.semantic.color.feedback.error.main,
                      animation:
                        gameData.defensiveStats.totalKills > 0
                          ? `${pulse} 2s infinite ease-in-out`
                          : "none",
                    }}
                  />
                  <Typography
                    sx={{
                      color: tokens.semantic.color.text.inverse,
                      fontSize: "0.85rem",
                      fontWeight: tokens.typography.fontWeight.black,
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
                          ? tokens.semantic.color.feedback.error.main
                          : tokens.semantic.color.action.disabledBackground,
                      boxShadow:
                        gameData.defensiveStats.currentStreak >= dot
                          ? `0 0 8px ${tokens.semantic.color.feedback.error.main}`
                          : "none",
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Opponent Team */}
        <Box
          sx={{ position: "relative" }}
          aria-live="polite"
          aria-label={
            gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
              ? `${game?.opponent || "Opponent"} has possession`
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
            fouls={gameData.teamFoulStats.oppFouls}
            foulColor={getFoulColor(gameData.teamFoulStats.oppFouls)}
            bonusLabel={gameData.teamFoulStats.oppBonusLabel}
            isDouble={gameData.teamFoulStats.oppIsDouble}
            ftg={oppFtg}
            onCourtFouls={gameData.onCourtOppFouls || []}
            foulLimit={foulLimit}
            isReadOnly={isReadOnly}
            onScoreClick={() => onScoreClick?.("OPPONENT")}
          />
          {gameData.possessionArrow === "OPPONENT" && (
            <Tooltip title="Possession Arrow">
              <ArrowForward
                sx={{
                  position: "absolute",
                  top: -25,
                  left: 0,
                  color: tokens.semantic.color.brand.secondary.main,
                  fontSize: "1.5rem",
                  animation: `${pulse} 3s infinite ease-in-out`,
                }}
              />
            </Tooltip>
          )}
          {gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT && (
            <Tooltip title="Current Possession">
              <SportsBasketball
                sx={{
                  position: "absolute",
                  top: -10,
                  left: -10,
                  color: tokens.semantic.color.brand.secondary.main,
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
