/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Allows users to record statistical events (makes, misses, rebounds, etc.)
 * on an interactive court, manage active lineups, and track opponent scoring.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { db, type StatEvent, type Player } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  type PlayerAggregates,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";

/**
 * Determines bonus status labels and colors based on foul counts and period type.
 * @param fouls - Current foul count.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
const getBonusStatus = (fouls: number, periodType: string) => {
  if (periodType === "QUARTERS") {
    if (fouls >= 5)
      return {
        label: "BONUS",
        isBonus: true,
        isDouble: false,
        color: "error.main",
      };
    if (fouls === 4)
      return {
        label: "",
        isBonus: false,
        isDouble: false,
        color: "warning.main",
      };
    return { label: "", isBonus: false, isDouble: false, color: "default" };
  } else {
    if (fouls >= 10)
      return {
        label: "BONUS",
        isBonus: true,
        isDouble: true,
        color: "error.main",
      };
    if (fouls >= 7)
      return {
        label: "BONUS",
        isBonus: true,
        isDouble: false,
        color: "error.main",
      };
    if (fouls === 6)
      return {
        label: "",
        isBonus: false,
        isDouble: false,
        color: "warning.main",
      };
    return { label: "", isBonus: false, isDouble: false, color: "default" };
  }
};

/**
 * Visual indicator for timeouts left using dots.
 */
const TimeoutDots: React.FC<{
  count: number;
  total?: number;
  color?: string;
  "data-testid"?: string;
}> = ({ count, total = 5, color = "white", "data-testid": testId }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" data-testid={testId}>
    {Array.from({ length: total }).map((_, i) => (
      <Box
        key={i}
        data-testid={i < count ? "timeout-dot-active" : "timeout-dot-inactive"}
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: i < count ? color : "rgba(255,255,255,0.2)",
          boxShadow: i < count ? `0 0 4px ${color}` : "none",
        }}
      />
    ))}
  </Stack>
);

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
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  game,
  team,
  gameData,
  period,
  periodLabel,
  maxPeriod,
}) => {
  const theme = useTheme();

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
            color: (() => {
              const foulColor = isOpponent
                ? gameData.teamFoulStats.oppBonusColor
                : gameData.teamFoulStats.teamBonusColor;
              return foulColor === "default"
                ? "rgba(255,255,255,0.7)"
                : foulColor;
            })(),
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
          sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 4 } }}
        >
          <Typography
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

          <Box sx={{ textAlign: "center", minWidth: { xs: 60, sm: 100 } }}>
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
            <Stack direction="row" spacing={2} justifyContent="center">
              <ArrowBack
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
                }}
              />
              <ArrowForward
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
                }}
              />
            </Stack>
          </Box>

          <Typography
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
};

/**
 * Interactive controls for game state management.
 */
const ActionControls: React.FC<{
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
}> = ({
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
}) => {
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
};

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
  const [, setSubOutPlayerId] = useState<string | null>(null);

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
   * ⚡ Bolt: Consolidate statistical derivations.
   * Performance: Sort gameStats once and perform a single-pass derivation for
   * scores, fouls, timeouts, possession, lineups, and recent history.
   * This reduces database queries and minimizes redundant array traversals.
   */
  const gameData = useMemo(() => {
    const sorted = [...gameStats].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );

    let curScore = 0;
    let oppScore = 0;
    let teamFouls = 0;
    let oppFouls = 0;
    let teamTimeouts = 0;
    let oppTimeouts = 0;
    let posState = null;
    const onCourt = new Set<string>();
    const pType = team?.periodType || "QUARTERS";

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      if (s.deletedAt) continue;

      // Score
      if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
        oppScore += s.points || 0;
      } else {
        curScore += s.points || 0;
      }

      // Fouls (Period-aware)
      if (s.type === ACTION_TYPES.FOUL) {
        const isCurrentPeriodFoul =
          pType === "QUARTERS"
            ? s.period === period
            : period === 1
              ? s.period === 1
              : s.period >= 2;

        if (isCurrentPeriodFoul) {
          if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
            oppFouls++;
          } else {
            teamFouls++;
          }
        }
      }

      // Timeouts
      if (s.type === ACTION_TYPES.TIMEOUT) {
        if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
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
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
      }
    }

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
      recentStats: [...sorted].reverse().slice(0, 10),
    };
  }, [gameStats, period, team?.periodType]);

  // Initialize draft state when dialog opens
  useEffect(() => {
    if (subDialogOpen) {
      setDraftOnCourtIds(new Set(gameData.onCourtIds));
      setSelectedSwapId(null);
    }
  }, [subDialogOpen, gameData.onCourtIds]);

  const jerseyMap = useMemo(
    () =>
      new Map<string, string | undefined>(
        teamPlayers.map((tp) => [tp.playerId, tp.jerseyNumber]),
      ),
    [teamPlayers],
  );

  const statsGridData = useMemo(() => {
    return calculatePlayerAggregates(players, gameStats, teamPlayers);
  }, [players, gameStats, teamPlayers]);

  const sortedStatsGridData = useMemo(() => {
    return [...statsGridData].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      // Handle strings (name, jerseyNumber)
      if (typeof valA === "string" && typeof valB === "string") {
        return direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
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

  const markers = useMemo(() => {
    const res = [];
    for (let i = 0; i < gameStats.length; i++) {
      const s = gameStats[i];
      if (
        !s.deletedAt &&
        (markerFilter === "ALL" || s.type === markerFilter) &&
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
              ? jerseyMap.get(s.playerId) || ""
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
      } catch (err) {
        logger.error("Failed to undo stat:", err);
      }
    }
  }, [gameData.recentStats]);

  /**
   * Finalizes the game, marking it as completed and triggering a sync.
   */
  const handleEndGame = useCallback(async () => {
    try {
      await db.open();
      await db.games.update(gameId as string, { completed: 1, synced: 0 });
      await syncService.pushUpdates();
      setEndGameDialogOpen(false);
      setSummaryDialogOpen(true);
    } catch (err) {
      logger.error("Failed to end game:", err);
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
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          await db.stats.add(newStat);
          await syncService.pushUpdates();
        }
      } catch (err) {
        logger.error("Failed to save stat:", err);
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
      if (!selectedSwapId) {
        setSelectedSwapId(id);
        return;
      }

      if (selectedSwapId === id) {
        setSelectedSwapId(null);
        return;
      }

      const isAOnCourt =
        draftOnCourtIds.has(selectedSwapId) ||
        selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");

      // Perform swap only if they are in different groups
      if (isAOnCourt !== isBOnCourt) {
        setDraftOnCourtIds((prev) => {
          const next = new Set(prev);
          if (isAOnCourt) {
            // A is on court, B is on bench
            if (!selectedSwapId.startsWith("EMPTY"))
              next.delete(selectedSwapId);
            if (!id.startsWith("EMPTY")) next.add(id);
          } else {
            // A is on bench, B is on court
            if (!id.startsWith("EMPTY")) next.delete(id);
            if (!selectedSwapId.startsWith("EMPTY")) next.add(selectedSwapId);
          }
          return next;
        });
        setSelectedSwapId(null);
      } else {
        // Same group, update selection
        setSelectedSwapId(id);
      }
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
          timestamp,
          synced: 0,
        });
      }

      setSubDialogOpen(false);
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record quick sub:", err);
    }
  }, [gameId, isReadOnly, gameData.onCourtIds, draftOnCourtIds, period]);

  /**
   * Deletes a specific statistical event.
   */
  const handleDeleteStat = useCallback(async () => {
    if (!statToDelete) return;
    try {
      await db.open();
      await db.stats.update(statToDelete, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
      setStatToDelete(null);
    } catch (err) {
      logger.error("Failed to delete stat:", err);
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

  const handleNextPeriod = useCallback(() => {
    setPeriod((p) => {
      // Allow going up to 10 (arbitrary max for OT)
      return p < 10 ? p + 1 : 1;
    });
  }, []);

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
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record timeout:", err);
    }
  }, [gameId, isReadOnly, trackingMode, period]);

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
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle possession:", err);
    }
  }, [gameId, isReadOnly, period, gameData.possessionState]);

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
                {["ALL", "MAKE", "MISS", "REBOUND", "ASSIST", "STEAL"].map(
                  (type) => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => setMarkerFilter(type)}
                      variant={markerFilter === type ? "filled" : "outlined"}
                      size="small"
                      color={markerFilter === type ? "primary" : "default"}
                    />
                  ),
                )}
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
                                {jerseyMap.get(p.id!) || ""}
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
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.6rem", opacity: 0.9 }}
                                >
                                  {pts} pts |
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
                          <TableCell
                            sx={{ fontSize: "0.65rem", fontWeight: 700, px: 1 }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "jerseyNumber"}
                              direction={
                                sortConfig.key === "jerseyNumber"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "jerseyNumber",
                                  direction:
                                    prev.key === "jerseyNumber" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              PLAYER
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "points"}
                              direction={
                                sortConfig.key === "points"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "points",
                                  direction:
                                    prev.key === "points" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              PTS
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "rebounds"}
                              direction={
                                sortConfig.key === "rebounds"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "rebounds",
                                  direction:
                                    prev.key === "rebounds" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              REB
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "assists"}
                              direction={
                                sortConfig.key === "assists"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "assists",
                                  direction:
                                    prev.key === "assists" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              AST
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "steals"}
                              direction={
                                sortConfig.key === "steals"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "steals",
                                  direction:
                                    prev.key === "steals" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              STL
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              px: 0.5,
                            }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "turnovers"}
                              direction={
                                sortConfig.key === "turnovers"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "turnovers",
                                  direction:
                                    prev.key === "turnovers" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              TO
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.65rem", fontWeight: 700, px: 1 }}
                          >
                            <TableSortLabel
                              active={sortConfig.key === "fouls"}
                              direction={
                                sortConfig.key === "fouls"
                                  ? sortConfig.direction
                                  : "asc"
                              }
                              onClick={() => {
                                setSortConfig((prev) => ({
                                  key: "fouls",
                                  direction:
                                    prev.key === "fouls" &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }));
                              }}
                            >
                              PF
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedStatsGridData.map((row) => (
                          <PlayerStatRow key={row.id} row={row} />
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
                {gameData.recentStats
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
                  ))}
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
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {isEditing ? "Edit Action" : "Record Action"}
          <Typography variant="body2" color="text.secondary">
            {selectedPlayerId === SPECIAL_PLAYER_IDS.OPPONENT
              ? game?.opponent || "Opponent"
              : players?.find((p) => p.id === selectedPlayerId)?.name ||
                "Select Player"}
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
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        selectedPlayerId === p.id ? "contained" : "outlined"
                      }
                      onClick={() => setSelectedPlayerId(p.id!)}
                      sx={{
                        minWidth: 80,
                        flexShrink: 0,
                        flexDirection: "column",
                        py: 1,
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
                        {jerseyMap.get(p.id!) || ""}
                      </Avatar>
                      <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                        {p.name.split(" ")[0]}
                      </Typography>
                    </Button>
                  ))}
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
              type={ACTION_TYPES.REBOUND}
              label="Rebound"
              icon={SportsBasketball}
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
            <QuickAction
              type={ACTION_TYPES.ASSIST}
              label="Assist"
              icon={PanTool}
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
              type={ACTION_TYPES.FOUL}
              label="Foul"
              icon={Warning}
              statType={statType}
              setStatType={setStatType}
            />
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
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>End Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Is the game finished? Once ended, the results will be finalized for
            team averages.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEndGameDialogOpen(false)} color="inherit">
            No, Continue
          </Button>
          <Button onClick={handleEndGame} color="error" variant="contained">
            Yes, Finish Game
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
                    const pts = s?.points || 0;
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
                          {jerseyMap.get(p.id!) || ""}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          #{jerseyMap.get(p.id!) || ""} {p.name}
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
                    const pts = s?.points || 0;
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
                          {jerseyMap.get(p.id!) || ""}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          #{jerseyMap.get(p.id!) || ""} {p.name}
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
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteStat} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Sub-component for displaying a chip in the scoreboard.
 * Optimized with React.memo for high-frequency score updates.
 */
const ScoreboardChip: React.FC<{
  label: string;
  color?: "primary" | "secondary" | "warning" | "error" | "default";
  variant?: "filled" | "outlined";
  sx?: object;
  onClick?: () => void;
}> = React.memo(
  ({ label, color = "default", variant = "filled", sx, onClick }) => (
    <Chip
      label={label}
      color={color}
      variant={variant}
      onClick={onClick}
      sx={{ fontWeight: "bold", ...sx }}
    />
  ),
);

/**
 * Sub-component for displaying a player's statistical row in the table.
 * Optimized with React.memo to skip redundant virtual DOM diffing.
 */
const PlayerStatRow: React.FC<{
  row: PlayerAggregates;
}> = React.memo(({ row }) => (
  <TableRow>
    <TableCell sx={{ py: 1, px: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          display: "block",
          lineHeight: 1.1,
        }}
      >
        #{row.jerseyNumber}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          display: "block",
          color: "text.secondary",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "60px",
        }}
      >
        {row.name.split(" ")[0]}
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.points}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.rebounds}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.assists}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.steals}
    </TableCell>
    <TableCell align="right" sx={{ px: 0.5, fontSize: "0.75rem" }}>
      {row.turnovers}
    </TableCell>
    <TableCell
      align="right"
      sx={{
        px: 1,
        fontSize: "0.75rem",
        fontWeight: row.fouls >= 4 ? 700 : 400,
        bgcolor:
          row.fouls >= 5
            ? "error.main"
            : row.fouls === 4
              ? "warning.main"
              : "transparent",
        color: row.fouls >= 4 ? "white" : "inherit",
      }}
    >
      {row.fouls}
    </TableCell>
  </TableRow>
));

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
  onEdit: (_s: StatEvent) => void;
  onDelete: (_id: string) => void;
}> = React.memo(
  ({
    stat: s,
    players,
    periodLabel,
    isReadOnly,
    teamName,
    opponentName,
    onEdit,
    onDelete,
  }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.5,
        borderBottom: "1px solid #F0F0F0",
      }}
    >
      <Box>
        <Typography variant="body2">
          <strong>
            {s.playerId === SPECIAL_PLAYER_IDS.OPPONENT
              ? opponentName || "Opponent"
              : s.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
                  s.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
                ? teamName || "Our Team"
                : players?.find((p) => p.id === s.playerId)?.name || "Unknown"}
          </strong>
          : {s.type}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {periodLabel} {s.period || 1}
        </Typography>
      </Box>
      <Box>
        <Tooltip title="Edit action">
          <IconButton
            size="small"
            disabled={isReadOnly}
            onClick={() => onEdit(s)}
            aria-label="edit action"
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete action">
          <IconButton
            size="small"
            disabled={isReadOnly}
            onClick={() => onDelete(s.id!)}
            aria-label="delete action"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  ),
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
