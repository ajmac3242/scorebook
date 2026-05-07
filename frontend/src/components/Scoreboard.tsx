import React from "react";
import {
  Box,
  Typography,
  useTheme,
  Tooltip,
} from "@mui/material";
import { HaltAlert, OpponentThreat } from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { slideBackAndForth } from "../styles/animations";
import TeamPanel from "./TeamPanel";
import MomentumAlerts from "./MomentumAlerts";
import HaltAlertsOverlay from "./HaltAlertsOverlay";

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

        <HaltAlertsOverlay haltAlerts={haltAlerts} />

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
