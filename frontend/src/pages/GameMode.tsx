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
  LinearProgress,
  TextField,
  Fab,
} from "@mui/material";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const stopPulse = keyframes`
  0% { transform: scale(1); color: #fff; }
  50% { transform: scale(1.2); color: #4caf50; }
  100% { transform: scale(1); color: #fff; }
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
  ArrowForward,
  ArrowBack,
  Groups,
  PlayArrow,
  Pause,
  RestartAlt,
  Add as AddIcon,
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
import { PlayerStatRow } from "../components/PlayerStatRow";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculatePlayerStreaks,
  calculateStopsAndKills,
  isEventInPeriod,
  getBonusStatus,
  type PlayerAggregates,
} from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { MoleskineCard, AnimatedNumber } from "../components/SharedUI";

/**
 * 🏀 CoachBoard: getShotValue
 * Why: Automatically detects if a shot is a 2 or 3 based on court coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 */
const getShotValue = (x: number, y: number): number => {
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
      }
    | null
    | undefined;
  gameData: {
    currentScore: number;
    opponentScore: number;
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
    maxTimeouts: number;
    timeoutStats: {
      teamTOL: number;
      oppTOL: number;
    };
    possessionState: string | null;
    defensiveStats: {
      totalStops: number;
      totalKills: number;
      currentStreak: number;
    };
  };
  period: number;
  periodLabel: string;
  maxPeriod: number;
  onQuickAction?: (_type: string, _points?: number) => void;
  isReadOnly: boolean;
  onEditClock?: () => void;
  opponentJerseys?: string[];
  selectedOpponentId?: string;
  onAddOpponentJersey?: () => void;
  onSelectOpponent?: (_id: string) => void;
}

const Scoreboard = React.memo(
  ({
    game,
    team,
    gameData,
    period,
    periodLabel,
    maxPeriod,
    onQuickAction,
    isReadOnly,
    clockSeconds,
    onToggleClock,
    onResetClock,
    isClockRunning,
    opponentJerseys = [],
    selectedOpponentId = SPECIAL_PLAYER_IDS.OPPONENT,
    onAddOpponentJersey,
    onSelectOpponent,
    onEditClock,
  }: ScoreboardProps & {
    clockSeconds: number;
    onToggleClock: () => void;
    onResetClock: () => void;
    isClockRunning: boolean;
  }) => {
    const theme = useTheme();

    const getFoulColor = (isOpp: boolean) => {
      const foulColor = isOpp
        ? gameData.teamFoulStats.oppBonusColor
        : gameData.teamFoulStats.teamBonusColor;
      return foulColor === "default" ? "rgba(255,255,255,0.7)" : foulColor;
    };

    const renderTeamInfo = (
      name: string,
      logoUrl: string | undefined,
      score: number,
      timeouts: number,
      timeoutLimit: number,
      isOpponent?: boolean,
    ) => (
      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, sm: 4 },
          flexDirection: isOpponent ? "row-reverse" : "row",
          alignItems: "center",
          width: { xs: "40%", sm: "42%" },
        }}
      >
        {/* Column 1: Logo and Name */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            minWidth: { xs: 60, sm: 100 },
          }}
        >
          <Avatar
            src={logoUrl}
            sx={{
              width: { xs: 40, sm: 64 },
              height: { xs: 40, sm: 64 },
              bgcolor: isOpponent ? "secondary.main" : "primary.main",
              border: "2px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {name.charAt(0)}
          </Avatar>
          <Typography
            sx={{
              color: "white",
              fontWeight: 800,
              fontSize: { xs: "0.7rem", sm: "0.9rem" },
              textTransform: "uppercase",
              letterSpacing: 1,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: { xs: 80, sm: 120 },
            }}
          >
            {name}
          </Typography>
        </Box>

        {/* Column 2: Score and Timeouts */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: isOpponent ? "flex-end" : "flex-start",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexDirection: isOpponent ? "row-reverse" : "row",
            }}
          >
            {/* Bonus Indicator Arrow */}
            {!isOpponent && gameData.teamFoulStats.oppBonusLabel && (
              <ArrowBack
                data-testid="team-bonus-arrow"
                sx={{ color: "#FFD700", fontSize: { xs: 20, sm: 30 } }}
              />
            )}
            {isOpponent && gameData.teamFoulStats.teamBonusLabel && (
              <ArrowForward
                data-testid="opp-bonus-arrow"
                sx={{ color: "#FFD700", fontSize: { xs: 20, sm: 30 } }}
              />
            )}
            <Typography
              sx={{
                color: "white",
                fontSize: { xs: "2rem", sm: "3.5rem" },
                fontWeight: 900,
                fontFamily: "'Courier New', monospace",
                lineHeight: 1,
                textShadow: "0 0 20px rgba(255,255,255,0.2)",
              }}
            >
              <AnimatedNumber value={score} />
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <TimeoutDots
              count={timeouts}
              total={timeoutLimit}
              data-testid={isOpponent ? "opp-timeout-dots" : "team-timeout-dots"}
            />
          </Stack>

        </Box>
      </Box>
    );

    return (
      <Box
        sx={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #000000 100%)",
          borderRadius: 2,
          p: { xs: 1.5, sm: 2.5 },
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative accent */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            opacity: 0.5,
          }}
        />

        {renderTeamInfo(
          team?.name || "TEAM",
          team?.logoUrl,
          gameData.currentScore,
          gameData.timeoutStats.teamTOL,
          gameData.maxTimeouts,
        )}

        {/* Center Piece: Period and Clock */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              fontWeight: 800,
              fontSize: { xs: "0.6rem", sm: "0.8rem" },
              letterSpacing: 3,
            }}
          >
            {period > maxPeriod
              ? `OT ${period - maxPeriod}`
              : `${periodLabel} ${period}`}
          </Typography>

          {/* Game Clock Display - Tap to edit */}
          <Box
            sx={{
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
              textAlign: "center",
              width: "100%",
              maxWidth: 120,
            }}
            onClick={onEditClock}
          >
            <Typography
              sx={{
                color: isClockRunning ? theme.palette.primary.light : "white",
                fontSize: { xs: "1.5rem", sm: "2.2rem" },
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {formatClock(clockSeconds)}
            </Typography>

            {/* Sliding Progress Indicator */}
            <Box sx={{ width: "100%", mt: 1.5 }}>
              <LinearProgress
                variant={isClockRunning ? "indeterminate" : "determinate"}
                value={
                  isClockRunning
                    ? undefined
                    : (clockSeconds /
                        (game?.periodLength ? game.periodLength * 60 : 600)) *
                      100
                }
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    transition: isClockRunning
                      ? "none"
                      : "transform .4s linear",
                  },
                }}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
            <ArrowBack
              aria-label={`${team?.name || "Team"} possession`}
              sx={{
                fontSize: { xs: 16, sm: 20 },
                color:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                    ? "primary.light"
                    : "rgba(255,255,255,0.1)",
                filter:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                    ? "drop-shadow(0 0 4px #5A9BBD)"
                    : "none",
                opacity:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                    ? 1
                    : 0.2,
              }}
            />
            <ArrowForward
              aria-label={`${game?.opponent || "Opponent"} possession`}
              sx={{
                fontSize: { xs: 16, sm: 20 },
                color:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
                    ? "secondary.light"
                    : "rgba(255,255,255,0.1)",
                filter:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
                    ? "drop-shadow(0 0 4px #F6F6F6)"
                    : "none",
                opacity:
                  gameData.possessionState === SPECIAL_PLAYER_IDS.OPPONENT
                    ? 1
                    : 0.2,
              }}
            />
          </Stack>
        </Box>

        {renderTeamInfo(
          game?.opponent || "OPPONENT",
          game?.opponentLogoUrl,
          gameData.opponentScore,
          gameData.timeoutStats.oppTOL,
          gameData.maxTimeouts,
          true,
        )}
      </Box>
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

  const [opponentJerseys, setOpponentJerseys] = useState<string[]>([]);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(
    SPECIAL_PLAYER_IDS.OPPONENT,
  );

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
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [ftWorkflowOpen, setFtWorkflowOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSavingStat, setIsSavingStat] = useState(false);
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
  const [clockDialogOpen, setClockDialogOpen] = useState(false);
  const [editMins, setEditMins] = useState(0);
  const [editSecs, setEditSecs] = useState(0);

  const handleEditClockOpen = useCallback(() => {
    setEditMins(Math.floor(clockSeconds / 60));
    setEditSecs(clockSeconds % 60);
    setClockDialogOpen(true);
  }, [clockSeconds]);

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
   * scores, fouls, timeouts, possession, lineups, and recent history.
   * This O(N) loop only re-runs when the event stream or period changes.
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
    const pType = team?.periodType || "QUARTERS";

    for (let i = 0; i < sortedGameStats.length; i++) {
      const s = sortedGameStats[i];
      if (s.deletedAt) continue;

      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

      // Score
      if (isOpp) {
        oppScore += s.points || 0;
      } else {
        curScore += s.points || 0;
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

      // Lineup
      if (s.type === ACTION_TYPES.SUB_IN) {
        onCourt.add(s.playerId);
        if (s.period === period) {
          stintStarts.set(
            s.playerId,
            s.clockTime ?? (game?.periodLength ? game.periodLength * 60 : 600),
          );
        }
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
        stintStarts.delete(s.playerId);
      }
    }

    // For players already on court at start of period without a SUB_IN event this period
    onCourt.forEach((pId) => {
      if (!stintStarts.has(pId)) {
        stintStarts.set(pId, game?.periodLength ? game.periodLength * 60 : 600);
      }
    });

    let lastLineupChangeClock = game?.periodLength
      ? game.periodLength * 60
      : 600;
    let lastLineupChangeScoreTeam = 0;
    let lastLineupChangeScoreOpp = 0;

    // Find the last substitution event in this period to calculate lineup +/-
    // If no sub in this period, we use the start of the period.
    const subsInThisPeriod = sortedGameStats.filter(
      (s) =>
        !s.deletedAt &&
        s.period === period &&
        (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT),
    );

    if (subsInThisPeriod.length > 0) {
      const lastSub = subsInThisPeriod[subsInThisPeriod.length - 1];
      lastLineupChangeClock = lastSub.clockTime ?? lastLineupChangeClock;

      // Calculate scores at that exact moment
      let tempScoreTeam = 0;
      let tempScoreOpp = 0;
      for (const s of sortedGameStats) {
        if (s.deletedAt) continue;
        if (s.timestamp > lastSub.timestamp) break;
        if (s.type === ACTION_TYPES.MAKE) {
          if (
            s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
            s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
          ) {
            tempScoreOpp += s.points || 0;
          } else {
            tempScoreTeam += s.points || 0;
          }
        }
      }
      lastLineupChangeScoreTeam = tempScoreTeam;
      lastLineupChangeScoreOpp = tempScoreOpp;
    } else {
      // Scores at the start of the current period
      let tempScoreTeam = 0;
      let tempScoreOpp = 0;
      for (const s of sortedGameStats) {
        if (s.deletedAt) continue;
        if (s.period >= period) break;
        if (s.type === ACTION_TYPES.MAKE) {
          if (
            s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
            s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
          ) {
            tempScoreOpp += s.points || 0;
          } else {
            tempScoreTeam += s.points || 0;
          }
        }
      }
      lastLineupChangeScoreTeam = tempScoreTeam;
      lastLineupChangeScoreOpp = tempScoreOpp;
    }

    const defensiveStats = calculateStopsAndKills(sortedGameStats);
    const MAX_TIMEOUTS = game?.timeoutLimit || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);

    return {
      maxTimeouts: MAX_TIMEOUTS,
      currentScore: curScore,
      opponentScore: oppScore,
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
      lastLineupChangeClock,
      lastLineupChangeScoreTeam,
      lastLineupChangeScoreOpp,
      recentStats: sortedGameStats.slice(-10).reverse(),
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
    };
  }, [eventAggregates, clockSeconds]);

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

  const statsGridData = useMemo(() => {
    return calculatePlayerAggregates(
      players,
      sortedGameStats,
      teamPlayers,
      "total",
      {
        isSorted: true,
        periodLength: game?.periodLength,
        liveContext: { clockTime: clockSeconds, period },
      },
    );
  }, [
    players,
    sortedGameStats,
    teamPlayers,
    game?.periodLength,
    clockSeconds,
    period,
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

  // 🏀 CoachBoard: Hot/Cold Streaks
  // Why: Provides immediate coaching visibility into recent player performance trends.
  const playerStreaks = useMemo(() => {
    // ⚡ Bolt: Pass the pre-sorted event stream to avoid redundant sorting within the utility.
    return calculatePlayerStreaks(sortedGameStats, { isSorted: true });
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
      setPoints(getShotValue(x, y));

      // Auto-select opponent if in opponent tracking mode
      if (trackingMode === "OPPONENT") {
        setSelectedPlayerId(selectedOpponentId);
      } else {
        setSelectedPlayerId(null);
      }
      setDialogOpen(true);
    },
    [isReadOnly, trackingMode, selectedOpponentId],
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
            period,
            clockTime: clockSeconds,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          await db.stats.add(newStat);
          await syncService.pushUpdates();
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

  const handleResetClock = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    const defaultMins = periodType === "QUARTERS" ? 10 : 20;
    const resetSeconds = defaultMins * 60;
    setClockSeconds(resetSeconds);
    setIsClockRunning(false);

    try {
      await db.open();
      await db.games.update(gameId, { clockTime: resetSeconds, synced: 0 });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to reset clock:", err);
    }
  }, [gameId, isReadOnly, periodType]);

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
  /**
   * 🏀 CoachBoard: handleQuickOpponentAction
   * Why: Fast recording of opponent statistical events from the scoreboard.
   * Note: Uses default rim coordinates (50, 10) for recorded shot events.
   */
  const handleQuickOpponentAction = useCallback(
    async (type: string, pts: number = 0) => {
      if (!gameId || isReadOnly) return;

      try {
        await db.open();
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: selectedOpponentId,
          type: type,
          points: pts,
          locationX: 50,
          locationY: 10,
          period,
          clockTime: clockSeconds,
          timestamp: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
        setSnackbar({
          open: true,
          message: "Opponent action recorded",
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to record quick opponent action:", err);
        setSnackbar({
          open: true,
          message: "Failed to record action",
          severity: "error",
        });
      }
    },
    [gameId, isReadOnly, period, clockSeconds, selectedOpponentId],
  );

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
            onQuickAction={handleQuickOpponentAction}
            isReadOnly={isReadOnly}
            clockSeconds={clockSeconds}
            isClockRunning={isClockRunning}
            onToggleClock={handleToggleClock}
            onResetClock={handleResetClock}
            opponentJerseys={opponentJerseys}
            selectedOpponentId={selectedOpponentId}
            onAddOpponentJersey={() => {
              const jersey = window.prompt("Enter opponent jersey number:");
              if (jersey && !opponentJerseys.includes(jersey)) {
                setOpponentJerseys((prev) => [...prev, jersey]);
                setSelectedOpponentId(
                  `${SPECIAL_PLAYER_IDS.OPPONENT}:${jersey}`,
                );
              }
            }}
            onSelectOpponent={(id) => setSelectedOpponentId(id)}
            onEditClock={handleEditClockOpen}
          />

          <Fab
            color="primary"
            aria-label={isClockRunning ? "Pause Clock" : "Start Clock"}
            onClick={handleToggleClock}
            disabled={isReadOnly}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000,
              boxShadow: 4,
            }}
          >
            {isClockRunning ? <Pause /> : <PlayArrow />}
          </Fab>

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
            {trackingMode === "TEAM" ? (
              <>
                <MoleskineCard>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Team Stats
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: "text.secondary" }}
                        >
                          STOPS
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {gameData.defensiveStats.totalStops}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: "text.secondary" }}
                        >
                          KILLS
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "error.main" }}
                        >
                          {gameData.defensiveStats.totalKills}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </MoleskineCard>

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
                                  : isFoulTrouble
                                    ? "warning.main"
                                    : "primary.main",
                                color: "white",
                                borderWidth: "1.5px",
                                animation:
                                  isFoulTrouble || isFouledOut
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
                                        : isFoulTrouble
                                          ? "#ed6c02"
                                          : "transparent",
                                      fontWeight:
                                        isFouledOut || isFoulTrouble
                                          ? 900
                                          : 400,
                                      border:
                                        isFouledOut || isFoulTrouble
                                          ? "1px solid white"
                                          : "none",
                                    }}
                                  >
                                    {pf} foul{pf !== 1 ? "s" : ""}
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
                  gameData.recentStats
                    .filter((s) => !s.deletedAt)
                    .map((s, index) => {
                      const getPlayerName = (pId: string) => {
                        if (pId === SPECIAL_PLAYER_IDS.OPPONENT)
                          return game?.opponent || "Opponent";
                        if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
                          const jersey = pId.split(":")[1];
                          return `${game?.opponent || "Opponent"} #${jersey}`;
                        }
                        if (
                          pId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
                          pId === SPECIAL_PLAYER_IDS.OUR_TEAM
                        ) {
                          return team?.name || "Our Team";
                        }
                        return playerNamesMap.get(pId) || "Unknown";
                      };

                      return (
                        <RecentActionItem
                          key={s.id}
                          stat={s}
                          playerName={getPlayerName(s.playerId)}
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
                const jersey = selectedOpponentId.split(":")[1];
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

      {/* Edit Clock Dialog */}
      <Dialog
        open={clockDialogOpen}
        onClose={() => setClockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Edit Clock</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <TextField
              label="Minutes"
              type="number"
              fullWidth
              value={editMins}
              onChange={(e) => setEditMins(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0, max: 99 }}
            />
            <TextField
              label="Seconds"
              type="number"
              fullWidth
              value={editSecs}
              onChange={(e) => setEditSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              inputProps={{ min: 0, max: 59 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClockDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const totalSecs = editMins * 60 + editSecs;
              setClockSeconds(totalSecs);
              if (gameId) {
                await db.games.update(gameId, { clockTime: totalSecs, synced: 0 });
              }
              setClockDialogOpen(false);
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

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

export default GameMode;
