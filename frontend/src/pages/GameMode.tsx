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
} from "@mui/material";
import {
  Undo as UndoIcon,
  History,
  Check,
  Close,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  Edit,
  Delete,
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
import { PlayerStatRow } from "../components/PlayerStatRow";
import { db, type StatEvent, type Player } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculatePlayerStreaks,
  isEventInPeriod,
  getBonusStatus,
  type PlayerAggregates,
} from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { MoleskineCard } from "../components/SharedUI";

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
    timeoutStats: {
      teamTOL: number;
      oppTOL: number;
    };
    possessionState: string | null;
  };
  period: number;
  periodLabel: string;
  maxPeriod: number;
  onQuickAction?: (_type: string, _points?: number) => void;
  isReadOnly: boolean;
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
      logoUrl?: string,
      isOpponent?: boolean,
    ) => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isOpponent ? "flex-end" : "flex-start",
          width: { xs: "30%", sm: "35%" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexDirection: isOpponent ? "row-reverse" : "row",
            mb: 0.5,
          }}
        >
          <Avatar
            src={logoUrl}
            sx={{
              width: { xs: 32, sm: 48 },
              height: { xs: 32, sm: 48 },
              bgcolor: isOpponent ? "secondary.main" : "primary.main",
              border: "2px solid rgba(255,255,255,0.1)",
            }}
          >
            {name.charAt(0)}
          </Avatar>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 700,
              fontSize: { xs: "0.75rem", sm: "1.1rem" },
              textTransform: "uppercase",
              letterSpacing: 1,
              display: { xs: "none", sm: "block" },
            }}
          >
            {name}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "white",
            fontWeight: 700,
            fontSize: "0.6rem",
            display: { xs: "block", sm: "none" },
            textAlign: isOpponent ? "right" : "left",
            width: "100%",
            mb: 0.5,
          }}
        >
          {name}
        </Typography>

        <Stack
          direction={isOpponent ? "row-reverse" : "row"}
          spacing={1.5}
          alignItems="center"
          sx={{ mt: 0.5 }}
        >
          <TimeoutDots
            count={
              isOpponent
                ? gameData.timeoutStats.oppTOL
                : gameData.timeoutStats.teamTOL
            }
            total={team?.fouls || 3}
            data-testid={isOpponent ? "opp-timeout-dots" : "team-timeout-dots"}
          />
        </Stack>

        {/* 🏀 CoachBoard: Team Foul Indicator
          Why: Provides critical "foul to give" or "bonus" visibility for coaching decisions. */}
        <Stack
          direction={isOpponent ? "row-reverse" : "row"}
          spacing={1}
          alignItems="center"
          sx={{ mt: 0.5, flexWrap: "nowrap" }}
        >
          <Typography
            variant="caption"
            sx={{
              color: getFoulColor(!!isOpponent),
              fontWeight: 800,
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
            }}
          >
            FOULS:{" "}
            {isOpponent
              ? gameData.teamFoulStats.oppFouls
              : gameData.teamFoulStats.teamFouls}
          </Typography>
          {/* Bonus label applied to the team currently in bonus (caused by opposite team's fouls) */}
          {(!isOpponent
            ? gameData.teamFoulStats.oppBonusLabel
            : gameData.teamFoulStats.teamBonusLabel) && (
            <Typography
              variant="caption"
              sx={{
                color: "#FFD700",
                fontWeight: 900,
                fontSize: "0.65rem",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
              }}
            >
              BONUS
              {!isOpponent
                ? gameData.teamFoulStats.oppIsDouble && <sup>2</sup>
                : gameData.teamFoulStats.teamIsDouble && <sup>2</sup>}
            </Typography>
          )}
        </Stack>

        {/* 🏀 CoachBoard: Opponent Quick-Action Buttons
          Why: Allows scorekeepers to record opponent scores and fouls with a single tap,
          avoiding the need to switch tracking modes during high-pressure live play. */}
        {isOpponent && !isReadOnly && (
          <Stack
            direction="column"
            alignItems={isOpponent ? "flex-end" : "flex-start"}
            spacing={1}
            sx={{ mt: 1 }}
          >
            {/* Individual Opponent Selector */}
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                flexWrap: "wrap",
                justifyContent: isOpponent ? "flex-end" : "flex-start",
              }}
            >
              <Chip
                label="Gen"
                size="small"
                onClick={() =>
                  onSelectOpponent &&
                  onSelectOpponent(SPECIAL_PLAYER_IDS.OPPONENT)
                }
                color={
                  selectedOpponentId === SPECIAL_PLAYER_IDS.OPPONENT
                    ? "primary"
                    : "default"
                }
                variant={
                  selectedOpponentId === SPECIAL_PLAYER_IDS.OPPONENT
                    ? "filled"
                    : "outlined"
                }
                sx={{
                  height: 20,
                  fontSize: "0.6rem",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              />
              {opponentJerseys.map((j) => {
                const id = `${SPECIAL_PLAYER_IDS.OPPONENT}:${j}`;
                return (
                  <Chip
                    key={j}
                    label={`#${j}`}
                    size="small"
                    onClick={() => onSelectOpponent && onSelectOpponent(id)}
                    color={selectedOpponentId === id ? "primary" : "default"}
                    variant={selectedOpponentId === id ? "filled" : "outlined"}
                    sx={{
                      height: 20,
                      fontSize: "0.6rem",
                      color: "white",
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                );
              })}
              <IconButton
                size="small"
                onClick={onAddOpponentJersey}
                sx={{
                  p: 0,
                  color: "rgba(255,255,255,0.5)",
                  "&:hover": { color: "white" },
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Stack direction="row" spacing={0.5}>
              {[1, 2, 3].map((pts) => (
                <Button
                  key={pts}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  aria-label={`Record opponent +${pts} points`}
                  onClick={() =>
                    onQuickAction && onQuickAction(ACTION_TYPES.MAKE, pts)
                  }
                  sx={{
                    minWidth: 0,
                    px: 0.8,
                    py: 0.2,
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "white",
                    "&:hover": { borderColor: "white" },
                  }}
                >
                  +{pts}
                </Button>
              ))}
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                aria-label="Record opponent rebound"
                onClick={() =>
                  onQuickAction && onQuickAction(ACTION_TYPES.REBOUND)
                }
                sx={{
                  minWidth: 0,
                  px: 0.8,
                  py: 0.2,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "white",
                  "&:hover": { borderColor: "white" },
                }}
              >
                REB
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                aria-label="Record opponent turnover"
                onClick={() =>
                  onQuickAction && onQuickAction(ACTION_TYPES.TURNOVER)
                }
                sx={{
                  minWidth: 0,
                  px: 0.8,
                  py: 0.2,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "white",
                  "&:hover": { borderColor: "white" },
                }}
              >
                TO
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                aria-label="Record opponent foul"
                onClick={() =>
                  onQuickAction && onQuickAction(ACTION_TYPES.FOUL)
                }
                sx={{
                  minWidth: 0,
                  px: 0.8,
                  py: 0.2,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  borderColor: "rgba(255,255,255,0.3)",
                  color: theme.palette.error.light,
                  "&:hover": { borderColor: "white" },
                }}
              >
                F
              </Button>
            </Stack>
          </Stack>
        )}
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

        {renderTeamInfo(team?.name || "TEAM", team?.logoUrl)}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 4 },
            }}
          >
            <Typography
              aria-label={`${team?.name || "Team"} score: ${gameData.currentScore}`}
              sx={{
                color: "white",
                fontSize: { xs: "1.75rem", sm: "3rem" },
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
                lineHeight: 1,
              }}
            >
              {gameData.currentScore}
            </Typography>

            <Box sx={{ textAlign: "center", minWidth: { xs: 100, sm: 150 } }}>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontSize: { xs: "0.6rem", sm: "0.75rem" },
                  letterSpacing: 2,
                  display: "block",
                  mb: 0.5,
                }}
              >
                {period > maxPeriod
                  ? `OT ${period - maxPeriod}`
                  : `${periodLabel} ${period}`}
              </Typography>

              {/* Game Clock */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "white",
                    fontSize: { xs: "1.2rem", sm: "1.8rem" },
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    minWidth: "4.5ch",
                  }}
                >
                  {formatClock(clockSeconds)}
                </Typography>
                {!isReadOnly && (
                  <IconButton
                    size="small"
                    onClick={onToggleClock}
                    aria-label={isClockRunning ? "Pause Clock" : "Start Clock"}
                    sx={{
                      color: isClockRunning
                        ? theme.palette.warning.main
                        : theme.palette.success.main,
                      bgcolor: "rgba(255,255,255,0.05)",
                      p: 0.5,
                    }}
                  >
                    {isClockRunning ? (
                      <Pause fontSize="small" />
                    ) : (
                      <PlayArrow fontSize="small" />
                    )}
                  </IconButton>
                )}
                {!isReadOnly && (
                  <IconButton
                    size="small"
                    onClick={onResetClock}
                    aria-label="Reset Clock"
                    sx={{
                      color: "rgba(255,255,255,0.4)",
                      bgcolor: "rgba(255,255,255,0.05)",
                      p: 0.5,
                      "&:hover": { color: "white" },
                    }}
                  >
                    <RestartAlt fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center">
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

            <Typography
              aria-label={`${game?.opponent || "Opponent"} score: ${gameData.opponentScore}`}
              sx={{
                color: "white",
                fontSize: { xs: "1.75rem", sm: "3rem" },
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
                lineHeight: 1,
              }}
            >
              {gameData.opponentScore}
            </Typography>
          </Box>
        </Box>

        {renderTeamInfo(
          game?.opponent || "OPPONENT",
          game?.opponentLogoUrl,
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

        <Tooltip title="Undo last action">
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
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
   */
  const gameData = useMemo(() => {
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
      if (s.type === ACTION_TYPES.FOUL) {
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

    const stintDurations = new Map<string, number>();
    stintStarts.forEach((startClock, pId) => {
      stintDurations.set(pId, Math.max(0, startClock - clockSeconds));
    });

    const MAX_TIMEOUTS = team?.fouls || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);

    return {
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
      stintDurations,
      recentStats: sortedGameStats.slice(-10).reverse(),
    };
  }, [
    sortedGameStats,
    period,
    team?.periodType,
    team?.fouls,
    clockSeconds,
    game?.periodLength,
  ]);

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

  const markers = useMemo(() => {
    const res = [];
    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (
        !s.deletedAt &&
        (markerFilter === "ALL" ||
          s.type === markerFilter ||
          (markerFilter === "REBOUND" &&
            (s.type === ACTION_TYPES.OFF_REBOUND ||
              s.type === ACTION_TYPES.DEF_REBOUND))) &&
        s.type !== ACTION_TYPES.SUB_IN &&
        s.type !== ACTION_TYPES.SUB_OUT &&
        s.type !== ACTION_TYPES.POSSESSION &&
        s.type !== ACTION_TYPES.TIMEOUT
      ) {
        res.push({
          id: s.id,
          x: s.locationX || 0,
          y: s.locationY || 0,
          type: s.type,
          label:
            s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT
              ? (jerseyMap.get(s.playerId) ?? "")
              : undefined,
          color:
            s.playerId === SPECIAL_PLAYER_IDS.OPPONENT
              ? theme.palette.secondary.main
              : undefined,
        });
      }
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

      try {
        if (!gameId) return;
        await db.open();
        if (isEditing && editingStatId) {
          await db.stats.update(editingStatId, {
            playerId: selectedPlayerId!,
            type: typeToSave,
            points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
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
            period,
            clockTime: clockSeconds,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          await db.stats.add(newStat);
          await syncService.pushUpdates();
        }
        setSnackbar({
          open: true,
          message: isEditing ? "Action updated" : "Action recorded",
          severity: "success",
        });
      } catch (err) {
        logger.error("Failed to save stat:", err);
        setSnackbar({
          open: true,
          message: "Failed to save action",
          severity: "error",
        });
      }
      // Reset state after save
      setDialogOpen(false);
      setStatType(null);
      setIsEditing(false);
      setEditingStatId(null);
      if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
    },
    [
      statType,
      selectedPlayerId,
      gameId,
      isEditing,
      editingStatId,
      points,
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
          />

          <MoleskineCard>
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
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Live Lineup
                  </Typography>
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
                        const isFoulTrouble = pf === 4;
                        const isFouledOut = pf >= 5;

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
                                    const color =
                                      stintSecs > 480
                                        ? theme.palette.error.main
                                        : stintSecs > 360
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
                          aria-label="Empty lineup slot, click to assign player"
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
                          <Typography variant="caption">Empty</Typography>
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
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      No actions recorded yet
                    </Typography>
                  </Box>
                ) : (
                  gameData.recentStats
                    .filter((s) => !s.deletedAt)
                    .map((s) => (
                      <RecentActionItem
                        key={s.id}
                        stat={s}
                        players={players}
                        periodLabel={periodLabel}
                        isReadOnly={isReadOnly}
                        teamName={team?.name}
                        opponentName={game?.opponent}
                        onEdit={openEditDialog}
                        onDelete={(id) => {
                          setStatToDelete(id);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))
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
                    const isFoulTrouble = pf === 4;
                    const isFouledOut = pf >= 5;

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
            disabled={!selectedPlayerId || !statType}
          >
            {isEditing ? "Update" : "Save"}
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
      <Dialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Quick Substitution
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom align="center">
                ON COURT
              </Typography>
              <Stack spacing={1}>
                {/* Active players */}
                {players
                  .filter((p) => draftOnCourtIds.has(p.id!))
                  .map((p) => {
                    const s = statsMap.get(p.id!);
                    const pf = s?.fouls || 0;
                    const isFoulTrouble = pf === 4;
                    const isFouledOut = pf >= 5;

                    return (
                      <Button
                        key={p.id}
                        variant={
                          selectedSwapId === p.id ? "contained" : "outlined"
                        }
                        onClick={() => handleSwapClick(p.id!)}
                        fullWidth
                        sx={{
                          justifyContent: "flex-start",
                          borderColor: isFouledOut
                            ? "error.main"
                            : isFoulTrouble
                              ? "warning.main"
                              : "divider",
                          color: isFouledOut ? "error.main" : "text.primary",
                          bgcolor:
                            selectedSwapId === p.id
                              ? isFouledOut
                                ? "error.light"
                                : isFoulTrouble
                                  ? "warning.light"
                                  : "primary.main"
                              : "transparent",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            mr: 1,
                            bgcolor: p.avatarColor || "grey.500",
                          }}
                        >
                          {jerseyMap.get(p.id!) ?? ""}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          #{jerseyMap.get(p.id!) ?? ""} {p.name}
                          {isFouledOut && " - OUT"}
                        </Typography>
                      </Button>
                    );
                  })}
                {/* Placeholder "Empty" slots to reach 5 total */}
                {Array.from({
                  length: Math.max(0, 5 - draftOnCourtIds.size),
                }).map((_, i) => {
                  const emptyId = `EMPTY-${i}`;
                  return (
                    <Button
                      key={emptyId}
                      variant={
                        selectedSwapId === emptyId ? "contained" : "outlined"
                      }
                      aria-label="Empty lineup slot, click to swap with bench player"
                      onClick={() => handleSwapClick(emptyId)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderStyle: "dashed",
                        color: "text.secondary",
                        bgcolor:
                          selectedSwapId === emptyId
                            ? "rgba(0,0,0,0.05)"
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: "transparent",
                          border: "1px dashed #bdbdbd",
                          color: "#bdbdbd",
                        }}
                      >
                        ?
                      </Avatar>
                      <Typography variant="body2">Empty</Typography>
                    </Button>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom align="center">
                BENCH
              </Typography>
              <Stack spacing={1}>
                {players
                  .filter((p) => !draftOnCourtIds.has(p.id!))
                  .map((p) => {
                    const s = statsMap.get(p.id!);
                    const pf = s?.fouls || 0;
                    const isFoulTrouble = pf === 4;
                    const isFouledOut = pf >= 5;

                    return (
                      <Button
                        key={p.id}
                        variant={
                          selectedSwapId === p.id ? "contained" : "outlined"
                        }
                        onClick={() => handleSwapClick(p.id!)}
                        fullWidth
                        sx={{
                          justifyContent: "flex-start",
                          borderColor: isFouledOut
                            ? "error.main"
                            : isFoulTrouble
                              ? "warning.main"
                              : "divider",
                          color: isFouledOut ? "error.main" : "text.primary",
                          opacity: isFouledOut ? 0.6 : 1,
                          bgcolor:
                            selectedSwapId === p.id
                              ? isFouledOut
                                ? "error.light"
                                : isFoulTrouble
                                  ? "warning.light"
                                  : "primary.main"
                              : "transparent",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            mr: 1,
                            bgcolor: p.avatarColor || "grey.500",
                          }}
                        >
                          {jerseyMap.get(p.id!) ?? ""}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          #{jerseyMap.get(p.id!) ?? ""} {p.name}
                          {isFouledOut && " - OUT"}
                        </Typography>
                      </Button>
                    );
                  })}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSubDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleQuickSub}
            variant="contained"
            startIcon={<SwapHoriz />}
          >
            Sub In
          </Button>
        </DialogActions>
      </Dialog>

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
            Are you sure you want to delete this action?
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
 * Sub-component for displaying a single item in the recent actions history.
 * Optimized with React.memo to prevent unnecessary re-renders of stable history items.
 */
const RecentActionItem: React.FC<{
  stat: StatEvent;
  players: Player[];
  periodLabel: string;
  isReadOnly: boolean;
  teamName?: string;
  opponentName?: string;
  onEdit: (_stat: StatEvent) => void;
  onDelete: (_id: string) => void;
}> = React.memo(
  ({
    stat,
    players,
    periodLabel,
    isReadOnly,
    teamName,
    opponentName,
    onEdit,
    onDelete,
  }) => {
    const getOpponentName = (pId: string) => {
      if (pId === SPECIAL_PLAYER_IDS.OPPONENT)
        return opponentName || "Opponent";
      if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
        const jersey = pId.split(":")[1];
        return `${opponentName || "Opponent"} #${jersey}`;
      }
      return null;
    };

    const playerName =
      getOpponentName(stat.playerId) ||
      (stat.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
      stat.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
        ? teamName || "Our Team"
        : players?.find((p) => p.id === stat.playerId)?.name || "Unknown");

    const getActionIcon = (type: string) => {
      const iconSx = { fontSize: 16, mr: 1, verticalAlign: "middle" };
      switch (type) {
        case ACTION_TYPES.MAKE:
          return <Check sx={{ ...iconSx, color: "success.main" }} />;
        case ACTION_TYPES.MISS:
          return <Close sx={{ ...iconSx, color: "error.main" }} />;
        case ACTION_TYPES.REBOUND:
        case ACTION_TYPES.OFF_REBOUND:
        case ACTION_TYPES.DEF_REBOUND:
          return <SportsBasketball sx={{ ...iconSx, color: "primary.main" }} />;
        case ACTION_TYPES.ASSIST:
          return <PanTool sx={{ ...iconSx, color: "info.main" }} />;
        case ACTION_TYPES.STEAL:
          return <FlashOn sx={{ ...iconSx, color: "warning.main" }} />;
        case ACTION_TYPES.TURNOVER:
          return <SwapHoriz sx={{ ...iconSx, color: "warning.dark" }} />;
        case ACTION_TYPES.BLOCK:
          return <ArrowBack sx={{ ...iconSx, color: "secondary.main" }} />;
        case ACTION_TYPES.FOUL:
          return <Warning sx={{ ...iconSx, color: "error.light" }} />;
        case ACTION_TYPES.TIMEOUT:
          return <History sx={{ ...iconSx, color: "text.secondary" }} />;
        case ACTION_TYPES.SUB_IN:
        case ACTION_TYPES.SUB_OUT:
          return <Groups sx={{ ...iconSx, color: "text.secondary" }} />;
        case ACTION_TYPES.POSSESSION:
          return <SwapHoriz sx={{ ...iconSx, color: "primary.light" }} />;
        default:
          return null;
      }
    };

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 0.5,
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ minWidth: 24, display: "flex", justifyContent: "center" }}>
            {getActionIcon(stat.type)}
          </Box>
          <Box>
            <Typography variant="body2">
              <strong>{playerName}</strong>: {stat.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {periodLabel} {stat.period || 1}
              {stat.clockTime !== undefined &&
                ` @ ${formatClock(stat.clockTime)}`}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Tooltip title={`Edit ${stat.type} for ${playerName}`}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={() => onEdit(stat)}
              aria-label={`edit ${stat.type} for ${playerName}`}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${stat.type} for ${playerName}`}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={() => onDelete(stat.id!)}
              aria-label={`delete ${stat.type} for ${playerName}`}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  },
);

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
  <Button
    variant={statType === type ? "contained" : "outlined"}
    color="inherit"
    aria-pressed={statType === type}
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
));

export default GameMode;
