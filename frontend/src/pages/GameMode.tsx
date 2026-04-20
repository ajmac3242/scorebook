/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Allows users to record statistical events (makes, misses, rebounds, etc.)
 * on an interactive court, manage active lineups, and track opponent scoring.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Chip,
  DialogContentText,
  Stack,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Tooltip,
  Snackbar,
  keyframes,
} from "@mui/material";

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

import {
  Undo as UndoIcon,
  History,
  Check,
  Close,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  FlashOn,
  Warning,
  ArrowBack,
  Groups,
  PlayArrow,
  Pause,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import TimeoutDots from "../components/TimeoutDots";
import RecentActionItem from "../components/RecentActionItem";
import QuickSubDialog from "../components/QuickSubDialog";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../components/HalftimeReportDialog";
import PlaybookEfficiencyWidget from "../components/PlaybookEfficiencyWidget";
import { PlayerStatRow } from "../components/PlayerStatRow";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
} from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculatePlayerStreaks,
  calculatePlayEfficiency,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  calculateLineupStats,
  isEventInPeriod,
  getBonusStatus,
  getInitials,
  type PlayerAggregates,
  OpponentThreat,
} from "../utils/stats";
import { formatClock, roundToOne } from "../utils/mathUtils";
import { MoleskineCard, AnimatedNumber } from "../components/SharedUI";

/**
 * 🏀 CoachBoard: detectShotValueFromCoords
 * Why: Automatically detects if a shot is a 2 or 3 based on court coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 */
const detectShotValueFromCoords = (x: number, y: number): number => {
  const svgX = x * 5; // 500 / 100
  const svgY = y * 4.7; // 470 / 100

  // Three Point Line logic from BasketballCourt.tsx:
  // - Sidebar lines: x=30 and x=470 from y=0 to y=140
  // - Arc: Center (250, 140) with radius 220 for y > 140

  if (svgY <= 140) {
    if (svgX <= 30 || svgX >= 470) return 3;
  } else {
    const dist = Math.sqrt(Math.pow(svgX - 250, 2) + Math.pow(svgY - 140, 2));
    if (dist >= 220) return 3;
  }

  return 2;
};

/**
 * Redesigned TV-style scoreboard header.
 */
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

const Scoreboard = React.memo(
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
      // Bonus logic:
      // If we are looking at Team A:
      // We show "BONUS" if Team B (Opponent) has committed enough fouls.
      // In gameData, teamBonusLabel is set if Opponent fouls >= threshold.

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
              )}
              {gameData.momentumAlerts.opponentThreats.map((t) => (
                <Typography
                  key={t.playerId}
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
                  THREAT: Opp #
                  {t.playerId.includes(":") ? t.playerId.split(":")[1] : "??"} (
                  {t.points} pts)
                </Typography>
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
            sx={{
              cursor: isReadOnly ? "default" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              "&:hover": {
                opacity: isReadOnly ? 1 : 0.8,
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

/**
 * 🏀 CoachBoard: Team Stats Card
 * Why: Centralizes team-level defensive metrics like Stops and Kills.
 */
const TeamStatsCard = React.memo(
  ({
    defensiveStats,
    teamPpp,
    oppPpp,
  }: {
    defensiveStats: {
      totalStops: number;
      totalKills: number;
      currentStreak: number;
    };
    teamPpp: string;
    oppPpp: string;
  }) => {
    return (
      <MoleskineCard>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Team Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1.5,
                bgcolor: "rgba(0,0,0,0.03)",
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 0.5,
                }}
              >
                STOPS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                <AnimatedNumber value={defensiveStats.totalStops} />
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1.5,
                bgcolor: "rgba(0,0,0,0.03)",
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 0.5,
                }}
              >
                KILLS
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#FF4500",
                  lineHeight: 1,
                  textShadow: "0 2px 4px rgba(255,69,0,0.2)",
                }}
              >
                <AnimatedNumber value={defensiveStats.totalKills} />
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 700 }}
              >
                TEAM PPP
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {teamPpp}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 700 }}
              >
                OPP PPP
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {oppPpp}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "text.secondary", mr: 1 }}
          >
            STREAK:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {[1, 2, 3].map((i) => (
              <FlashOn
                key={i}
                sx={{
                  fontSize: 22,
                  color:
                    i <= defensiveStats.currentStreak
                      ? "#FFD700"
                      : "rgba(0,0,0,0.1)",
                  filter:
                    i <= defensiveStats.currentStreak
                      ? "drop-shadow(0 0 4px #FFD700)"
                      : "none",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        </Box>
      </MoleskineCard>
    );
  },
);

/**
 * Interactive controls for game state management.
 */
interface ActionControlsProps {
  isReadOnly: boolean;
  onUndo: () => void;
  onQuickSub: () => void;
  onFtWorkflow: () => void;
  onAuditSubs: () => void;
  onTimeout: () => void;
  onNextPeriod: () => void;
  onTogglePossession: () => void;
  possessionState: string | null;
  recentStatsLength: number;
  onEndGame: () => void;
  isGameCompleted: boolean;
}

const ActionControls = React.memo(
  ({
    isReadOnly,
    onUndo,
    onQuickSub,
    onFtWorkflow,
    onAuditSubs,
    onTimeout,
    onNextPeriod,
    onTogglePossession,
    possessionState,
    recentStatsLength,
    onEndGame,
    isGameCompleted,
  }: ActionControlsProps) => {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Tooltip title="Change Period">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onNextPeriod}
              disabled={isReadOnly}
            >
              Period
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Toggle Possession">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={onTogglePossession}
              disabled={isReadOnly}
              aria-label="toggle possession"
              color={possessionState ? "primary" : "inherit"}
            >
              Poss
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Quick Substitution">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Groups />}
              onClick={onQuickSub}
              disabled={isReadOnly}
              aria-label="quick substitution"
            >
              Sub
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Audit Substitutions">
          <span>
            <IconButton
              size="small"
              onClick={() => onAuditSubs()}
              aria-label="audit substitutions"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
              }}
            >
              <History />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Record Team Timeout">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onTimeout}
              disabled={isReadOnly}
            >
              Timeout
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Record Free Throws">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SportsBasketball />}
              onClick={() => onFtWorkflow()}
              disabled={isReadOnly}
              aria-label="record free throws"
            >
              FT
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Undo last action (Ctrl+Z)">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={onUndo}
              disabled={recentStatsLength === 0 || isReadOnly}
            >
              Undo
            </Button>
          </span>
        </Tooltip>

        {!isGameCompleted && !isReadOnly && (
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={onEndGame}
          >
            End Game
          </Button>
        )}
      </Box>
    );
  },
);

/**
 * GameMode page component.
 * Manages the state for live game tracking, including selections,
 * dialogs for recording actions, and real-time score calculation.
 */
const GameMode: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract game and team IDs from URL parameters
  const gameId = searchParams.get("gameId");
  const teamId = searchParams.get("teamId");

  // Local state for recording individual actions
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);
  const [playName, setPlayName] = useState<string>("");
  const [shotQuality, setShotQuality] = useState<string | null>(null);

  const [clockSeconds, setClockSeconds] = useState<number>(0);
  const clockSecondsRef = useRef(clockSeconds);
  useEffect(() => {
    clockSecondsRef.current = clockSeconds;
  }, [clockSeconds]);
  const [isClockRunning, setIsClockRunning] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  }>({ key: "jerseyNumber", direction: "asc" });

  // Filter for displaying court markers
  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

  // State for editing and deleting actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  // Game lifecycle state
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false);
  const [isClockEditDialogOpen, setIsClockEditDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [ftWorkflowOpen, setFtWorkflowOpen] = useState(false);
  const [halftimeReportOpen, setHalftimeReportOpen] = useState(false);
  const [lastViewedHalftimePeriod, setLastViewedHalftimePeriod] =
    useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSavingStat, setIsSavingStat] = useState(false);
  const [chainPrompt, setChainPrompt] = useState<{
    type: "ASSIST" | "REBOUND";
    originalStat: StatEvent;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  // Derived data from StatEvents
  const gameStatsQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      return await db.stats.where("gameId").equals(gameId).toArray();
    } catch (err) {
      logger.error("Failed to fetch game stats:", err);
      return [];
    }
  }, [gameId]);
  const gameStats = useMemo(
    () => gameStatsQueryResult || [],
    [gameStatsQueryResult],
  );
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);

  // Quick sub draft state
  const [draftOnCourtIds, setDraftOnCourtIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);

  const [period, setPeriod] = useState<number>(1);
  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  // Fetch roster data for the current team
  const teamPlayersQueryResult = useLiveQuery(
    () =>
      teamId
        ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersQueryResult || [],
    [teamPlayersQueryResult],
  );

  const playersQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      if (!teamId) return [];
      const playerIds = teamPlayers.map((t) => t.playerId.toString());
      return await db.players.where("id").anyOf(playerIds).toArray();
    } catch (err) {
      logger.error("Failed to fetch players:", err);
      return [];
    }
  }, [teamId, teamPlayers]);
  const players = useMemo(() => playersQueryResult || [], [playersQueryResult]);

  /**
   * ⚡ Bolt: O(1) player name lookups.
   * Performance: Pre-calculating a Map of player names prevents O(P) .find()
   * operations inside the render loop of recent actions and dialogs.
   */
  const playerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.id) map.set(p.id.toString(), p.name);
    }
    return map;
  }, [players]);

  const game = useLiveQuery(() => db.games.get(gameId as string), [gameId]);
  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  // 🏀 CoachBoard: Persistent Period & Clock Tracking
  // Why: Ensures the game period and clock don't reset on page refresh.
  useEffect(() => {
    if (game?.currentPeriod && game.currentPeriod !== period) {
      setPeriod(game.currentPeriod);
    }
    if (game?.clockTime !== undefined && !isClockRunning) {
      setClockSeconds(game.clockTime);
    } else if (game?.clockTime === undefined && clockSeconds === 0) {
      // Default to periodLength if set, otherwise 10 mins (600s)
      setClockSeconds(game?.periodLength ? game.periodLength * 60 : 600);
    }
  }, [
    game?.currentPeriod,
    game?.clockTime,
    game?.periodLength,
    period,
    isClockRunning,
    clockSeconds,
  ]);

  // Clock Countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isClockRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        setClockSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (clockSeconds === 0) {
      setIsClockRunning(false);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, clockSeconds]);

  // ⚡ Bolt: Auto-sync clock to DB every 5 seconds if running.
  // Using a ref for clockSeconds prevents the interval from being re-created every second.
  useEffect(() => {
    if (isClockRunning && gameId) {
      const syncInterval = setInterval(async () => {
        await db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [isClockRunning, gameId]);

  const isReadOnly = !!game?.deletedAt || !!team?.deletedAt;
  const periodType = team?.periodType || "QUARTERS";
  const periodLabel = periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = periodType === "HALVES" ? 2 : 4;

  // Show summary dialog automatically if game is completed
  useEffect(() => {
    if (game?.completed && !summaryDialogOpen && !endGameDialogOpen) {
      setTimeout(() => setSummaryDialogOpen(true), 0);
    }
  }, [game?.completed, summaryDialogOpen, endGameDialogOpen]);

  // 🏀 CoachBoard: Halftime Tactical Adjustment Summary
  // Automatically trigger halftime report when the first half ends.
  useEffect(() => {
    const isEndOfFirstHalf =
      (periodType === "QUARTERS" && period === 3) ||
      (periodType === "HALVES" && period === 2);

    if (isEndOfFirstHalf && lastViewedHalftimePeriod < period) {
      setHalftimeReportOpen(true);
      setLastViewedHalftimePeriod(period);
    }
  }, [period, periodType, lastViewedHalftimePeriod]);

  // Periodic background sync during live tracking
  useEffect(() => {
    const interval = setInterval(() => {
      syncService.pushUpdates();
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  /**
   * ⚡ Bolt: Centralized sorting of game events.
   * Performance: Sorting once in a dedicated useMemo prevents redundant
   * O(N log N) operations across multiple statistical derivations.
   */
  const sortedGameStats = useMemo(() => {
    // ⚡ Bolt: Use direct comparison for ISO timestamps instead of localeCompare.
    // Relational operators (<, >) are significantly faster for string comparison in hot paths.
    return [...gameStats].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }, [gameStats]);

  /**
   * ⚡ Bolt: Consolidate statistical derivations.
   * Performance: Use the pre-sorted event stream for single-pass derivation of
   * scores, fouls, timeouts, possession, lineups, recent history, and opponent threats.
   * This O(N) loop is decoupled from high-frequency clock updates.
   */
  const eventAggregates = useMemo(() => {
    let curScore = 0;
    let oppScore = 0;
    let teamFouls = 0;
    let oppFouls = 0;
    let teamTimeouts = 0;
    let oppTimeouts = 0;
    let posState = null;
    const onCourt = new Set<string>();
    const stintStarts = new Map<string, number>();
    const onCourtPeriodFouls = new Map<string, number>();
    const pType = team?.periodType || "QUARTERS";
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    let lastLineupChangeClock = periodLen;
    let lastLineupChangeScoreTeam = 0;
    let lastLineupChangeScoreOpp = 0;
    let periodStartScoreTeam = 0;
    let periodStartScoreOpp = 0;

    // Possession tracking fields
    let teamFga = 0;
    let teamFta = 0;
    let teamTo = 0;
    let teamOreb = 0;
    let oppFga = 0;
    let oppFta = 0;
    let oppTo = 0;
    let oppOreb = 0;

    let lastTeamScoreClockTime = periodLen;
    let lastTeamScorePeriod = 1;
    let foundLastTeamScore = false;

    // Opponent Threats tracking
    const threats = new Map<string, OpponentThreat>();

    for (let i = 0; i < sortedGameStats.length; i++) {
      const s = sortedGameStats[i];
      if (s.deletedAt) continue;

      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      // Score tracking
      if (isOpp) {
        oppScore += s.points || 0;
        if (s.type === ACTION_TYPES.MAKE) {
          if (s.points === 1) oppFta++;
          else oppFga++;
        }
      } else {
        curScore += s.points || 0;
        if (s.type === ACTION_TYPES.MAKE) {
          lastTeamScoreClockTime = s.clockTime ?? periodLen;
          lastTeamScorePeriod = s.period;
          foundLastTeamScore = true;
          if (s.points === 1) teamFta++;
          else teamFga++;
        }
      }

      // Fouls (Period-aware)
      if (
        s.type === ACTION_TYPES.FOUL ||
        s.type === ACTION_TYPES.FOUL_SHOOTING ||
        s.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
        s.type === ACTION_TYPES.TECHNICAL_FOUL
      ) {
        if (isEventInPeriod(s.period, period, pType)) {
          if (isOpp) {
            oppFouls++;
          } else {
            teamFouls++;
            // ⚡ Bolt: Track individual fouls during the main loop to avoid O(P*N) filter later.
            if (onCourt.has(s.playerId)) {
              onCourtPeriodFouls.set(
                s.playerId,
                (onCourtPeriodFouls.get(s.playerId) || 0) + 1,
              );
            }
          }
        }
      }

      // Timeouts
      if (s.type === ACTION_TYPES.TIMEOUT) {
        if (isOpp) {
          oppTimeouts++;
        } else {
          teamTimeouts++;
        }
      }

      // Possession
      if (s.type === ACTION_TYPES.POSSESSION) {
        posState = s.playerId;
      }

      // Track other possession stats
      if (isOpp) {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) {
            oppFta++;
          } else {
            oppFga++;
            // Opponent Threat tracking for misses
            let t = threats.get(s.playerId);
            if (t) t.consecutiveMakes = 0;
          }
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          oppOreb++;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          oppTo++;
        } else if (s.type === ACTION_TYPES.MAKE && s.points && s.points > 1) {
          // Opponent Threat tracking for makes
          let t = threats.get(s.playerId);
          if (!t) {
            t = {
              playerId: s.playerId,
              points: 0,
              makes: 0,
              consecutiveMakes: 0,
              isHot: false,
            };
            threats.set(s.playerId, t);
          }
          t.points += s.points;
          t.makes++;
          t.consecutiveMakes++;
          if (t.points >= 8 || t.consecutiveMakes >= 3) {
            t.isHot = true;
          }
        }
      } else {
        if (s.type === ACTION_TYPES.MISS) {
          if (s.points === 1) teamFta++;
          else teamFga++;
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          teamOreb++;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          teamTo++;
        }
      }

      // Lineup and Substitution Tracking
      if (s.type === ACTION_TYPES.SUB_IN) {
        onCourt.add(s.playerId);
        if (s.period === period) {
          stintStarts.set(s.playerId, s.clockTime ?? periodLen);
          // ⚡ Bolt: Update lineup plus-minus baselines during the single pass.
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
        stintStarts.delete(s.playerId);
        if (s.period === period) {
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      }

      // ⚡ Bolt: Capture scores at the start of the current period context.
      if (s.period < period) {
        periodStartScoreTeam = curScore;
        periodStartScoreOpp = oppScore;
      }
    }

    // ⚡ Bolt: If no sub happened in the period, baseline is the period start.
    if (
      lastLineupChangeClock === periodLen &&
      lastLineupChangeScoreTeam === 0
    ) {
      lastLineupChangeScoreTeam = periodStartScoreTeam;
      lastLineupChangeScoreOpp = periodStartScoreOpp;
    }

    // For players already on court at start of period without a SUB_IN event this period
    onCourt.forEach((pId) => {
      if (!stintStarts.has(pId)) {
        stintStarts.set(pId, periodLen);
      }
    });

    const defensiveStats = calculateStopsAndKills(sortedGameStats);

    // 🏀 CoachBoard: Momentum Alerts Logic
    let opponentRunValue = null;

    // Run Detection (Look back at recent scoring events)
    let tempOppRunPoints = 0;
    let teamScoredSinceOppRunStarted = false;
    for (let i = sortedGameStats.length - 1; i >= 0; i--) {
      const s = sortedGameStats[i];
      if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;

      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      if (isOpp) {
        if (teamScoredSinceOppRunStarted) break;
        tempOppRunPoints += s.points || 0;
      } else {
        teamScoredSinceOppRunStarted = true;
        break;
      }
    }
    if (tempOppRunPoints >= 8) {
      opponentRunValue = `${tempOppRunPoints}-0`;
    }

    const MAX_TIMEOUTS = team?.fouls || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);

    const teamPoss = calculatePossessions(teamFga, teamFta, teamTo, teamOreb);
    const oppPoss = calculatePossessions(oppFga, oppFta, oppTo, oppOreb);

    return {
      currentScore: curScore,
      opponentScore: oppScore,
      teamPpp: calculatePpp(curScore, teamPoss),
      oppPpp: calculatePpp(oppScore, oppPoss),
      teamFoulStats: {
        teamFouls,
        oppFouls,
        teamBonusLabel: teamBonus.label,
        teamIsDouble: teamBonus.isDouble,
        teamBonusColor: teamBonus.color,
        oppBonusLabel: oppBonus.label,
        oppIsDouble: oppBonus.isDouble,
        oppBonusColor: oppBonus.color,
      },
      timeoutStats: {
        teamTOL: Math.max(0, MAX_TIMEOUTS - teamTimeouts),
        oppTOL: Math.max(0, MAX_TIMEOUTS - oppTimeouts),
      },
      possessionState: posState,
      onCourtIds: onCourt,
      stintStarts,
      defensiveStats,
      momentumAlerts: {
        opponentRun: opponentRunValue,
        opponentThreats: Array.from(threats.values()).filter((t) => t.isHot),
      },
      onCourtPeriodFouls,
      lastLineupChangeClock,
      lastLineupChangeScoreTeam,
      lastLineupChangeScoreOpp,
      lastTeamScoreClockTime,
      lastTeamScorePeriod,
      foundLastTeamScore,
      // ⚡ Bolt: Pre-filter and memoize only the last 10 active stats to reduce render-time processing.
      recentStats: sortedGameStats
        .filter((s) => !s.deletedAt)
        .slice(-10)
        .reverse(),
    };
  }, [
    sortedGameStats,
    period,
    team?.periodType,
    team?.fouls,
    game?.periodLength,
  ]);

  /**
   * ⚡ Bolt: Lightweight live status updates.
   * Performance: This O(1) memoization handles values that change every second
   * (like the clock) to avoid reprocessing the entire O(N) event stream.
   */
  const gameData = useMemo(() => {
    const stintDurations = new Map<string, number>();
    eventAggregates.stintStarts.forEach((startClock, pId) => {
      stintDurations.set(pId, Math.max(0, startClock - clockSeconds));
    });

    // 🏀 CoachBoard: Decoupled Drought Detection
    let scoringDrought = null;
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    if (eventAggregates.foundLastTeamScore) {
      let droughtSecs = 0;
      if (eventAggregates.lastTeamScorePeriod === period) {
        droughtSecs = eventAggregates.lastTeamScoreClockTime - clockSeconds;
      } else if (eventAggregates.lastTeamScorePeriod < period) {
        droughtSecs =
          eventAggregates.lastTeamScoreClockTime +
          (period - eventAggregates.lastTeamScorePeriod - 1) * periodLen +
          (periodLen - clockSeconds);
      }
      if (droughtSecs >= 180) {
        scoringDrought = `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
      }
    } else {
      const elapsedGameSecs =
        (period - 1) * periodLen + (periodLen - clockSeconds);
      if (elapsedGameSecs >= 180) {
        scoringDrought = `${Math.floor(elapsedGameSecs / 60)}m ${Math.floor(elapsedGameSecs % 60)}s`;
      }
    }

    return {
      ...eventAggregates,
      stintDurations,
      currentLineupPlusMinus:
        eventAggregates.currentScore -
        eventAggregates.opponentScore -
        (eventAggregates.lastLineupChangeScoreTeam -
          eventAggregates.lastLineupChangeScoreOpp),
      currentLineupStintDuration: Math.max(
        0,
        eventAggregates.lastLineupChangeClock - clockSeconds,
      ),
      momentumAlerts: {
        ...eventAggregates.momentumAlerts,
        scoringDrought,
      },
    };
  }, [eventAggregates, clockSeconds, period, game?.periodLength]);

  // Initialize draft state when dialog opens
  useEffect(() => {
    if (subDialogOpen) {
      setDraftOnCourtIds(new Set(gameData.onCourtIds));
      setSelectedSwapId(subOutPlayerId);
    }
  }, [subDialogOpen, gameData.onCourtIds, subOutPlayerId]);

  const jerseyMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
    }
    return map;
  }, [teamPlayers]);

  const statsGridDataRaw = useMemo(() => {
    return calculatePlayerAggregates(
      players,
      sortedGameStats,
      teamPlayers,
      "total",
      {
        isSorted: true,
        periodLength: game?.periodLength,
        // ⚡ Bolt: Lightweight clock update decoupling.
        // Assume player played until end of game for initial aggregation.
        // Live adjustment for active players is done in statsGridData.
        liveContext: { clockTime: 0, period },
      },
    );
  }, [players, sortedGameStats, teamPlayers, game?.periodLength, period]);

  /**
   * ⚡ Bolt: Live adjustment for stats grid.
   * Performance: Only adjusts the MIN and plus-minus for active players based
   * on the current clock, avoiding a full O(N) re-calculation.
   */
  const statsGridData = useMemo(() => {
    return statsGridDataRaw.map((p) => {
      if (!gameData.onCourtIds.has(p.id.toString())) return p;
      const startClock = gameData.stintStarts.get(p.id.toString()) ?? 0;
      const currentStintSecs = Math.max(0, startClock - clockSeconds);
      // calculatePlayerAggregates already added time until 0:00 (endClock: 0)
      // So we subtract the time that hasn't happened yet in the current stint.
      return {
        ...p,
        min: roundToOne(p.min - startClock / 60 + currentStintSecs / 60),
      };
    });
  }, [
    statsGridDataRaw,
    gameData.onCourtIds,
    gameData.stintStarts,
    clockSeconds,
  ]);

  const sortedStatsGridData = useMemo(() => {
    return [...statsGridData].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      // Handle strings (name, jerseyNumber)
      if (typeof valA === "string" && typeof valB === "string") {
        // ⚡ Bolt: Use direct comparison instead of localeCompare for better performance in UI sorting.
        if (direction === "asc") {
          if (valA < valB) return -1;
          if (valA > valB) return 1;
          return 0;
        } else {
          if (valB < valA) return -1;
          if (valB > valA) return 1;
          return 0;
        }
      }

      // Handle numbers
      valA = (valA as number) || 0;
      valB = (valB as number) || 0;
      return direction === "asc" ? valA - valB : valB - valA;
    });
  }, [statsGridData, sortConfig]);

  const statsMap = useMemo(() => {
    const map = new Map<string, PlayerAggregates>();
    for (let i = 0; i < statsGridData.length; i++) {
      map.set(statsGridData[i].id.toString(), statsGridData[i]);
    }
    return map;
  }, [statsGridData]);

  // 🏀 CoachBoard: Halftime Lineup Stats
  const halftimeLineupStats = useMemo(() => {
    if (!halftimeReportOpen) return [];

    // Filter stats for the first half
    const firstHalfStats = sortedGameStats.filter((s) => {
      if (periodType === "QUARTERS") return s.period <= 2;
      return s.period <= 1;
    });

    return calculateLineupStats(firstHalfStats, {
      isSorted: true,
      periodLength: game?.periodLength,
    });
  }, [halftimeReportOpen, sortedGameStats, periodType, game?.periodLength]);

  // 🏀 CoachBoard: Hot/Cold Streaks
  // Why: Provides immediate coaching visibility into recent player performance trends.
  const playerStreaks = useMemo(() => {
    // ⚡ Bolt: Pass the pre-sorted event stream to avoid redundant sorting within the utility.
    return calculatePlayerStreaks(sortedGameStats, { isSorted: true });
  }, [sortedGameStats]);

  // 🏀 CoachBoard: Playbook Efficiency
  const playbookEfficiency = useMemo(() => {
    return calculatePlayEfficiency(sortedGameStats);
  }, [sortedGameStats]);

  /**
   * ⚡ Bolt: Optimize marker generation.
   * Performance: Single-pass marker creation using a local array to avoid multiple filter/map
   * passes. Uses direct property access and cached theme colors to reduce overhead.
   */
  const markers = useMemo(() => {
    const res = [];
    const oppColor = theme.palette.secondary.main;
    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (s.deletedAt) continue;

      const type = s.type;
      // Skip non-visual events
      if (
        type === ACTION_TYPES.SUB_IN ||
        type === ACTION_TYPES.SUB_OUT ||
        type === ACTION_TYPES.POSSESSION ||
        type === ACTION_TYPES.TIMEOUT
      )
        continue;

      // Filter by selection
      if (
        markerFilter !== "ALL" &&
        type !== markerFilter &&
        !(
          markerFilter === "REBOUND" &&
          (type === ACTION_TYPES.OFF_REBOUND ||
            type === ACTION_TYPES.DEF_REBOUND)
        )
      )
        continue;

      const pId = s.playerId;
      const isOpp =
        pId === SPECIAL_PLAYER_IDS.OPPONENT ||
        pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      res.push({
        id: s.id,
        x: s.locationX || 0,
        y: s.locationY || 0,
        type: type,
        label: !isOpp ? (jerseyMap.get(pId) ?? "") : undefined,
        color: isOpp ? oppColor : undefined,
      });
    }
    return res;
  }, [gameStats, markerFilter, jerseyMap, theme.palette.secondary.main]);

  /**
   * Undoes the most recent statistical action.
   */
  const handleUndo = useCallback(async () => {
    if (gameData.recentStats.length === 0) return;
    const lastStat = gameData.recentStats[0];
    if (lastStat.id) {
      try {
        await db.open();
        await db.stats.update(lastStat.id, {
          deletedAt: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        setSnackbar({
          open: true,
          message: "Action undone",
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to undo stat:", err);
        setSnackbar({
          open: true,
          message: "Failed to undo action",
          severity: "error",
        });
      }
    }
  }, [gameData.recentStats]);

  // 🧠 Clarity: Keyboard shortcut for Undo (Ctrl+Z or Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  /**
   * Finalizes the game, marking it as completed and triggering a sync.
   */
  const handleEndGame = useCallback(async () => {
    setIsEnding(true);
    try {
      await db.open();
      await db.games.update(gameId as string, { completed: 1, synced: 0 });
      await syncService.pushUpdates();
      setEndGameDialogOpen(false);
      setSummaryDialogOpen(true);
      setSnackbar({
        open: true,
        message: "Game finalized successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to end game:", err);
      setSnackbar({
        open: true,
        message: "Failed to finalize game",
        severity: "error",
      });
    } finally {
      setIsEnding(false);
    }
  }, [gameId]);

  /**
   * Handles a click on the court to start recording an action.
   * @param {number} x - The X coordinate on the court.
   * @param {number} y - The Y coordinate on the court.
   */
  const handleCourtClick = useCallback(
    (x: number, y: number) => {
      if (isReadOnly) return;
      setSelectedX(x);
      setSelectedY(y);
      // 🏀 CoachBoard: Dynamic Points Initialization
      // Why: Sets the default point value (2 or 3) based on where the court was clicked.
      setPoints(detectShotValueFromCoords(x, y));

      // Auto-select opponent if in opponent tracking mode
      if (trackingMode === "OPPONENT") {
        setSelectedPlayerId(SPECIAL_PLAYER_IDS.OPPONENT);
      } else {
        setSelectedPlayerId(null);
      }
      setDialogOpen(true);
    },
    [isReadOnly, trackingMode],
  );

  /**
   * Saves a new or edited statistical event to IndexedDB.
   * @param {string} currentType - (Optional) Overrides the stat type.
   */
  const handleSaveStat = useCallback(
    async (currentType?: string) => {
      const typeToSave = currentType || statType;
      if (!selectedPlayerId || !typeToSave) return;

      setIsSavingStat(true);
      try {
        if (!gameId) {
          setIsSavingStat(false);
          return;
        }
        await db.open();
        if (isEditing && editingStatId) {
          await db.stats.update(editingStatId, {
            playerId: selectedPlayerId!,
            type: typeToSave,
            points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
            playName:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? playName
                : undefined,
            shotQuality:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? (shotQuality ?? undefined)
                : undefined,
            synced: 0,
          });
          await syncService.pushUpdates();
        } else {
          const newStat: StatEvent = {
            id: crypto.randomUUID(),
            gameId: gameId,
            playerId: selectedPlayerId!,
            type: typeToSave,
            points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
            locationX: selectedX || 0,
            locationY: selectedY || 0,
            playName:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? playName
                : undefined,
            shotQuality:
              typeToSave === ACTION_TYPES.MAKE ||
              typeToSave === ACTION_TYPES.MISS
                ? (shotQuality ?? undefined)
                : undefined,
            period,
            clockTime: clockSeconds,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          await db.stats.add(newStat);
          await syncService.pushUpdates();

          // 🏀 CoachBoard: Intelligent Linked Event Chaining
          // Trigger follow-up prompts for "Our Team" makes and misses
          if (
            trackingMode === "TEAM" &&
            !selectedPlayerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
          ) {
            if (typeToSave === ACTION_TYPES.MAKE && points > 1) {
              setChainPrompt({ type: "ASSIST", originalStat: newStat });
            } else if (typeToSave === ACTION_TYPES.MISS) {
              setChainPrompt({ type: "REBOUND", originalStat: newStat });
            }
          }

          if (typeToSave === ACTION_TYPES.FOUL_SHOOTING) {
            setFtWorkflowOpen(true);
          }
        }
        setSnackbar({
          open: true,
          message: isEditing ? "Action updated" : "Action recorded",
          severity: "success",
        });
        // Reset state after save
        setDialogOpen(false);
        setStatType(null);
        setPlayName("");
        setIsEditing(false);
        setEditingStatId(null);
        if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
      } catch (err) {
        logger.error("Failed to save stat:", err);
        setSnackbar({
          open: true,
          message: "Failed to save action",
          severity: "error",
        });
      } finally {
        setIsSavingStat(false);
      }
    },
    [
      statType,
      selectedPlayerId,
      gameId,
      isEditing,
      editingStatId,
      points,
      playName,
      selectedX,
      selectedY,
      period,
      trackingMode,
      clockSeconds,
      shotQuality,
    ],
  );

  /**
   * 🏀 CoachBoard: handleQuickSub
   * Why: Allows scorekeepers to swap players in/out in one action during live play.
   * Notes: Records both SUB_OUT and SUB_IN events to maintain accurate play-by-play.
   */
  /**
   * 🏀 CoachBoard: handleSwapClick
   * Why: Implements visual-only swapping in the Quick Sub dialog.
   */
  const handleSwapClick = useCallback(
    (id: string) => {
      // Early return for deselect or initial select
      if (!selectedSwapId || selectedSwapId === id) {
        setSelectedSwapId(selectedSwapId === id ? null : id);
        return;
      }

      const isAOnCourt =
        draftOnCourtIds.has(selectedSwapId) ||
        selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");

      // Update selection if both in same group (bench/court), otherwise perform swap
      if (isAOnCourt === isBOnCourt) {
        setSelectedSwapId(id);
        return;
      }

      setDraftOnCourtIds((prev) => {
        const next = new Set(prev);
        const [onCourt, bench] = isAOnCourt
          ? [selectedSwapId, id]
          : [id, selectedSwapId];

        if (!onCourt.startsWith("EMPTY")) next.delete(onCourt);
        if (!bench.startsWith("EMPTY")) next.add(bench);
        return next;
      });
      setSelectedSwapId(null);
    },
    [selectedSwapId, draftOnCourtIds],
  );

  const handleQuickSub = useCallback(async () => {
    if (!gameId || isReadOnly) return;

    try {
      await db.open();
      const timestamp = new Date().toISOString();

      const originalOnCourt = gameData.onCourtIds;
      const finalOnCourt = draftOnCourtIds;

      // Players who were on court but are no longer in the draft lineup
      const toSubOut = Array.from(originalOnCourt).filter(
        (id) => !finalOnCourt.has(id),
      );
      // Players who were NOT on court but are now in the draft lineup
      const toSubIn = Array.from(finalOnCourt).filter(
        (id) => !originalOnCourt.has(id) && !id.startsWith("EMPTY"),
      );

      // Record SUB_OUT events
      for (const pId of toSubOut) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_OUT,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }

      // Record SUB_IN events
      for (const pId of toSubIn) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_IN,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }

      setSubDialogOpen(false);
      await syncService.pushUpdates();
      setSnackbar({
        open: true,
        message: "Substitution recorded",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to record quick sub:", err);
      setSnackbar({
        open: true,
        message: "Failed to record substitution",
        severity: "error",
      });
    }
  }, [
    gameId,
    isReadOnly,
    gameData.onCourtIds,
    draftOnCourtIds,
    period,
    clockSeconds,
  ]);

  /**
   * Deletes a specific statistical event.
   */
  const handleDeleteStat = useCallback(async () => {
    if (!statToDelete) return;
    setIsDeleting(true);
    try {
      await db.open();
      await db.stats.update(statToDelete, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
      setStatToDelete(null);
      setSnackbar({
        open: true,
        message: "Action deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to delete stat:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete action",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [statToDelete]);

  /**
   * Populates the dialog state with an existing stat for editing.
   * @param {StatEvent} stat - The stat event to edit.
   */
  const openEditDialog = useCallback(
    (stat: StatEvent) => {
      if (isReadOnly) return;
      setEditingStatId(stat.id ?? null);
      setSelectedPlayerId(stat.playerId as string);
      setStatType(stat.type);
      setPoints(stat.points || 2);
      setPlayName(stat.playName || "");
      setShotQuality(stat.shotQuality || null);
      setSelectedX(stat.locationX || 0);
      setSelectedY(stat.locationY || 0);
      setIsEditing(true);
      setDialogOpen(true);
    },
    [isReadOnly],
  );

  /**
   * Reusable component for quick-action buttons in the recording dialog.
   * @param root0
   * @param root0.type
   * @param root0.label
   * @param root0.icon
   */

  // Ensure required parameters are present, otherwise redirect
  useEffect(() => {
    if (!gameId || !teamId) {
      navigate("/");
    }
  }, [gameId, teamId, navigate]);

  const handleToggleClock = useCallback(() => {
    setIsClockRunning((prev) => {
      const next = !prev;
      if (gameId) {
        db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }
      return next;
    });
  }, [gameId]);

  const handleEditClock = useCallback(
    async (mins: number, secs: number) => {
      const totalSeconds = mins * 60 + secs;
      setClockSeconds(totalSeconds);
      if (gameId) {
        try {
          await db.open();
          await db.games.update(gameId, {
            clockTime: totalSeconds,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
      setIsClockEditDialogOpen(false);
    },
    [gameId],
  );

  const handleNextPeriod = useCallback(async () => {
    const nextPeriod = period < 10 ? period + 1 : 1;
    setPeriod(nextPeriod);

    // Reset clock for next period
    const defaultMins = periodType === "QUARTERS" ? 10 : 20;
    const nextSeconds = defaultMins * 60;
    setClockSeconds(nextSeconds);
    setIsClockRunning(false);

    if (gameId) {
      try {
        await db.open();
        await db.games.update(gameId, {
          currentPeriod: nextPeriod,
          clockTime: nextSeconds,
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to update game period:", err);
      }
    }
  }, [gameId, period, periodType]);

  /**
   * 🏀 CoachBoard: handleTimeout
   * Why: Quick recording of a timeout for the current team.
   * Notes: Records a TIMEOUT event tied to either Our Team or Opponent.
   */
  const handleTimeout = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    try {
      await db.open();
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId:
          trackingMode === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        type: ACTION_TYPES.TIMEOUT,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record timeout:", err);
    }
  }, [gameId, isReadOnly, trackingMode, period, clockSeconds]);

  const handleAuditSubs = useCallback(() => {
    setAuditDialogOpen(true);
  }, []);

  /**
   * 🏀 CoachBoard: handleTogglePossession
   * Why: Quick toggle for the possession arrow.
   * Notes: Records a POSSESSION event for the specified team.
   */

  const handleTogglePossession = useCallback(async () => {
    if (!gameId || isReadOnly) return;

    // Toggle between OUR_TEAM and OPPONENT. Default to OUR_TEAM if no possession set.
    const targetTeam =
      gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
        ? SPECIAL_PLAYER_IDS.OPPONENT
        : SPECIAL_PLAYER_IDS.OUR_TEAM;

    try {
      await db.open();
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId: gameId,
        playerId: targetTeam,
        type: ACTION_TYPES.POSSESSION,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle possession:", err);
    }
  }, [gameId, isReadOnly, period, gameData.possessionState, clockSeconds]);

  /**
   * 🏀 CoachBoard: handleChainAction
   * Records a linked event (Assist or Rebound) tied to a previous shot.
   */
  const handleChainAction = useCallback(
    async (pId: string, type: string) => {
      if (!chainPrompt || !gameId) return;
      const { originalStat } = chainPrompt;

      try {
        await db.open();
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId: pId,
          type,
          period: originalStat.period,
          clockTime: originalStat.clockTime,
          timestamp: originalStat.timestamp, // Share exact metadata
          synced: 0,
        });
        await syncService.pushUpdates();
        setChainPrompt(null);
        setSnackbar({
          open: true,
          message: `${type} recorded`,
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to save chained stat:", err);
      }
    },
    [chainPrompt, gameId],
  );

  if (!gameId || !teamId) {
    return null;
  }

  return (
    <Box sx={{ pb: 4, opacity: isReadOnly ? 0.7 : 1 }}>
      {isReadOnly && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          This game is in read-only mode because it or its parent is pending
          deletion.
        </Alert>
      )}
      <Grid container spacing={3}>
        {/* Main Content Area: Scoreboard and Court */}
        <Grid item xs={12} md={8}>
          <Scoreboard
            game={game}
            team={team}
            gameData={gameData}
            period={period}
            periodLabel={periodLabel}
            maxPeriod={maxPeriod}
            isReadOnly={isReadOnly}
            clockSeconds={clockSeconds}
            isClockRunning={isClockRunning}
            onEditClock={() => {
              if (!isReadOnly) {
                setIsClockEditDialogOpen(true);
              }
            }}
          />

          <MoleskineCard
            sx={{
              border:
                trackingMode === "OPPONENT"
                  ? `2px solid ${theme.palette.secondary.main}`
                  : "1px solid rgba(0,0,0,0.12)",
              transition: "border 0.3s ease",
            }}
          >
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <ActionControls
                isReadOnly={isReadOnly}
                onUndo={handleUndo}
                onQuickSub={() => setSubDialogOpen(true)}
                onFtWorkflow={() => {
                  if (selectedPlayerId) {
                    setFtWorkflowOpen(true);
                  } else {
                    setSnackbar({
                      open: true,
                      message: "Select a player first",
                      severity: "warning",
                    });
                  }
                }}
                onAuditSubs={handleAuditSubs}
                onTimeout={handleTimeout}
                onNextPeriod={handleNextPeriod}
                onTogglePossession={() => handleTogglePossession()}
                possessionState={gameData.possessionState}
                recentStatsLength={gameData.recentStats.length}
                onEndGame={() => setEndGameDialogOpen(true)}
                isGameCompleted={!!game?.completed}
              />

              <ToggleButtonGroup
                value={trackingMode}
                exclusive
                aria-label="Tracking Mode"
                onChange={(_, val) => val && setTrackingMode(val)}
                size="small"
                disabled={isReadOnly}
                fullWidth={theme.breakpoints.down("sm") !== null}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <ToggleButton value="TEAM">
                  {team?.name || "Our Team"}
                </ToggleButton>
                <ToggleButton value="OPPONENT">
                  {game?.opponent || "Opponent"}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                mb: 2,
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Markers filtering chips */}
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  overflowX: "auto",
                  pb: 1,
                  width: { xs: "100%", sm: "auto" },
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {[
                  "ALL",
                  "MAKE",
                  "MISS",
                  "REBOUND",
                  "ASSIST",
                  "STEAL",
                  "BLOCK",
                ].map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => setMarkerFilter(type)}
                    variant={markerFilter === type ? "filled" : "outlined"}
                    size="small"
                    color={markerFilter === type ? "primary" : "default"}
                  />
                ))}
              </Box>
            </Box>

            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={markers}
            />
          </MoleskineCard>
        </Grid>

        {/* Panel: Roster and Recent Actions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <TeamStatsCard
              defensiveStats={gameData.defensiveStats}
              teamPpp={gameData.teamPpp}
              oppPpp={gameData.oppPpp}
            />

            {trackingMode === "TEAM" && (
              <PlaybookEfficiencyWidget
                plays={playbookEfficiency}
                teamPpp={parseFloat(gameData.teamPpp)}
                gameStats={sortedGameStats}
              />
            )}

            {trackingMode === "TEAM" ? (
              <>
                <MoleskineCard>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Live Lineup
                    </Typography>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          fontWeight: 800,
                          color:
                            gameData.currentLineupPlusMinus >= 0
                              ? "success.main"
                              : "error.main",
                          lineHeight: 1,
                        }}
                      >
                        {gameData.currentLineupPlusMinus >= 0 ? "+" : ""}
                        {gameData.currentLineupPlusMinus} since sub
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.6rem", opacity: 0.7 }}
                      >
                        {formatClock(gameData.currentLineupStintDuration)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 1,
                    }}
                  >
                    {/* 🏀 CoachBoard: Display exactly 5 slots in Live Lineup for rotation visibility */}
                    {players
                      .filter((p) => gameData.onCourtIds.has(p.id!))
                      .map((p) => {
                        const s = statsMap.get(p.id!);
                        const streak = playerStreaks.get(p.id!);
                        const pts = s?.points || 0;
                        const pf = s?.fouls || 0;
                        const foulLimit =
                          game?.foulLimit || team?.defaultFoulLimit || 5;
                        const isFoulTrouble = pf === foulLimit - 1;
                        const isFouledOut = pf >= foulLimit;
                        const stintSecs =
                          gameData.stintDurations.get(p.id!) || 0;

                        const curPeriodKey = `P${period}`;
                        const periodFoulLimit =
                          team?.foulWarningThresholds?.[curPeriodKey] || 99;
                        const pfSincePeriodStart =
                          gameData.onCourtPeriodFouls.get(p.id!) || 0;

                        const isFoulTroubleInPeriod =
                          pfSincePeriodStart >= periodFoulLimit;

                        return (
                          <Box
                            key={p.id}
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              alignItems: "center",
                            }}
                          >
                            <Button
                              fullWidth
                              disabled={isReadOnly}
                              variant="contained"
                              onClick={() => {
                                setSubOutPlayerId(p.id!);
                                setSubDialogOpen(true);
                              }}
                              sx={{
                                justifyContent: "flex-start",
                                px: 1,
                                bgcolor: isFouledOut
                                  ? "error.main"
                                  : isFoulTrouble || isFoulTroubleInPeriod
                                    ? "warning.main"
                                    : "primary.main",
                                color: "white",
                                borderWidth: "1.5px",
                                animation:
                                  isFoulTrouble ||
                                  isFouledOut ||
                                  isFoulTroubleInPeriod
                                    ? `${pulse} 2s infinite ease-in-out`
                                    : "none",
                                "&.Mui-disabled": {
                                  bgcolor: isFouledOut
                                    ? "error.main"
                                    : isFoulTrouble
                                      ? "warning.main"
                                      : "primary.main",
                                  color: "white",
                                },
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  fontSize: "0.65rem",
                                  mr: 0.5,
                                  bgcolor: p.avatarColor || "grey.500",
                                }}
                              >
                                {jerseyMap.get(p.id!) ?? ""}
                              </Avatar>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  overflow: "hidden",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontSize: "0.65rem",
                                    lineHeight: 1.1,
                                  }}
                                >
                                  {p.name}
                                  {stintSecs >
                                    (team?.maxStintDuration || 8) * 60 && (
                                    <Tooltip
                                      title={`Fatigue Alert: Exceeded ${team?.maxStintDuration || 8} mins`}
                                    >
                                      <Box
                                        component="span"
                                        sx={{ ml: 0.5, fontSize: "0.8rem" }}
                                      >
                                        ⚠️
                                      </Box>
                                    </Tooltip>
                                  )}
                                  {streak === "HOT" && (
                                    <Tooltip title="Hot Streak (3+ makes)">
                                      <Box
                                        component="span"
                                        sx={{ ml: 0.5, fontSize: "0.8rem" }}
                                      >
                                        🔥
                                      </Box>
                                    </Tooltip>
                                  )}
                                  {streak === "COLD" && (
                                    <Tooltip title="Cold Streak (3+ misses)">
                                      <Box
                                        component="span"
                                        sx={{ ml: 0.5, fontSize: "0.8rem" }}
                                      >
                                        ❄️
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.6rem", opacity: 0.9 }}
                                >
                                  {pts} pts |
                                  {(() => {
                                    const stintSecs =
                                      gameData.stintDurations.get(p.id!) || 0;
                                    const maxStint =
                                      (team?.maxStintDuration || 8) * 60;
                                    const color =
                                      stintSecs > maxStint
                                        ? theme.palette.error.main
                                        : stintSecs > maxStint * 0.75
                                          ? theme.palette.warning.main
                                          : "inherit";
                                    return (
                                      <Box
                                        component="span"
                                        sx={{
                                          color,
                                          fontWeight:
                                            stintSecs > 360 ? 700 : 400,
                                          ml: 0.5,
                                        }}
                                      >
                                        T-MIN: {formatClock(stintSecs)} |
                                      </Box>
                                    );
                                  })()}
                                  <Box
                                    component="span"
                                    sx={{
                                      ml: 0.5,
                                      px: 0.5,
                                      borderRadius: 0.5,
                                      bgcolor: isFouledOut
                                        ? "#d32f2f"
                                        : isFoulTrouble || isFoulTroubleInPeriod
                                          ? "#ed6c02"
                                          : "transparent",
                                      fontWeight:
                                        isFouledOut ||
                                        isFoulTrouble ||
                                        isFoulTroubleInPeriod
                                          ? 900
                                          : 400,
                                      border:
                                        isFouledOut ||
                                        isFoulTrouble ||
                                        isFoulTroubleInPeriod
                                          ? "1px solid white"
                                          : "none",
                                    }}
                                  >
                                    {pf} foul{pf !== 1 ? "s" : ""}
                                    {isFoulTroubleInPeriod &&
                                      !isFouledOut &&
                                      !isFoulTrouble &&
                                      ` (P${period})`}
                                  </Box>
                                  {isFouledOut && " - OUT"}
                                </Typography>
                              </Box>
                            </Button>
                          </Box>
                        );
                      })}
                    {/* Placeholder "Empty" slots to reach 5 total */}
                    {Array.from({
                      length: Math.max(0, 5 - gameData.onCourtIds.size),
                    }).map((_, i) => {
                      const emptyId = `EMPTY-${i}`;
                      return (
                        <Button
                          key={emptyId}
                          variant="outlined"
                          disabled={isReadOnly}
                          aria-label={`Empty lineup slot ${i + 1}, click to assign player`}
                          onClick={() => {
                            setSubOutPlayerId(emptyId);
                            setSubDialogOpen(true);
                          }}
                          fullWidth
                          sx={{
                            justifyContent: "flex-start",
                            borderStyle: "dashed",
                            color: "text.secondary",
                            px: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: "0.65rem",
                              mr: 0.5,
                              bgcolor: "transparent",
                              border: "1px dashed #bdbdbd",
                              color: "#bdbdbd",
                            }}
                          >
                            ?
                          </Avatar>
                          <Typography variant="caption">
                            Assign Player
                          </Typography>
                        </Button>
                      );
                    })}
                  </Box>
                </MoleskineCard>

                <MoleskineCard sx={{ p: 0, overflow: "hidden" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, p: 2, pb: 1 }}
                  >
                    Player Stats
                  </Typography>
                  <TableContainer component={Box}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                          {(
                            [
                              { key: "jerseyNumber", label: "PLAYER", px: 1 },
                              { key: "min", label: "MIN" },
                              { key: "points", label: "PTS" },
                              { key: "threePM", label: "3PM" },
                              { key: "threePA", label: "3PA" },
                              { key: "threePPct", label: "3P%" },
                              { key: "ftm", label: "FTM" },
                              { key: "fta", label: "FTA" },
                              { key: "ftPct", label: "FT%" },
                              { key: "rebounds", label: "REB" },
                              { key: "assists", label: "AST" },
                              { key: "steals", label: "STL" },
                              { key: "blocks", label: "BLK" },
                              { key: "turnovers", label: "TO" },
                              { key: "fouls", label: "PF", px: 1 },
                              { key: "plusMinus", label: "+/-", px: 1 },
                            ] as {
                              key: keyof PlayerAggregates;
                              label: string;
                              px?: number;
                            }[]
                          ).map((col) => (
                            <TableCell
                              key={col.key}
                              align={
                                col.key === "jerseyNumber" ? "left" : "right"
                              }
                              sx={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                px: col.px ?? 0.5,
                              }}
                            >
                              <TableSortLabel
                                active={sortConfig.key === col.key}
                                direction={
                                  sortConfig.key === col.key
                                    ? sortConfig.direction
                                    : "asc"
                                }
                                onClick={() => {
                                  setSortConfig((prev) => ({
                                    key: col.key,
                                    direction:
                                      prev.key === col.key &&
                                      prev.direction === "asc"
                                        ? "desc"
                                        : "asc",
                                  }));
                                }}
                              >
                                {col.label}
                              </TableSortLabel>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedStatsGridData.map((row) => (
                          <PlayerStatRow
                            key={row.id}
                            jerseyNumber={row.jerseyNumber?.toString() ?? ""}
                            name={row.name}
                            min={row.min}
                            points={row.points}
                            threePM={row.threePM}
                            threePA={row.threePA}
                            threePPct={row.threePPct}
                            ftm={row.ftm}
                            fta={row.fta}
                            ftPct={row.ftPct}
                            rebounds={row.rebounds}
                            assists={row.assists}
                            steals={row.steals}
                            blocks={row.blocks}
                            turnovers={row.turnovers}
                            fouls={row.fouls}
                            plusMinus={row.plusMinus}
                            streak={playerStreaks.get(row.id.toString())}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MoleskineCard>
              </>
            ) : (
              <MoleskineCard
                sx={{
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText",
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {game?.opponent || "Opponent"} Tracking
                </Typography>
                <Typography variant="body2">
                  Stats recorded in this mode will be assigned to the "
                  {game?.opponent || "Opponent"}" player.
                </Typography>
              </MoleskineCard>
            )}

            <MoleskineCard>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <History sx={{ fontSize: 18, mr: 1 }} /> Recent Actions
              </Typography>
              <Stack spacing={1}>
                {gameData.recentStats.filter((s) => !s.deletedAt).length ===
                0 ? (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      border: "1px dashed #D1D1D1",
                      borderRadius: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <History sx={{ color: "text.secondary", opacity: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      No actions recorded yet. Tap the court or use quick
                      actions to start tracking.
                    </Typography>
                  </Box>
                ) : (
                  gameData.recentStats.map((s, index) => {
                    // ⚡ Bolt: Use playerNamesMap with fallback logic directly in the map loop.
                    // This avoids redundant function allocation and complex branching for every item.
                    let playerName =
                      playerNamesMap.get(s.playerId) || "Unknown";
                    if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
                      playerName = game?.opponent || "Opponent";
                    } else if (
                      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
                    ) {
                      playerName = `${game?.opponent || "Opponent"} #${s.playerId.split(":")[1]}`;
                    } else if (
                      s.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
                      s.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
                    ) {
                      playerName = team?.name || "Our Team";
                    }

                    return (
                      <RecentActionItem
                        key={s.id}
                        stat={s}
                        playerName={playerName}
                        periodLabel={periodLabel}
                        isReadOnly={isReadOnly}
                        isLatest={index === 0}
                        onEdit={openEditDialog}
                        onDelete={(id) => {
                          setStatToDelete(id);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    );
                  })
                )}
              </Stack>
            </MoleskineCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Record/Edit Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-describedby="stat-dialog-player-info"
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            selectedPlayerId &&
            statType &&
            !isSavingStat
          ) {
            e.preventDefault();
            handleSaveStat();
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {isEditing ? "Edit Action" : "Record Action"}
          <Typography
            id="stat-dialog-player-info"
            variant="body2"
            color="text.secondary"
          >
            {(() => {
              if (selectedPlayerId === SPECIAL_PLAYER_IDS.OPPONENT) {
                return game?.opponent || "Opponent";
              }
              if (
                selectedPlayerId?.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
              ) {
                const jersey = selectedPlayerId.split(":")[1];
                return `${game?.opponent || "Opponent"} #${jersey}`;
              }
              const p = players?.find((p) => p.id === selectedPlayerId);
              if (!p) return "Select Player";
              const s = statsMap.get(p.id!);
              return `${p.name} (${s?.points || 0} pts | ${s?.fouls || 0} pf)`;
            })()}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {trackingMode === "TEAM" && !isEditing && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1, fontWeight: 600 }}
              >
                Select Player
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  pb: 1,
                  "&::-webkit-scrollbar": { height: 4 },
                }}
              >
                {players
                  .filter((p) => gameData.onCourtIds.has(p.id!))
                  .map((p) => {
                    const s = statsMap.get(p.id!);
                    const pf = s?.fouls || 0;
                    const foulLimit =
                      game?.foulLimit || team?.defaultFoulLimit || 5;
                    const isFoulTrouble = pf === foulLimit - 1;
                    const isFouledOut = pf >= foulLimit;

                    return (
                      <Button
                        key={p.id}
                        variant={
                          selectedPlayerId === p.id ? "contained" : "outlined"
                        }
                        aria-label={p.name}
                        onClick={() => setSelectedPlayerId(p.id!)}
                        sx={{
                          minWidth: 80,
                          flexShrink: 0,
                          flexDirection: "column",
                          py: 1,
                          borderColor: isFouledOut
                            ? "error.main"
                            : isFoulTrouble
                              ? "warning.main"
                              : "divider",
                          color:
                            selectedPlayerId === p.id
                              ? "white"
                              : isFouledOut
                                ? "error.main"
                                : "text.primary",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            mb: 0.5,
                            bgcolor: p.avatarColor || "grey.500",
                          }}
                        >
                          {jerseyMap.get(p.id!) ?? ""}
                        </Avatar>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.6rem" }}
                        >
                          {p.name.split(" ")[0]}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            color: isFouledOut
                              ? "error.main"
                              : isFoulTrouble
                                ? "warning.main"
                                : "inherit",
                          }}
                        >
                          PF: {pf}
                        </Typography>
                      </Button>
                    );
                  })}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            <QuickAction
              type={ACTION_TYPES.MAKE}
              label="Make"
              icon={Check}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.MISS}
              label="Miss"
              icon={Close}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.ASSIST}
              label="Assist"
              icon={PanTool}
              statType={statType}
              setStatType={setStatType}
            />
            {/* 🏀 CoachBoard: Offensive vs. Defensive Rebounds */}
            <QuickAction
              type={ACTION_TYPES.OFF_REBOUND}
              label="Off Reb"
              icon={SportsBasketball}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.DEF_REBOUND}
              label="Def Reb"
              icon={SportsBasketball}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.TURNOVER}
              label="Turnover"
              icon={SwapHoriz}
              statType={statType}
              setStatType={setStatType}
            />
            <QuickAction
              type={ACTION_TYPES.STEAL}
              label="Steal"
              icon={FlashOn}
              statType={statType}
              setStatType={setStatType}
            />
            {/* 🏀 CoachBoard: Added Block action */}
            <QuickAction
              type={ACTION_TYPES.BLOCK}
              label="Block"
              icon={ArrowBack}
              statType={statType}
              setStatType={setStatType}
            />
            <Box>
              <QuickAction
                type={ACTION_TYPES.FOUL}
                label="Foul"
                icon={Warning}
                statType={statType}
                setStatType={setStatType}
              />
              {(() => {
                const fouls =
                  trackingMode === "TEAM"
                    ? gameData.teamFoulStats.teamFouls
                    : gameData.teamFoulStats.oppFouls;

                // 🏀 CoachBoard: Dynamic Bonus Context
                // Why: Alerts the scorekeeper if the next foul leads to free throws.
                // Note: Bonus context depends on the *current* team's fouls (trackingMode).
                const foulsRequiredForBonus = periodType === "QUARTERS" ? 5 : 7;
                const foulsForWarning = foulsRequiredForBonus - 1;

                if (fouls >= foulsRequiredForBonus) {
                  return (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        color: "error.main",
                        fontWeight: 900,
                        fontSize: "0.55rem",
                        mt: 0.5,
                      }}
                    >
                      IN BONUS
                    </Typography>
                  );
                } else if (fouls === foulsForWarning) {
                  return (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "center",
                        color: "warning.main",
                        fontWeight: 700,
                        fontSize: "0.55rem",
                        mt: 0.5,
                      }}
                    >
                      NEXT: BONUS
                    </Typography>
                  );
                }
                return null;
              })()}
            </Box>
          </Box>
          {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
            trackingMode === "TEAM" &&
            team?.playbook &&
            team.playbook.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  gutterBottom
                  sx={{ display: "block", mb: 1 }}
                >
                  Offensive Play
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {team.playbook.map((play) => (
                    <Chip
                      key={play}
                      label={play}
                      size="small"
                      onClick={() => setPlayName(playName === play ? "" : play)}
                      color={playName === play ? "primary" : "default"}
                      variant={playName === play ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
              </Box>
            )}
          {(statType === ACTION_TYPES.MAKE ||
            statType === ACTION_TYPES.MISS) && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Shot Quality
              </Typography>
              <ToggleButtonGroup
                value={shotQuality}
                exclusive
                onChange={(_, val) => setShotQuality(val)}
                size="small"
                fullWidth
              >
                <ToggleButton value={SHOT_QUALITY.OPEN}>Open</ToggleButton>
                <ToggleButton value={SHOT_QUALITY.CONTESTED}>
                  Contested
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {statType === ACTION_TYPES.MAKE && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Points
              </Typography>
              <Stack direction="row" spacing={1}>
                {[1, 2, 3].map((pts) => (
                  <Button
                    key={pts}
                    fullWidth
                    variant={points === pts ? "contained" : "outlined"}
                    onClick={() => setPoints(pts)}
                  >
                    {pts}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveStat()}
            variant="contained"
            disabled={!selectedPlayerId || !statType || isSavingStat}
          >
            {isSavingStat ? "Saving..." : isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm End Game Dialog */}
      <Dialog
        open={endGameDialogOpen}
        onClose={() => setEndGameDialogOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isEnding) {
            handleEndGame();
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>End Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Is the game finished? Once ended, the results will be finalized for
            team averages.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEndGameDialogOpen(false)}
            color="inherit"
            disabled={isEnding}
          >
            No, Continue
          </Button>
          <Button
            onClick={handleEndGame}
            color="error"
            variant="contained"
            disabled={isEnding}
          >
            {isEnding ? "Ending..." : "Yes, Finish Game"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final Game Summary Dialog */}
      <Dialog
        open={summaryDialogOpen}
        onClose={() => setSummaryDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", textAlign: "center" }}>
          Game Summary
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {gameData.currentScore} - {gameData.opponentScore}
            </Typography>
            <Typography
              variant="h5"
              color={
                gameData.currentScore > gameData.opponentScore
                  ? "success.main"
                  : "error.main"
              }
              sx={{ fontWeight: 600, mb: 3 }}
            >
              {gameData.currentScore > gameData.opponentScore
                ? "WIN"
                : gameData.currentScore < gameData.opponentScore
                  ? "LOSS"
                  : "DRAW"}
            </Typography>
            <Typography variant="body1">
              The game has been finalized. You can view the full box score in
              the Game Stats page.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSummaryDialogOpen(false);
            }}
            sx={{ mr: 2 }}
          >
            Close & Review Actions
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSummaryDialogOpen(false);
              navigate(`/game/stats?gameId=${gameId}`);
            }}
          >
            View Box Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Substitution Dialog */}
      <QuickSubDialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        players={players}
        team={team}
        game={game}
        draftOnCourtIds={draftOnCourtIds}
        selectedSwapId={selectedSwapId}
        statsMap={statsMap}
        jerseyMap={jerseyMap}
        handleSwapClick={handleSwapClick}
        handleQuickSub={handleQuickSub}
      />

      {/* Substitution Audit Dialog */}
      {gameId && (
        <SubstitutionAuditDialog
          open={auditDialogOpen}
          onClose={() => setAuditDialogOpen(false)}
          gameId={gameId}
          players={players}
          jerseyMap={jerseyMap}
        />
      )}

      {/* Free Throw Workflow Dialog */}
      {gameId && selectedPlayerId && (
        <FreeThrowWorkflowDialog
          open={ftWorkflowOpen}
          onClose={() => setFtWorkflowOpen(false)}
          gameId={gameId}
          playerId={selectedPlayerId}
          player={players.find((p) => p.id === selectedPlayerId)}
          jerseyNumber={jerseyMap.get(selectedPlayerId)}
          period={period}
          clockTime={clockSeconds}
        />
      )}

      {/* Halftime Report Dialog */}
      <HalftimeReportDialog
        open={halftimeReportOpen}
        onClose={() => setHalftimeReportOpen(false)}
        teamPpp={gameData.teamPpp}
        oppPpp={gameData.oppPpp}
        topLineups={halftimeLineupStats}
        bottomLineups={[...halftimeLineupStats].reverse()}
        opponentThreats={gameData.momentumAlerts.opponentThreats}
        jerseyMap={jerseyMap}
      />

      {/* Confirm Delete Stat Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isDeleting) {
            handleDeleteStat();
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {(() => {
              const s = gameStats.find((st) => st.id === statToDelete);
              if (!s) return "Are you sure you want to delete this action?";

              const getOppName = (pId: string) => {
                if (pId === SPECIAL_PLAYER_IDS.OPPONENT)
                  return game?.opponent || "Opponent";
                if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
                  const jersey = pId.split(":")[1];
                  return `${game?.opponent || "Opponent"} #${jersey}`;
                }
                return null;
              };

              const pName =
                getOppName(s.playerId) ||
                (s.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
                s.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
                  ? team?.name || "Our Team"
                  : players?.find((p) => p.id === s.playerId)?.name ||
                    "Unknown");

              return `Are you sure you want to delete the ${s.type} by ${pName}?`;
            })()}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteStat}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Linked Event Chain Prompt */}
      <Dialog
        open={Boolean(chainPrompt)}
        onClose={() => setChainPrompt(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {chainPrompt?.type === "ASSIST" ? "Who Assisted?" : "Who Rebounded?"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            {chainPrompt?.type === "REBOUND" && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                  handleChainAction(
                    SPECIAL_PLAYER_IDS.OPPONENT,
                    ACTION_TYPES.DEF_REBOUND,
                  )
                }
                sx={{ flexDirection: "column", py: 2 }}
              >
                <Avatar sx={{ bgcolor: "secondary.main", mb: 0.5 }}>OPP</Avatar>
                <Typography variant="caption">Opponent</Typography>
              </Button>
            )}

            {players
              .filter((p) => {
                if (!gameData.onCourtIds.has(p.id!)) return false;
                // Don't credit same player with assist on their own make
                if (
                  chainPrompt?.type === "ASSIST" &&
                  p.id === chainPrompt.originalStat.playerId
                )
                  return false;
                return true;
              })
              .map((p) => (
                <Button
                  key={p.id}
                  variant="outlined"
                  onClick={() =>
                    handleChainAction(
                      p.id!,
                      chainPrompt?.type === "ASSIST"
                        ? ACTION_TYPES.ASSIST
                        : ACTION_TYPES.OFF_REBOUND,
                    )
                  }
                  sx={{ flexDirection: "column", py: 2 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: p.avatarColor || "grey.500",
                      width: 32,
                      height: 32,
                      fontSize: "0.8rem",
                      mb: 0.5,
                    }}
                  >
                    {jerseyMap.get(p.id!) ?? getInitials(p.name)}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    {p.name.split(" ")[0]}
                  </Typography>
                </Button>
              ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setChainPrompt(null)} color="inherit">
            Skip
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clock FAB */}
      {!isReadOnly && (
        <Tooltip title={isClockRunning ? "Pause Game Clock" : "Start Game Clock"}>
          <IconButton
            onClick={handleToggleClock}
            sx={{
              position: "fixed",
              bottom: 32,
              right: 32,
              width: 64,
              height: 64,
              bgcolor: isClockRunning ? "warning.main" : "success.main",
              color: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              zIndex: theme.zIndex.speedDial,
              "&:hover": {
                bgcolor: isClockRunning ? "warning.dark" : "success.dark",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease-in-out",
            }}
            aria-label={isClockRunning ? "Pause Clock" : "Start Clock"}
          >
            {isClockRunning ? (
              <Pause sx={{ fontSize: 32 }} />
            ) : (
              <PlayArrow sx={{ fontSize: 32 }} />
            )}
          </IconButton>
        </Tooltip>
      )}

      {/* Edit Clock Dialog */}
      <EditClockDialog
        open={isClockEditDialogOpen}
        onClose={() => setIsClockEditDialogOpen(false)}
        onSave={handleEditClock}
        initialMinutes={Math.floor(clockSeconds / 60)}
        initialSeconds={clockSeconds % 60}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * QuickAction component for recording stats.
 * Optimized with React.memo to stabilize the recording dialog's UI.
 */
const QuickAction: React.FC<{
  type: string;
  label: string;
  icon: React.ElementType;
  statType: string | null;
  setStatType: (_type: string | null) => void;
}> = React.memo(({ type, label, icon: Icon, statType, setStatType }) => (
  <Tooltip title={label}>
    <Button
      variant={statType === type ? "contained" : "outlined"}
      color="inherit"
      aria-pressed={statType === type}
      aria-label={`Record ${label}`}
      onClick={() => {
        setStatType(type);
      }}
      sx={{
        flexDirection: "column",
        py: 2,
        minWidth: 80,
        borderColor: "#D1D1D1",
        backgroundColor: statType === type ? "primary.main" : "transparent",
        color: statType === type ? "white" : "text.primary",
      }}
    >
      <Icon sx={{ mb: 1 }} />
      <Typography variant="caption">{label}</Typography>
    </Button>
  </Tooltip>
));

/**
 * 🏀 CoachBoard: EditClockDialog
 * Why: Allows precise manual adjustment of the game clock.
 */
const EditClockDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (_mins: number, _secs: number) => void;
  initialMinutes: number;
  initialSeconds: number;
}> = ({ open, onClose, onSave, initialMinutes, initialSeconds }) => {
  const [mins, setMins] = useState(initialMinutes);
  const [secs, setSecs] = useState(initialSeconds);

  useEffect(() => {
    if (open) {
      setMins(initialMinutes);
      setSecs(initialSeconds);
    }
  }, [open, initialMinutes, initialSeconds]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Edit Clock</DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 3 }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              MINUTES
            </Typography>
            <Stack direction="column" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setMins(Math.min(99, mins + 1))}
                size="small"
                aria-label="Increase minutes"
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, minWidth: "2ch" }}
              >
                {mins}
              </Typography>
              <IconButton
                onClick={() => setMins(Math.max(0, mins - 1))}
                size="small"
                aria-label="Decrease minutes"
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
          <Typography variant="h4" sx={{ mt: 3, fontWeight: 800 }}>
            :
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              SECONDS
            </Typography>
            <Stack direction="column" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setSecs((secs + 1) % 60)}
                size="small"
                aria-label="Increase seconds"
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, minWidth: "2ch" }}
              >
                {secs.toString().padStart(2, "0")}
              </Typography>
              <IconButton
                onClick={() => setSecs((secs - 1 + 60) % 60)}
                size="small"
                aria-label="Decrease seconds"
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => onSave(mins, secs)} variant="contained">
          Save Clock
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameMode;
