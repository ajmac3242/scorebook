import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  DialogContentText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  Chip,
  Divider,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Warning,
  Edit as EditIcon,
  FitnessCenter as PracticeIcon,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import { getShotZone } from "../utils/shotZones";
import { db, type Player } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
  BREAKDOWN_REASONS,
} from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  calculateLineupStats,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  generatePracticePrescription,
  calculateTeamSeasonAverages,
  calculateDefensiveIntegrity,
  calculateIndividualDefensiveBreakdown,
  calculateSituationalStats,
  calculateAssistNetwork,
  calculateShotROI,
  calculatePaintTouchStats,
  type ScoreFlowPoint,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { OnOffImpactTable } from "../components/OnOffImpactTable";
import {
  calculateOnOffStats,
  calculateMatchupStats,
} from "../utils/stats/impact";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BoxScoreSection } from "./GameStats/BoxScoreSection";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
} from "recharts";

/**
 * GameStats page component.
 * Displays detailed box score, shot charts, and score flow for a specific game.
 */
const GameStats: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "impact">("standard");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedQuality, setSelectedQuality] = useState<string>("ALL");
  const [selectedBreakdown, setSelectedBreakdown] = useState<string>("ALL");
  const [selectedPlay, setSelectedPlay] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod1, setComparePeriod1] = useState<string>("1");
  const [comparePeriod2, setComparePeriod2] = useState<string>("2");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isPracticePlannerOpen, setIsPracticePlannerOpen] = useState(false);
  const [isDefensiveIntegrityOpen, setIsDefensiveIntegrityOpen] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");

  /**
   * Updates the column sorting configuration.
   * @param {string} key - Column key to sort by.
   */
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  /**
   * 🏀 Assistant Coach: Custom Game Flow Tooltip
   * WHY: Provides deep tactical context at any point in the game timeline,
   * including the active lineup and current efficiency (PPP).
   */
  interface ScoreFlowTooltipProps {
    active?: boolean;
    payload?: { payload: ScoreFlowPoint }[];
    label?: string;
  }

  const ScoreFlowTooltip = ({
    active,
    payload,
    label,
  }: ScoreFlowTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: "white",
            p: 2,
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: theme.shadows[3],
            borderRadius: 1,
            minWidth: 200,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            {label} - Spread: {data.Spread > 0 ? "+" : ""}
            {data.Spread}
          </Typography>
          {data.event && (
            <Chip
              label={data.event}
              size="small"
              color="primary"
              sx={{ mb: 1, height: 20, fontSize: "0.65rem", fontWeight: 700 }}
            />
          )}
          <Divider sx={{ my: 1 }} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
          >
            ACTIVE LINEUP:
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
            {data.lineup?.map((pId: string) => (
              <Avatar
                key={pId}
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: "0.65rem",
                  bgcolor: theme.palette.grey[200],
                  color: "black",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                {shotChartJerseyMap.get(pId) || "??"}
              </Avatar>
            ))}
            {(!data.lineup || data.lineup.length === 0) && (
              <Typography variant="caption" color="text.secondary">
                Unknown
              </Typography>
            )}
          </Stack>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ display: "block" }}>
                TEAM PPP
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data.teamPpp || "0.00"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ display: "block" }}>
                OPP PPP
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data.oppPpp || "0.00"}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      );
    }
    return null;
  };

  const game = useLiveQuery<unknown>(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as string)
        : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery<unknown>(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamSeasonStatsResult = useLiveQuery<unknown>(
    () =>
      game?.teamId
        ? db.games
            .where("teamId")
            .equals(game.teamId)
            .toArray()
            .then((games) => {
              const gameIds = games.map((g) => g.id!).filter(Boolean);
              return db.stats
                .where("gameId")
                .anyOf(gameIds)
                .toArray()
                .then((allStats) =>
                  calculateTeamSeasonAverages(games, allStats),
                );
            })
        : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamSeasonStats = useMemo(() => {
    return (
      teamSeasonStatsResult || {
        ppp: "0.00",
        ftPct: "0.0",
        turnoverRate: "0.0",
        orebPct: "0.0",
      }
    );
  }, [teamSeasonStatsResult]);

  const teamPlayersResult = useLiveQuery<unknown>(
    () =>
      game?.teamId
        ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
        : Promise.resolve([]),
    [game?.teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersResult || [],
    [teamPlayersResult],
  );

  const playerIds = useMemo(
    () => teamPlayers.map((tp) => tp.playerId.toString()),
    [teamPlayers],
  );

  const playersResult = useLiveQuery<unknown>(
    () => db.players.where("id").anyOf(playerIds).toArray(),
    [playerIds],
  );
  const players = useMemo(() => playersResult || [], [playersResult]);

  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent || "");
      setEditDate(game.date || "");
      setEditTime(game.time || "");
      setEditLocation(game.location || "");
      setEditOpponentLogoUrl(game.opponentLogoUrl || "");
    }
  }, [game]);

  const allStatsResult = useLiveQuery<unknown>(
    () =>
      gameId !== undefined
        ? db.stats.where("gameId").equals(gameId).toArray()
        : Promise.resolve([]),
    [gameId],
  );
  const allStats = useMemo(
    () => (Array.isArray(allStatsResult) ? allStatsResult : []),
    [allStatsResult],
  );

  useEffect(() => {
    if (game?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(game.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game?.deletedAt]);

  // Filter stats based on the selected period (Quarter/Half)
  const stats = useMemo(() => {
    if (periodFilter === "ALL") return allStats;
    return allStats.filter((s) => s.period === parseInt(periodFilter));
  }, [allStats, periodFilter]);

  // Optimization: Memoize the sorted statistics used for the score flow chart to avoid redundant sorting.
  const scoreFlowSortedStats = useMemo(() => {
    // ⚡ Bolt: Use direct comparison for ISO timestamps instead of localeCompare for hot paths.
    return [...stats].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }, [stats]);

  const aggregatedStats = useMemo(() => {
    // ⚡ Bolt: Use a single pass with a Set for O(1) roster filtering.
    // This avoids redundant array allocations and improves performance for large rosters.
    const teamPlayerIds = new Set<string | number>();
    for (let i = 0; i < teamPlayers.length; i++) {
      teamPlayerIds.add(teamPlayers[i].playerId);
    }

    const rosteredPlayers = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (teamPlayerIds.has(p.id!)) {
        rosteredPlayers.push(p);
      }
    }
    return calculatePlayerAggregates(
      rosteredPlayers,
      scoreFlowSortedStats,
      teamPlayers,
      "total",
      {
        isSorted: true,
        periodLength: game?.periodLength,
        clutchOnly: clutchFilter,
        periodType: team?.periodType,
        liveContext:
          game && !game.completed
            ? {
                clockTime: game.clockTime || 0,
                period: game.currentPeriod || 1,
              }
            : undefined,
      },
    );
  }, [
    players,
    scoreFlowSortedStats,
    teamPlayers,
    game,
    clutchFilter,
    team?.periodType,
  ]);

  const playerAggregates = useMemo(() => {
    return [...aggregatedStats].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as number | string;
      const bValue = b[sortConfig.key as keyof typeof b] as number | string;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [aggregatedStats, sortConfig]);

  // Optimization: Pre-calculate jerseyMap to avoid O(P) lookup for every marker in the render loop.
  const shotChartJerseyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber ?? "");
    }
    return map;
  }, [teamPlayers]);

  /**
   * ⚡ Bolt: Consolidate statistical loops.
   * Performance: Merge filteredStats and shotChartMarkers into a single optimized pass.
   */
  const derivedStats = useMemo(() => {
    const filtered = [];
    const markers = [];
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const playerMatch =
        selectedPlayerId === "ALL" || s.playerId === selectedPlayerId;
      const typeMatch = selectedType === "ALL" || s.type === selectedType;
      const qualityMatch =
        selectedQuality === "ALL" || s.shotQuality === selectedQuality;
      const breakdownMatch =
        selectedBreakdown === "ALL" || s.breakdownReason === selectedBreakdown;
      const playMatch =
        selectedPlay === "ALL" || (s.playName && s.playName === selectedPlay);
      if (
        playerMatch &&
        typeMatch &&
        playMatch &&
        qualityMatch &&
        breakdownMatch
      ) {
        filtered.push(s);
        if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
          markers.push({
            id: s.id,
            x: s.locationX || 0,
            y: s.locationY || 0,
            type: s.type as "MAKE" | "MISS",
            label:
              s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT
                ? shotChartJerseyMap.get(s.playerId)
                : undefined,
            playerId: s.playerId,
          });
        }
      }
    }
    return { filtered, markers };
  }, [
    stats,
    selectedPlayerId,
    selectedType,
    selectedQuality,
    selectedBreakdown,
    selectedPlay,
    shotChartJerseyMap,
  ]);

  const shotChartMarkers = derivedStats.markers;

  const getHeatmapDataForPeriod = useCallback(
    (pFilter: string) => {
      const periodStats =
        pFilter === "ALL"
          ? allStats
          : allStats.filter((s) => s.period === parseInt(pFilter));

      const data: Record<string, { makes: number; attempts: number }> = {};
      for (let i = 0; i < periodStats.length; i++) {
        const s = periodStats[i];
        if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS)
          continue;
        if (selectedPlayerId !== "ALL" && s.playerId !== selectedPlayerId)
          continue;
        if (selectedType !== "ALL" && s.type !== selectedType) continue;
        if (selectedQuality !== "ALL" && s.shotQuality !== selectedQuality)
          continue;
        if (selectedPlay !== "ALL" && s.playName !== selectedPlay) continue;

        const zone = getShotZone(s.locationX || 0, s.locationY || 0);
        if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
        data[zone].attempts++;
        if (s.type === ACTION_TYPES.MAKE) data[zone].makes++;
      }
      return data;
    },
    [allStats, selectedPlayerId, selectedType, selectedPlay, selectedQuality],
  );

  const heatmapData = useMemo(
    () => getHeatmapDataForPeriod(periodFilter),
    [getHeatmapDataForPeriod, periodFilter],
  );

  const heatmapData1 = useMemo(
    () => getHeatmapDataForPeriod(comparePeriod1),
    [getHeatmapDataForPeriod, comparePeriod1],
  );
  const heatmapData2 = useMemo(
    () => getHeatmapDataForPeriod(comparePeriod2),
    [getHeatmapDataForPeriod, comparePeriod2],
  );

  const scoreFlowData = useMemo(() => {
    return calculateScoreFlow(scoreFlowSortedStats, game?.periodLength);
  }, [scoreFlowSortedStats, game?.periodLength]);

  const oppData = useMemo(() => {
    return calculateOpponentAggregates(stats);
  }, [stats]);

  const teamData = useMemo(() => {
    let fga = 0;
    let fta = 0;
    let turnovers = 0;
    let oreb = 0;
    let points = 0;

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (s.deletedAt || s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) continue;

      if (s.type === ACTION_TYPES.MAKE) {
        points += s.points || 0;
        if (s.points === 1) fta++;
        else fga++;
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) fta++;
        else fga++;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        turnovers++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        oreb++;
      }
    }

    const possessions = calculatePossessions(fga, fta, turnovers, oreb);
    return {
      points,
      possessions,
      ppp: calculatePpp(points, possessions),
    };
  }, [stats]);

  const playEfficiency = useMemo(() => {
    const data: Record<
      string,
      { makes: number; attempts: number; points: number }
    > = {};
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) &&
        s.playName
      ) {
        if (!data[s.playName])
          data[s.playName] = { makes: 0, attempts: 0, points: 0 };
        data[s.playName].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.playName].makes++;
          data[s.playName].points += s.points || 0;
        }
      }
    }
    return Object.entries(data).map(([name, stats]) => ({
      name,
      ...stats,
      efg:
        stats.attempts > 0
          ? ((stats.points / stats.attempts / 2) * 100).toFixed(1)
          : "0.0",
    }));
  }, [stats]);

  const processEfficiency = useMemo(() => {
    const data: Record<
      string,
      { makes: number; attempts: number; points: number }
    > = {
      [SHOT_QUALITY.OPEN]: { makes: 0, attempts: 0, points: 0 },
      [SHOT_QUALITY.CONTESTED]: { makes: 0, attempts: 0, points: 0 },
    };

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) &&
        s.shotQuality &&
        data[s.shotQuality]
      ) {
        data[s.shotQuality].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.shotQuality].makes++;
          data[s.shotQuality].points += s.points || 0;
        }
      }
    }

    return Object.entries(data).map(([quality, stats]) => ({
      quality,
      ...stats,
      efg:
        stats.attempts > 0
          ? ((stats.points / stats.attempts / 2) * 100).toFixed(1)
          : "0.0",
    }));
  }, [stats]);

  const shotClockEfficiency = useMemo(() => {
    const data: Record<
      string,
      { makes: number; attempts: number; points: number }
    > = {
      EARLY: { makes: 0, attempts: 0, points: 0 },
      MID: { makes: 0, attempts: 0, points: 0 },
      LATE: { makes: 0, attempts: 0, points: 0 },
    };

    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) &&
        s.shotClockPhase &&
        data[s.shotClockPhase]
      ) {
        data[s.shotClockPhase].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.shotClockPhase].makes++;
          data[s.shotClockPhase].points += s.points || 0;
        }
      }
    }

    return Object.entries(data).map(([phase, stats]) => ({
      phase,
      ...stats,
      efg:
        stats.attempts > 0
          ? ((stats.points / stats.attempts / 2) * 100).toFixed(1)
          : "0.0",
    }));
  }, [stats]);

  const lineupStats = useMemo(() => {
    return calculateLineupStats(scoreFlowSortedStats, {
      isSorted: true,
      periodLength: game?.periodLength,
      clutchOnly: clutchFilter,
      periodType: team?.periodType,
      liveContext:
        game && !game.completed
          ? { clockTime: game.clockTime || 0, period: game.currentPeriod || 1 }
          : undefined,
    });
  }, [scoreFlowSortedStats, game, clutchFilter, team?.periodType]);

  const onOffStats = useMemo(() => {
    return calculateOnOffStats(
      scoreFlowSortedStats,
      players as { id: string; name: string }[],
    );
  }, [scoreFlowSortedStats, players]);

  const matchupStats = useMemo(() => {
    return calculateMatchupStats(
      scoreFlowSortedStats,
      players as { id: string; name: string }[],
      shotChartJerseyMap,
    );
  }, [scoreFlowSortedStats, players, shotChartJerseyMap]);

  const defensiveStats = useMemo(() => {
    return calculateStopsAndKills(scoreFlowSortedStats);
  }, [scoreFlowSortedStats]);

  const defensiveIntegrity = useMemo(() => {
    return calculateDefensiveIntegrity(allStats);
  }, [allStats]);

  const individualDefensiveBreakdown = useMemo(() => {
    return calculateIndividualDefensiveBreakdown(
      allStats,
      players as Player[],
      shotChartJerseyMap,
    );
  }, [allStats, players, shotChartJerseyMap]);

  const specialtyExecution = useMemo(() => {
    return calculateSituationalStats(allStats, teamData.ppp);
  }, [allStats, teamData.ppp]);

  const assistNetwork = useMemo(() => {
    return calculateAssistNetwork(scoreFlowSortedStats);
  }, [scoreFlowSortedStats]);

  const shotROI = useMemo(() => {
    return calculateShotROI(allStats);
  }, [allStats]);

  const paintTouchStats = useMemo(() => {
    return calculatePaintTouchStats(allStats);
  }, [allStats]);

  const opponentPlayTypeEfficiency = useMemo(() => {
    const data: Record<
      string,
      {
        makes: number;
        attempts: number;
        points: number;
        fta: number;
        turnovers: number;
        threePM: number;
      }
    > = {};

    for (let i = 0; i < allStats.length; i++) {
      const s = allStats[i];
      if (
        s.deletedAt ||
        !s.opponentPlayType ||
        !s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
      )
        continue;

      if (!data[s.opponentPlayType]) {
        data[s.opponentPlayType] = {
          makes: 0,
          attempts: 0,
          points: 0,
          fta: 0,
          turnovers: 0,
          threePM: 0,
        };
      }

      const play = data[s.opponentPlayType];
      if (s.type === ACTION_TYPES.MAKE) {
        play.points += s.points || 0;
        if (s.points === 1) {
          play.fta++;
        } else {
          play.makes++;
          play.attempts++;
          if (s.points === 3) {
            play.threePM++;
          }
        }
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) {
          play.fta++;
        } else {
          play.attempts++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        play.turnovers++;
      }
    }

    return Object.entries(data)
      .map(([type, s]) => {
        const possessions = calculatePossessions(
          s.attempts,
          s.fta,
          s.turnovers,
          0,
        );
        return {
          type,
          attempts: s.attempts,
          points: s.points,
          ppp: calculatePpp(s.points, possessions),
          efg:
            s.attempts > 0
              ? (((s.makes + 0.5 * s.threePM) / s.attempts) * 100).toFixed(1)
              : "0.0",
        };
      })
      .sort((a, b) => b.attempts - a.attempts);
  }, [allStats]);

  const practiceFocusAreas = useMemo(() => {
    if (!teamSeasonStats || !teamData) return [];
    // Calculate current game rates
    const ftAttempts = stats.filter(
      (s) =>
        s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT &&
        s.points === 1 &&
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS),
    ).length;
    const ftMakes = stats.filter(
      (s) =>
        s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT &&
        s.points === 1 &&
        s.type === ACTION_TYPES.MAKE,
    ).length;
    const gameFtPct = ftAttempts > 0 ? (ftMakes / ftAttempts) * 100 : 0;

    const gameTurnoverRate =
      teamData.possessions > 0
        ? (stats.filter(
            (s) =>
              s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT &&
              s.type === ACTION_TYPES.TURNOVER,
          ).length /
            teamData.possessions) *
          100
        : 0;

    // Approximate OREB%
    const teamOreb = stats.filter(
      (s) =>
        s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT &&
        s.type === ACTION_TYPES.OFF_REBOUND,
    ).length;
    const oppDreb = stats.filter(
      (s) =>
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT &&
        s.type === ACTION_TYPES.DEF_REBOUND,
    ).length;
    const gameOrebPct =
      teamOreb + oppDreb > 0 ? (teamOreb / (teamOreb + oppDreb)) * 100 : 0;

    return generatePracticePrescription({
      gameStats: playerAggregates,
      teamStats: {
        ftPct: gameFtPct.toFixed(1),
        turnoverRate: gameTurnoverRate.toFixed(1),
        orebPct: gameOrebPct.toFixed(1),
      },
      seasonAverages: {
        ftPct: teamSeasonStats.ftPct || "70.0",
        turnoverRate: teamSeasonStats.turnoverRate || "15.0",
        orebPct: teamSeasonStats.orebPct || "25.0",
      },
    });
  }, [teamSeasonStats, teamData, stats, playerAggregates]);

  const handleDeleteGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      logger.error("Failed to delete game:", err);
    }
  };

  const handleRestoreGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, { deletedAt: undefined, synced: 0 });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to restore game:", err);
    }
  };

  const handleUpdateGame = async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, {
        opponent: editOpponent,
        date: editDate,
        time: editTime,
        location: editLocation,
        opponentLogoUrl: editOpponentLogoUrl,
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpenEditDialog(false);
    } catch (err) {
      logger.error("Failed to update game:", err);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("game-stats-container");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BoxScore_${team?.name}_vs_${game?.opponent}_${game?.date}.pdf`);
    } catch (err) {
      logger.error("Failed to export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
  const maxPeriod = team?.periodType === "HALVES" ? 2 : 4;
  const periods = useMemo(() => {
    // ⚡ Bolt: Extract unique OT periods in a single optimized pass.
    // This replaces a heavy filter/map/Set chain with a simple, high-performance loop.
    const list = ["ALL"];
    for (let i = 1; i <= maxPeriod; i++) list.push(i.toString());

    const otPeriodsSet = new Set<number>();
    for (let i = 0; i < allStats.length; i++) {
      const p = allStats[i].period;
      if (p > maxPeriod) otPeriodsSet.add(p);
    }

    const otPeriods = Array.from(otPeriodsSet).sort((a, b) => a - b);
    for (let i = 0; i < otPeriods.length; i++) {
      list.push(otPeriods[i].toString());
    }

    return list;
  }, [maxPeriod, allStats]);

  const boxScoreTable = (
    <BoxScoreSection
      playerAggregates={playerAggregates}
      teamData={teamData}
      oppData={oppData}
      sortConfig={sortConfig}
      handleSort={handleSort}
    />
  );
  const shotChartFilters = (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="subtitle2">Filters</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={compareMode ? "contained" : "outlined"}
            onClick={() => setCompareMode(!compareMode)}
            sx={{ fontSize: "0.7rem" }}
          >
            Compare
          </Button>
          <ToggleButtonGroup
            value={shotChartView}
            exclusive
            onChange={(_, val) => val && setShotChartView(val)}
            size="small"
          >
            <ToggleButton value="markers">Markers</ToggleButton>
            <ToggleButton value="heatmap">Heatmap</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Player</InputLabel>
          <Select
            value={selectedPlayerId}
            label="Player"
            onChange={(e) => setSelectedPlayerId(e.target.value)}
          >
            <MenuItem value="ALL">All Players</MenuItem>
            {players.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <MenuItem value="ALL">All Shots</MenuItem>
            <MenuItem value={ACTION_TYPES.MAKE}>Makes</MenuItem>
            <MenuItem value={ACTION_TYPES.MISS}>Misses</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Quality</InputLabel>
          <Select
            value={selectedQuality}
            label="Quality"
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            <MenuItem value="ALL">All Qualities</MenuItem>
            <MenuItem value={SHOT_QUALITY.OPEN}>Open</MenuItem>
            <MenuItem value={SHOT_QUALITY.CONTESTED}>Contested</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Breakdown</InputLabel>
          <Select
            value={selectedBreakdown}
            label="Breakdown"
            onChange={(e) => setSelectedBreakdown(e.target.value)}
          >
            <MenuItem value="ALL">All Breakdowns</MenuItem>
            {Object.values(BREAKDOWN_REASONS).map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {team?.playbook && team.playbook.length > 0 && (
          <FormControl fullWidth size="small">
            <InputLabel>Play</InputLabel>
            <Select
              value={selectedPlay}
              label="Play"
              onChange={(e) => setSelectedPlay(e.target.value)}
            >
              <MenuItem value="ALL">All Plays</MenuItem>
              {team.playbook.map((play) => (
                <MenuItem key={play} value={play}>
                  {play}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Box>
  );

  const shotChartCourt = (
    <BasketballCourt
      markers={shotChartView === "markers" ? shotChartMarkers : []}
      heatmapData={shotChartView === "heatmap" ? heatmapData : undefined}
      onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
    />
  );

  const scoreFlowChart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={scoreFlowData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" />
        <YAxis yAxisId="spread" orientation="left" />
        <YAxis
          yAxisId="ppp"
          orientation="right"
          domain={[0, 2]}
          label={{ value: "PPP", angle: -90, position: "insideRight" }}
        />
        <Tooltip content={<ScoreFlowTooltip />} />
        <Legend />
        <ReferenceLine
          yAxisId="spread"
          y={0}
          stroke="#666"
          strokeWidth={2}
          label="Neutral"
        />

        {/* Lead Shading: Blue for Our Team leading, Red for Opponent leading */}
        <ReferenceArea
          yAxisId="spread"
          y1={0}
          y2={100}
          fill={theme.palette.primary.main}
          fillOpacity={0.05}
        />
        <ReferenceArea
          yAxisId="spread"
          y1={-100}
          y2={0}
          fill={theme.palette.secondary.main}
          fillOpacity={0.05}
        />

        {/* Period boundaries */}
        {(() => {
          const lines = [];
          const periodLen = game?.periodLength || 10;
          const totalTime =
            (allStats[allStats.length - 1]?.period || 4) * periodLen;
          for (let m = periodLen; m < totalTime; m += periodLen) {
            lines.push(
              <ReferenceLine
                key={m}
                x={`${m}:00`}
                stroke="rgba(0,0,0,0.2)"
                strokeDasharray="5 5"
                label={{ value: `P${m / periodLen + 1}`, position: "top" }}
              />,
            );
          }
          return lines;
        })()}

        {/* Timeouts */}
        {scoreFlowData
          .filter((d) => d.event === ACTION_TYPES.TIMEOUT)
          .map((d, idx) => (
            <ReferenceLine
              key={`to-${idx}`}
              x={d.time}
              stroke={theme.palette.warning.main}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

        <Area
          yAxisId="spread"
          type="stepAfter"
          dataKey="Spread"
          stroke={theme.palette.primary.main}
          fill={theme.palette.primary.main}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Line
          yAxisId="ppp"
          type="monotone"
          dataKey="teamPpp"
          name="Team PPP"
          stroke={theme.palette.primary.main}
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          yAxisId="ppp"
          type="monotone"
          dataKey="oppPpp"
          name="Opp PPP"
          stroke={theme.palette.secondary.main}
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          yAxisId="spread"
          type="stepAfter"
          dataKey="Team"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
          hide
        />
        <Line
          yAxisId="spread"
          type="stepAfter"
          dataKey="Opponent"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={false}
          hide
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const lineupTable = (
    <TableContainer component={Box}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableCell sx={{ fontWeight: 700 }}>Lineup</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              MIN
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              PTS FOR
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              PTS AGN
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              NET/40
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              +/-
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineupStats.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  {row.lineup.map((pId) => (
                    <Avatar
                      key={pId}
                      sx={{ width: 24, height: 24, fontSize: "0.65rem" }}
                    >
                      {shotChartJerseyMap.get(pId) ?? "??"}
                    </Avatar>
                  ))}
                </Stack>
              </TableCell>
              <TableCell align="right">
                {(row.seconds / 60).toFixed(1)}
              </TableCell>
              <TableCell align="right">{row.pointsFor}</TableCell>
              <TableCell align="right">{row.pointsAgainst}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {row.netRatingPer40}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color:
                    row.netRating > 0
                      ? "success.main"
                      : row.netRating < 0
                        ? "error.main"
                        : "inherit",
                }}
              >
                {row.netRating > 0 ? `+${row.netRating}` : row.netRating}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

  return (
    <Box
      id="game-stats-container"
      sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1, bgcolor: "white" }}
    >
      <EntityBanner
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date ? dayjs(game.date).format("MM-DD-YYYY") : ""} ${game?.time || ""} | ${game?.location || ""}`}
        avatarSrc={game?.opponentLogoUrl}
        avatarColor="rgba(255,255,255,0.1)"
        backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
        primaryColor={team?.primaryColor}
        stats={[
          { label: "PPP", value: teamData.ppp },
          { label: "Def. PPP", value: oppData.ppp },
        ]}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {!isDeleted && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PracticeIcon />}
                  onClick={() => setIsPracticePlannerOpen(true)}
                  sx={{ bgcolor: "success.main", color: "white" }}
                >
                  Practice Planner
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
              </Stack>
            )}
            {!isDeleted ? (
              <IconButton
                onClick={() => setOpenEditDialog(true)}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            ) : game?.deletedAt && !team?.deletedAt ? (
              <Button
                startIcon={<Restore />}
                variant="contained"
                color="success"
                onClick={handleRestoreGame}
              >
                Restore Game
              </Button>
            ) : null}
          </Stack>
        }
      />

      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mt: 3 }}>
          <AlertTitle>Read Only Mode</AlertTitle>
          {game?.deletedAt
            ? `This game is scheduled for deletion in ${timeLeft}.`
            : "The associated team is pending deletion."}
        </Alert>
      )}

      <Box
        sx={{
          mb: 4,
          mt: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_, val) => val && setActiveTab(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="standard">Standard</ToggleButton>
            <ToggleButton value="impact">Impact (On/Off)</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={periodFilter}
            exclusive
            onChange={(_, val) => val && setPeriodFilter(val)}
            size="small"
            fullWidth={Boolean(isMobile)}
            sx={{ flexGrow: isMobile ? 1 : 0 }}
          >
            {periods.map((p) => (
              <ToggleButton key={p} value={p}>
                {p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <ToggleButton
          value="clutch"
          selected={clutchFilter}
          onChange={() => setClutchFilter(!clutchFilter)}
          size="small"
          color="primary"
          sx={{
            fontWeight: 800,
            px: 3,
            bgcolor: clutchFilter ? "primary.main" : "transparent",
            color: clutchFilter ? "white" : "primary.main",
            "&:hover": {
              bgcolor: clutchFilter
                ? "primary.dark"
                : "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          🔥 CLUTCH MODE
        </ToggleButton>
      </Box>

      <Grid container spacing={3}>
        {activeTab === "impact" && (
          <Grid size={{ xs: 12 }}>
            <MoleskineCard>
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", mb: 2 }}
              >
                Team Impact Analytics (On/Off)
              </Typography>
              <OnOffImpactTable data={onOffStats} />
            </MoleskineCard>
          </Grid>
        )}

        {activeTab === "impact" && (
          <Grid size={{ xs: 12 }}>
            <MoleskineCard>
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", mb: 2 }}
              >
                Matchup Accountability (Points Allowed)
              </Typography>
              <TableContainer component={Box}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Opponent</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Primary Defender
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        PTS Allowed
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Stops
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Stop %
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchupStats.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>Opponent #{m.opponentJersey}</TableCell>
                        <TableCell>{m.defenderName}</TableCell>
                        <TableCell align="right">{m.pointsAllowed}</TableCell>
                        <TableCell align="right">{m.stops}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {m.stopPct}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {matchupStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No matchup data recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </MoleskineCard>
          </Grid>
        )}

        {/* Defensive Metrics Card */}
        <Grid size={{ xs: 12 }}>
          <MoleskineCard>
            <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
              Defensive Metrics
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  >
                    {defensiveStats.totalStops}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    TOTAL STOPS
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    color="secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    {defensiveStats.totalKills}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    KILLS (3x STOPS)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {defensiveStats.currentStreak}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    CURRENT STOP STREAK
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </MoleskineCard>
        </Grid>

        {/* Box Score Card */}
        <Grid size={{ xs: 12 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Box Score{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("boxScore")}
                aria-label="Expand Box Score section"
                title="Expand section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {boxScoreTable}
          </MoleskineCard>
        </Grid>

        {/* Shot Chart Card */}
        <Grid size={{ xs: 12, md: compareMode ? 12 : 6 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                {compareMode ? "Tactical Comparison" : "Shot Chart"}{" "}
                {!compareMode &&
                  periodFilter !== "ALL" &&
                  `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("shotChart")}
                aria-label="Expand Shot Chart section"
                title="Expand section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {shotChartFilters}

            {compareMode ? (
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  overflowX: isMobile ? "auto" : "visible",
                  scrollSnapType: isMobile ? "x mandatory" : "none",
                  pb: 1,
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {[
                  {
                    id: 1,
                    p: comparePeriod1,
                    setP: setComparePeriod1,
                    data: heatmapData1,
                  },
                  {
                    id: 2,
                    p: comparePeriod2,
                    setP: setComparePeriod2,
                    data: heatmapData2,
                  },
                ].map((court) => (
                  <Box
                    key={court.id}
                    sx={{
                      minWidth: isMobile ? "100%" : "calc(50% - 8px)",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {periodLabel} {court.p}
                      </Typography>
                      <Select
                        size="small"
                        value={court.p}
                        onChange={(e) => court.setP(e.target.value)}
                        sx={{ height: 30, fontSize: "0.8rem" }}
                      >
                        {periods
                          .filter((p) => p !== "ALL")
                          .map((p) => (
                            <MenuItem key={p} value={p}>
                              {periodLabel} {p}
                            </MenuItem>
                          ))}
                      </Select>
                    </Stack>
                    <BasketballCourt
                      heatmapData={
                        shotChartView === "heatmap" ? court.data : undefined
                      }
                      markers={
                        shotChartView === "markers"
                          ? shotChartMarkers.filter(
                              (m) =>
                                allStats.find((s) => s.id === m.id)?.period ===
                                parseInt(court.p),
                            )
                          : []
                      }
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ p: 1 }}>{shotChartCourt}</Box>
            )}

            {compareMode && isMobile && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center", mt: 1 }}
              >
                ← Swipe to compare →
              </Typography>
            )}
          </MoleskineCard>
        </Grid>

        {/* Score Flow Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Score Flow{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("scoreFlow")}
                aria-label="Expand Score Flow section"
                title="Expand section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 400 }}>{scoreFlowChart}</Box>
          </MoleskineCard>
        </Grid>

        {/* Efficiency Analytics Card */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Individual Defensive Accountability
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Defender</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PTS Agn
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Primary Breakdown
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {individualDefensiveBreakdown.map((row) => (
                        <TableRow key={row.playerId}>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center" }}
                            >
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {row.jerseyNumber}
                              </Avatar>
                              <Typography variant="body2">
                                {row.playerName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {row.pointsAllowed}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.primaryReason}
                              size="small"
                              variant="outlined"
                              color={
                                row.primaryReason === "Great Contest"
                                  ? "success"
                                  : "error"
                              }
                              sx={{ fontSize: "0.65rem", height: 20 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {individualDefensiveBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No defensive breakdown data.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Rim Pressure (Paint Touches)
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Paint touches correlate rim pressure with offensive
                    efficiency. PPPT measures points generated within 15s of a
                    paint touch.
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      {paintTouchStats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      TOTAL TOUCHES
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 900, color: "success.main" }}
                    >
                      {paintTouchStats.pppt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PPPT
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  EFFICIENCY MULTIPLIER:{" "}
                  {(
                    parseFloat(paintTouchStats.pppt) /
                    (parseFloat(teamData.ppp) || 1)
                  ).toFixed(2)}
                  x
                </Typography>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Process Report (ROI)
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    This report compares actual scoring against Expected Points
                    (xPTS) based on shot location and quality.
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      {shotROI.totalPoints}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ACTUAL PTS
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 900, color: "primary.main" }}
                    >
                      {shotROI.totalXPts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      EXPECTED PTS
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      color:
                        parseFloat(shotROI.roi) >= 0
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {parseFloat(shotROI.roi) > 0 ? "+" : ""}
                    {Math.round(parseFloat(shotROI.roi) * 100)}%
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    SHOT ROI
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {parseFloat(shotROI.roi) >= 0
                      ? "Over-performing relative to shot quality."
                      : "Under-performing relative to shot quality."}
                  </Typography>
                </Box>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Assist Network (Chemistry)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          CONNECTION
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          FREQ
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          PTS
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assistNetwork.edges
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5)
                        .map((edge, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                              >
                                <Avatar
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    fontSize: "0.6rem",
                                  }}
                                >
                                  {shotChartJerseyMap.get(edge.passerId) ||
                                    "??"}
                                </Avatar>
                                <Typography variant="caption">→</Typography>
                                <Avatar
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    fontSize: "0.6rem",
                                  }}
                                >
                                  {shotChartJerseyMap.get(edge.finisherId) ||
                                    "??"}
                                </Avatar>
                              </Stack>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {edge.count}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {edge.points}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              {edge.efg}%
                            </TableCell>
                          </TableRow>
                        ))}
                      {assistNetwork.edges.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No assists recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {assistNetwork.primaryPlaymakerId && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: "rgba(0,0,0,0.02)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ display: "block", fontWeight: 800 }}
                    >
                      PRIMARY PLAYMAKER: #
                      {shotChartJerseyMap.get(assistNetwork.primaryPlaymakerId)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", fontWeight: 800 }}
                    >
                      PRIMARY FINISHER: #
                      {shotChartJerseyMap.get(assistNetwork.primaryFinisherId)}
                    </Typography>
                  </Box>
                )}
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Opponent Play Types
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          TYPE
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          PPP
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opponentPlayTypeEfficiency.map((row) => (
                        <TableRow key={row.type}>
                          <TableCell
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {row.type}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.ppp}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.efg}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {opponentPlayTypeEfficiency.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No play types recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Shot Rhythm (Clock)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Phase</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Freq
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PTS
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shotClockEfficiency.map((p) => (
                        <TableRow key={p.phase}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {p.phase}
                          </TableCell>
                          <TableCell align="right">{p.attempts}</TableCell>
                          <TableCell align="right">{p.points}</TableCell>
                          <TableCell align="right">{p.efg}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Process Efficiency
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Quality</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Freq
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PTS
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {processEfficiency.map((p) => (
                        <TableRow key={p.quality}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {p.quality}
                          </TableCell>
                          <TableCell align="right">{p.attempts}</TableCell>
                          <TableCell align="right">{p.points}</TableCell>
                          <TableCell align="right">{p.efg}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Play Efficiency
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Play</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Freq
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PTS
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {playEfficiency.map((play) => (
                        <TableRow key={play.name}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {play.name}
                          </TableCell>
                          <TableCell align="right">{play.attempts}</TableCell>
                          <TableCell align="right">{play.points}</TableCell>
                          <TableCell align="right">{play.efg}%</TableCell>
                        </TableRow>
                      ))}
                      {playEfficiency.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No play-tagged shots recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                    Defensive Integrity
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setIsDefensiveIntegrityOpen(true)}
                  >
                    View Report
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          REASON
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          PTS
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          %
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {defensiveIntegrity.slice(0, 5).map((row) => (
                        <TableRow key={row.reason}>
                          <TableCell
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {row.reason}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.points}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {defensiveIntegrity.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No breakdown data recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                    Lineup Efficiency
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setIsAuditDialogOpen(true)}
                      startIcon={<Restore />}
                    >
                      Audit Subs
                    </Button>
                    <IconButton
                      onClick={() => setExpandedSection("lineups")}
                      aria-label="Expand Lineup Efficiency section"
                      title="Expand section"
                    >
                      <ExpandIcon />
                    </IconButton>
                  </Stack>
                </Box>
                {lineupTable}
              </MoleskineCard>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MoleskineCard>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  Specialty Execution
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          SITUATION
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          PPP
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          Δ
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          SUCCESS %
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                        >
                          eFG%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {specialtyExecution.map((row) => (
                        <TableRow key={row.situation}>
                          <TableCell
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {row.situation}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.ppp}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color:
                                parseFloat(row.delta || "0") > 0
                                  ? "success.main"
                                  : parseFloat(row.delta || "0") < 0
                                    ? "error.main"
                                    : "inherit",
                            }}
                          >
                            {parseFloat(row.delta || "0") > 0 ? "+" : ""}
                            {row.delta}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.successRate}%
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            {row.efg}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {specialtyExecution.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No situational plays recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Expanded Section Dialog */}
      <Dialog
        fullWidth
        maxWidth="lg"
        open={expandedSection !== null}
        onClose={() => setExpandedSection(null)}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--serif)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {expandedSection === "boxScore" && "Box Score"}
          {expandedSection === "shotChart" && "Shot Chart"}
          {expandedSection === "scoreFlow" && "Score Flow"}
          {expandedSection === "lineups" && "Lineup Efficiency"}
          <IconButton
            onClick={() => setExpandedSection(null)}
            aria-label="Collapse section"
          >
            <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {expandedSection === "boxScore" && boxScoreTable}
          {expandedSection === "shotChart" && (
            <>
              {shotChartFilters}
              <Box sx={{ p: 1, maxWidth: 800, mx: "auto" }}>
                {shotChartCourt}
              </Box>
            </>
          )}
          {expandedSection === "scoreFlow" && (
            <Box sx={{ height: 500 }}>{scoreFlowChart}</Box>
          )}
          {expandedSection === "lineups" && lineupTable}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedSection(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {gameId && (
        <SubstitutionAuditDialog
          open={isAuditDialogOpen}
          onClose={() => setIsAuditDialogOpen(false)}
          gameId={gameId}
          players={players}
          jerseyMap={shotChartJerseyMap}
        />
      )}

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--serif)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Edit Game Details
          <IconButton
            color="error"
            onClick={() => {
              setOpenEditDialog(false);
              setIsDeleteDialogOpen(true);
            }}
            aria-label="Delete game"
            title="Delete game"
          >
            <Delete />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Opponent"
              value={editOpponent}
              onChange={(e) => setEditOpponent(e.target.value)}
            />
            <TextField
              fullWidth
              label="Opponent Logo URL"
              value={editOpponentLogoUrl}
              onChange={(e) => setEditOpponentLogoUrl(e.target.value)}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />
            <TextField
              fullWidth
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateGame} variant="contained" sx={{ ml: 1 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isPracticePlannerOpen}
        onClose={() => setIsPracticePlannerOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", fontWeight: 800 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <PracticeIcon color="success" />
            <span>Practice Prescription Engine</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Based on this game's statistical failures compared to your season
            averages, the following focus areas and drills are recommended for
            your next practice.
          </Typography>

          <Stack spacing={2}>
            {practiceFocusAreas.length > 0 ? (
              practiceFocusAreas.map((area, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "rgba(0,0,0,0.02)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: "error.main" }}
                    >
                      {area.metric}: {area.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Season Avg: {area.average}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    DRILL: {area.drill}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    {area.description}
                  </Typography>
                </Box>
              ))
            ) : (
              <Alert severity="success">
                Great performance! No major statistical deviations detected
                requiring specialized drills.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsPracticePlannerOpen(false)}>Close</Button>
          <Button variant="contained" color="success">
            Export to Practice PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDefensiveIntegrityOpen}
        onClose={() => setIsDefensiveIntegrityOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", fontWeight: 800 }}>
          Defensive Integrity Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Breakdown of points allowed by tactical error category. Use this to
            identify your most frequent defensive "weak links."
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>REASON</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    FREQ
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    PTS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    % OF TOTAL
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defensiveIntegrity.map((row) => (
                  <TableRow key={row.reason}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.reason}</TableCell>
                    <TableCell align="right">{row.frequency}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.points}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 900,
                        color:
                          parseFloat(row.percentage) > 30
                            ? "error.main"
                            : "inherit",
                      }}
                    >
                      {row.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDefensiveIntegrityOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Delete Game?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this game? You will have 24 hours to
            restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
