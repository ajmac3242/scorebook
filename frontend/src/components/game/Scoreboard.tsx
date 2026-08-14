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
  jerseyMap?: Map<string, string | undefined>;
  foulLimit?: number;
  isIntermission?: boolean;
  intermissionSeconds?: number;
  intermissionLabel?: "INTERMISSION" | "HALFTIME";
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
    jerseyMap,
    foulLimit = 5,
    isIntermission = false,
    intermissionSeconds = 0,
    intermissionLabel = "INTERMISSION",
  }: ScoreboardProps) => {
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
        return "var(--cs-semantic-color-feedback-error-main)";
      }
      if (fCount === bonusThreshold - 1) {
        return "var(--cs-semantic-color-feedback-warning-main)";
      }
      return "var(--cs-semantic-color-text-inverse)";
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
              <LocalFireDepartment
                sx={{ fontSize: "4rem", color: "white" }}
                aria-hidden="true"
              />
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
          />
          {gameData.possessionArrow === "OUR_TEAM" && (
            <Tooltip title="Possession Arrow">
              <ArrowBack
                sx={{
                  position: "absolute",
                  top: -25,
                  right: 0,
                  color: "var(--cs-semantic-color-brand-primary-main)",
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
                      bgcolor: "var(--cs-semantic-color-feedback-success-main)",
                      color: "var(--cs-semantic-color-text-inverse)",
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
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
                      bgcolor: "var(--cs-semantic-color-feedback-error-main)",
                      color: "var(--cs-semantic-color-text-inverse)",
                      px: 1,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                  >
                    RUN: {gameData.momentumAlerts.opponentRun}
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
              color: isIntermission
                ? "var(--cs-semantic-color-feedback-warning-main)"
                : "var(--cs-semantic-color-text-tertiary)",
              fontWeight: "var(--cs-typography-fontWeight-bold)",
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
                borderRadius: "var(--cs-semantic-shape-radius-sm)",
                border: isStoppedByWhistle
                  ? "1px solid var(--cs-semantic-color-feedback-warning-main)"
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
                    ? "var(--cs-semantic-color-feedback-warning-main)"
                    : isWinningTime
                    ? "var(--cs-semantic-color-feedback-error-main)"
                    : "var(--cs-semantic-color-text-inverse)",
                  fontSize: { xs: "1.5rem", sm: "2.5rem" },
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  fontFamily: "var(--cs-typography-fontFamily-mono)",
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
                    color: "var(--cs-semantic-color-feedback-warning-main)",
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
          />
          {gameData.possessionArrow === "OPPONENT" && (
            <Tooltip title="Possession Arrow">
              <ArrowForward
                sx={{
                  position: "absolute",
                  top: -25,
                  left: 0,
                  color: "var(--cs-semantic-color-brand-secondary-main)",
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
