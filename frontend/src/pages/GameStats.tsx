import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
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
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Warning,
  Edit as EditIcon,
  Scale as BalanceIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  School as ClinicIcon,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { LockerRoomClinic } from "./GameStats/LockerRoomClinic";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import { getShotZone } from "../utils/shotZones";
import { db, StatEvent, TeamPlayer } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
  PLAY_TYPES,
} from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  calculateLineupStats,
  calculateStopsAndKills,
  calculateMatchupStats,
  calculatePlayerStintTimeline,
  calculateScoringRuns,
  calculateTeamAggregates,
  calculateTeamSeasonAverages,
  generatePlayerNarrative,
  calcPct,
  isOpponentId,
  type ScoreFlowPoint,
  type PlayerAggregates,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import FourFactorsHUD from "../components/FourFactorsHUD";
import EntityBanner from "../components/EntityBanner";
import RecentActionItem from "../components/RecentActionItem";
import TacticalGoalHUD from "../components/TacticalGoalHUD";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SortableHeader from "../components/SortableHeader";
import { formatClock } from "../utils/mathUtils";
import { generateHudlCSV, generateSynergyCSV, downloadCSV } from "../utils/videoExport";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
} from "recharts";

/**
 * 🏀 Assistant Coach: PlayerFeedbackCard
 * WHY: Displays automated performance narratives to players.
 */
const PlayerFeedbackCard: React.FC<{
  player: PlayerAggregates;
  narrative: { strength: string; growth: string };
}> = ({ player, narrative }) => {
  const [sent, setSent] = useState(false);

  return (
    <MoleskineCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: player.avatarColor }}>{player.jerseyNumber}</Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {player.name}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="caption" color="success.main" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
          Strength
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, mt: 0.5, fontWeight: 500 }}>
          {narrative.strength}
        </Typography>

        <Typography variant="caption" color="error.main" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
          Growth Area
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
          {narrative.growth}
        </Typography>
      </Box>

      <Button
        variant={sent ? "contained" : "outlined"}
        color={sent ? "success" : "primary"}
        size="small"
        fullWidth
        sx={{ mt: 3 }}
        onClick={() => setSent(true)}
        startIcon={sent ? <ExpandIcon sx={{ transform: "rotate(90deg)" }} /> : null}
      >
        {sent ? "Sent to Player" : "Approve & Send"}
      </Button>
    </MoleskineCard>
  );
};

/**
 * 🏀 Assistant Coach: OfficiatingImpactSummary
 * WHY: Visualizes how foul distribution and free-throw scoring influenced the outcome.
 */
const OfficiatingImpactSummary: React.FC<{
  stats: StatEvent[];
  teamScore: number;
  oppScore: number;
  teamPlayers: TeamPlayer[];
}> = ({ stats, teamScore, oppScore, teamPlayers }) => {
  const officiatingImpact = useMemo(() => {
    const teamFTM = stats.filter(s => s.type === ACTION_TYPES.MAKE && s.points === 1 && !isOpponentId(s.playerId)).length;
    const oppFTM = stats.filter(s => s.type === ACTION_TYPES.MAKE && s.points === 1 && isOpponentId(s.playerId)).length;

    const teamFoulEvents = stats.filter(s => s.type === ACTION_TYPES.FOUL && !isOpponentId(s.playerId));
    const oppFouls = stats.filter(s => s.type === ACTION_TYPES.FOUL && isOpponentId(s.playerId)).length;

    const starterIds = new Set<string>(teamPlayers.filter(tp => tp.isStarter).map(tp => tp.playerId));
    let starterFouls = 0;
    let benchFouls = 0;

    teamFoulEvents.forEach(s => {
      if (starterIds.has(s.playerId)) starterFouls++;
      else benchFouls++;
    });

    const teamFouls = teamFoulEvents.length;
    const ftDiff = teamFTM - oppFTM;
    const scoreDiff = teamScore - oppScore;
    const impactPct = scoreDiff !== 0 ? (ftDiff / Math.abs(scoreDiff)) * 100 : 0;

    return {
      teamFTM,
      oppFTM,
      teamFouls,
      oppFouls,
      starterFouls,
      benchFouls,
      ftDiff,
      impactPct
    };
  }, [stats, teamScore, oppScore, teamPlayers]);

  return (
    <MoleskineCard sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <BalanceIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Officiating Impact
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2, p: 2, bgcolor: "rgba(25, 118, 210, 0.04)", borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", display: "block", mb: 1 }}>
              TEAM FOUL ATTRIBUTION
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="space-around">
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{officiatingImpact.starterFouls}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Starters</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{officiatingImpact.benchFouls}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Bench</Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
              FOUL BATTLE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {officiatingImpact.teamFouls} <Typography component="span" variant="caption">VS</Typography> {officiatingImpact.oppFouls}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: officiatingImpact.teamFouls > officiatingImpact.oppFouls ? "error.main" : "success.main" }}>
              {officiatingImpact.teamFouls > officiatingImpact.oppFouls ? "Disadvantage" : "Advantage"}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
              FT MARGIN
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: officiatingImpact.ftDiff >= 0 ? "success.main" : "error.main" }}>
              {officiatingImpact.ftDiff >= 0 ? "+" : ""}{officiatingImpact.ftDiff}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Points from Line
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, border: "1px dashed rgba(0,0,0,0.1)", borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          💡 Tactical Insight
        </Typography>
        <Typography variant="caption" sx={{ lineHeight: 1.5, display: "block" }}>
          {officiatingImpact.ftDiff > 0
            ? `Our ability to draw fouls and convert at the line contributed ${officiatingImpact.ftDiff} points to our total. This margin was ${Math.abs(officiatingImpact.impactPct).toFixed(0)}% of the final point spread.`
            : `Opponent's free throw advantage (-${Math.abs(officiatingImpact.ftDiff)} pts) put significant pressure on our half-court defense. Defensive discipline should be a focus for next game.`
          }
        </Typography>
      </Box>
    </MoleskineCard>
  );
};

/**
 * ⚡ Bolt: PlayerStatRow
 * WHY: Memoizing individual rows prevents re-rendering all rows when only
 * one player's stats change or during time-scrubbing interactions.
 */
const PlayerStatRow = memo(({ row }: { row: PlayerAggregates }) => (
  <TableRow key={row.id}>
    <TableCell
      sx={{
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Avatar
        sx={{
          width: 24,
          height: 24,
          fontSize: "0.75rem",
          bgcolor: row.avatarColor,
        }}
      >
        {row.jerseyNumber}
      </Avatar>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        {row.name}
      </Typography>
    </TableCell>
    <TableCell align="right">{row.min}</TableCell>
    <TableCell align="right">{row.points}</TableCell>
    <TableCell align="right">
      {row.makes}-{row.attempts}
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.fgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.efgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.offRebounds}
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.defRebounds}
    </TableCell>
    <TableCell align="right">{row.rebounds}</TableCell>
    <TableCell align="right">{row.assists}</TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.steals}
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.blocks}
    </TableCell>
    <TableCell
      align="right"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.turnovers}
    </TableCell>
    <TableCell align="right">{row.fouls}</TableCell>
    <TableCell align="right">
      {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
    </TableCell>
  </TableRow>
));

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
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedQuality, setSelectedQuality] = useState<string>("ALL");
  const [selectedPlay, setSelectedPlay] = useState<string>("ALL");
  const [selectedOpponentPlay, setSelectedOpponentPlay] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod1, setComparePeriod1] = useState<string>("1");
  const [comparePeriod2, setComparePeriod2] = useState<string>("2");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [keyMomentsOnly, setKeyMomentsOnly] = useState(false);
  const [videoExportDialogOpen, setVideoExportDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [showFouls, setShowFouls] = useState(true);
  const [showRuns, setShowRuns] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isClinicMode, setIsClinicMode] = useState(false);
  const [copied, setCopied] = useState(false);
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
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ display: "block" }}>
                TEAM PPP
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data.teamPpp || "0.00"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
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

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as string)
        : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamPlayersResult = useLiveQuery(
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

  const playersResult = useLiveQuery(async () => {
    if (!teamPlayers.length) return [];
    // ⚡ Bolt: Fetch only players rostered on the team to reduce DB overhead.
    const playerIds = teamPlayers.map((tp) => tp.playerId.toString());
    return await db.players.where("id").anyOf(playerIds).toArray();
  }, [teamPlayers]);
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

  const allStatsResult = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.stats.where("gameId").equals(gameId).toArray()
        : Promise.resolve([]),
    [gameId],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

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
      const playMatch =
        selectedPlay === "ALL" || (s.playName && s.playName === selectedPlay);
      const oppPlayMatch =
        selectedOpponentPlay === "ALL" || (s.playType && s.playType === selectedOpponentPlay);
      if (playerMatch && typeMatch && playMatch && qualityMatch && oppPlayMatch) {
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
    selectedPlay,
    selectedOpponentPlay,
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
        if (selectedOpponentPlay !== "ALL" && s.playType !== selectedOpponentPlay) continue;

        const zone = getShotZone(s.locationX || 0, s.locationY || 0);
        if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
        data[zone].attempts++;
        if (s.type === ACTION_TYPES.MAKE) data[zone].makes++;
      }
      return data;
    },
    [allStats, selectedPlayerId, selectedType, selectedPlay, selectedOpponentPlay, selectedQuality],
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


  const teamData = useMemo(() => {
    if (!game) return null;
    return calculateTeamAggregates([game], stats, false);
  }, [game, stats]);

  const liveFourFactors = useMemo(() => {
    if (!teamData) return null;
    const oppEvents = stats.filter((s) => isOpponentId(s.playerId));
    const oppAgg = calculateOpponentAggregates(oppEvents);

    return {
      team: teamData,
      opponent: {
        ...oppAgg,
        orbPct: calcPct(oppAgg.offRebounds, oppAgg.offRebounds + teamData.dreb),
      },
    };
  }, [teamData, stats]);

  const oppData = useMemo(() => {
    return liveFourFactors?.opponent || calculateOpponentAggregates(stats);
  }, [stats, liveFourFactors]);

  const matchupStats = useMemo(() => {
    return calculateMatchupStats(scoreFlowSortedStats);
  }, [scoreFlowSortedStats]);

  const teamSeasonStats = useLiveQuery(async () => {
    if (!game?.teamId) return undefined;
    const games = await db.games.where("teamId").equals(game.teamId).toArray();
    const gameIds = games.map((g) => g.id!).filter(Boolean);
    const allStats = await db.stats.where("gameId").anyOf(gameIds).toArray();
    return calculateTeamSeasonAverages(games, allStats);
  }, [game?.teamId]);

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

  const opponentPlayEfficiency = useMemo(() => {
    const data: Record<
      string,
      { makes: number; attempts: number; points: number }
    > = {};
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) &&
        isOpponentId(s.playerId) &&
        s.playType
      ) {
        if (!data[s.playType])
          data[s.playType] = { makes: 0, attempts: 0, points: 0 };
        data[s.playType].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.playType].makes++;
          data[s.playType].points += s.points || 0;
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


  const playerStints = useMemo(() => {
    if (!game) return [];
    return calculatePlayerStintTimeline(scoreFlowSortedStats, {
      periodLength: team?.periodLength || 10,
    });
  }, [scoreFlowSortedStats, game, team]);

  const tacticalGoalStats = useMemo(() => {
    if (!liveFourFactors) return {};
    return {
      TO: liveFourFactors.team.turnovers,
      AST: liveFourFactors.team.assists,
      OREB: liveFourFactors.team.offRebounds,
      OPP_3PT: parseFloat(liveFourFactors.opponent.threePPct || "0"),
      EFG: parseFloat(liveFourFactors.team.efgPct || "0"),
    };
  }, [liveFourFactors]);

  const playerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      if (p.id) map.set(p.id.toString(), p.name);
    }
    return map;
  }, [players]);

  const eventLogStats = useMemo(() => {
    let filtered = scoreFlowSortedStats;
    if (keyMomentsOnly) {
      filtered = filtered.filter((s) => !!s.isBookmarked);
    }
    return filtered.slice().reverse();
  }, [scoreFlowSortedStats, keyMomentsOnly]);

  const handleToggleBookmark = useCallback(
    async (statId: string, currentStatus: number | undefined) => {
      try {
        await db.open();
        await db.stats.update(statId, {
          isBookmarked: currentStatus === 1 ? 0 : 1,
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to toggle bookmark:", err);
      }
    },
    [],
  );

        const handleExportBookmarks = () => {
    const bookmarked = allStats.filter((s) => !!s.isBookmarked);
    if (bookmarked.length === 0) {
      alert("No bookmarked events to export.");
      return;
    }

    let csv = "Timestamp,Period,Clock,Player,Action,Points,Shot Quality,Play Name\n";
    for (const s of bookmarked) {
      let pName = playerNamesMap.get(s.playerId) || "Unknown";
      if (isOpponentId(s.playerId)) pName = `Opponent #${s.playerId.split(":")[1] || "??"}`;

      csv += `${s.timestamp},${s.period},${s.clockTime},"${pName}",${s.type},${s.points || 0},${s.shotQuality || ""},"${s.playName || ""}"\n`;
    }

    downloadCSV(`Bookmarks_${game?.opponent}_${game?.date}.csv`, csv);
  };

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
  const scoringRuns = useMemo(() => {
    return calculateScoringRuns(scoreFlowSortedStats);
  }, [scoreFlowSortedStats]);


  const defensiveStats = useMemo(() => {
    return calculateStopsAndKills(scoreFlowSortedStats);
  }, [scoreFlowSortedStats]);

  const handleDeleteGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
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

  const handleCopyId = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleVideoExport = (platform: "HUDL" | "SYNERGY") => {
    let csv = "";
    const filename = `${platform}_Export_${team?.name}_vs_${game?.opponent}_${game?.date}.csv`;

    if (platform === "HUDL") {
      csv = generateHudlCSV(allStats, players, game);
    } else {
      csv = generateSynergyCSV(allStats, players, game);
    }

    downloadCSV(filename, csv);
    setVideoExportDialogOpen(false);
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
    <TableContainer
      sx={{
        mx: { xs: -2, sm: 0 },
        width: { xs: "calc(100% + 32px)", sm: "100%" },
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <SortableHeader
              label="PLAYER"
              sortKey="name"
              align="left"
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="MIN"
              sortKey="min"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Minutes Played"
            />
            <SortableHeader
              label="PTS"
              sortKey="points"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Points"
            />
            <SortableHeader
              label="FG"
              sortKey="makes"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Field Goals Made-Attempted"
            />
            <SortableHeader
              label="FG%"
              sortKey="fgPct"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Field Goal Percentage"
            />
            <SortableHeader
              label="eFG%"
              sortKey="efgPct"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Effective Field Goal Percentage"
            />
            <SortableHeader
              label="OREB"
              sortKey="offRebounds"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Offensive Rebounds"
            />
            <SortableHeader
              label="DREB"
              sortKey="defRebounds"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Defensive Rebounds"
            />
            <SortableHeader
              label="REB"
              sortKey="rebounds"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Total Rebounds"
            />
            <SortableHeader
              label="AST"
              sortKey="assists"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Assists"
            />
            <SortableHeader
              label="STL"
              sortKey="steals"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Steals"
            />
            <SortableHeader
              label="BLK"
              sortKey="blocks"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Blocks"
            />
            <SortableHeader
              label="TO"
              sortKey="turnovers"
              hideOnMobile
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Turnovers"
            />
            <SortableHeader
              label="PF"
              sortKey="fouls"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Personal Fouls"
            />
            <SortableHeader
              label="+/-"
              sortKey="plusMinus"
              sortConfig={sortConfig}
              onSort={handleSort}
              tooltip="Plus/Minus"
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {playerAggregates.map((row) => (
            <PlayerStatRow key={row.id} row={row} />
          ))}
          {teamData && (
            <TableRow
              sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
            >
              <TableCell sx={{ fontWeight: 700 }}>
                TEAM TOTALS (PPP: {teamData.ppp})
              </TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {teamData.points}
              </TableCell>
              <TableCell align="right" colSpan={12}>
                -
              </TableCell>
            </TableRow>
          )}
          <TableRow sx={{ bgcolor: "secondary.light" }}>
            <TableCell sx={{ fontWeight: 700 }}>
              OPPONENT (PPP: {oppData.ppp})
            </TableCell>
            <TableCell align="right">-</TableCell>
            <TableCell align="right">{oppData.points}</TableCell>
            <TableCell align="right">
              {oppData.makes}-{oppData.attempts}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.fgPct}%
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              -
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.offRebounds}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.defRebounds}
            </TableCell>
            <TableCell align="right">{oppData.rebounds}</TableCell>
            <TableCell align="right">{oppData.assists}</TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.steals}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.blocks}
            </TableCell>
            <TableCell
              align="right"
              sx={{ display: { xs: "none", sm: "table-cell" } }}
            >
              {oppData.turnovers}
            </TableCell>
            <TableCell align="right">{oppData.fouls}</TableCell>
            <TableCell align="right">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const shotChartFilters = (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
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
        <FormControl fullWidth size="small">
          <InputLabel>Opp. Play Type</InputLabel>
          <Select
            value={selectedOpponentPlay}
            label="Opp. Play Type"
            onChange={(e) => setSelectedOpponentPlay(e.target.value)}
          >
            <MenuItem value="ALL">All Opp. Plays</MenuItem>
            {Object.values(PLAY_TYPES).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <RechartsTooltip content={<ScoreFlowTooltip />} />
        <Legend />
        <ReferenceLine
          yAxisId="spread"
          y={0}
          stroke="#666"
          strokeWidth={2}
          label="Neutral"
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

  const matchupTable = (
    <TableContainer component={Box}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableCell sx={{ fontWeight: 700 }}>Our Defender</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Opponent</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              PTS Allowed
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Stops
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Stop%
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {matchupStats.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
                    {shotChartJerseyMap.get(row.ourPlayerId) ?? "??"}
                  </Avatar>
                  <Typography variant="body2">
                    {players.find((p) => p.id === row.ourPlayerId)?.name ||
                      "???"}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "0.65rem",
                      bgcolor: "secondary.main",
                    }}
                  >
                    {row.opponentPlayerId.startsWith(
                      SPECIAL_PLAYER_IDS.OPPONENT + ":",
                    )
                      ? row.opponentPlayerId.split(":")[1]
                      : "??"}
                  </Avatar>
                  <Typography variant="body2">
                    Opp #{row.opponentPlayerId.split(":")[1] || "??"}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {row.pointsAllowed}
              </TableCell>
              <TableCell align="right">{row.stops}</TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color:
                    parseFloat(row.stopPct) >= 50
                      ? "success.main"
                      : "inherit",
                }}
              >
                {row.stopPct}%
              </TableCell>
            </TableRow>
          ))}
          {matchupStats.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No defensive assignments tracked for this period.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const rotationTimeline = (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <ToggleButton
          value="runs"
          selected={showRuns}
          onChange={() => setShowRuns(!showRuns)}
          size="small"
        >
          Show Runs
        </ToggleButton>
        <ToggleButton
          value="fouls"
          selected={showFouls}
          onChange={() => setShowFouls(!showFouls)}
          size="small"
        >
          Show Fouls
        </ToggleButton>
      </Stack>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120, fontWeight: 700 }}>Player</TableCell>
              <TableCell sx={{ minWidth: 400, fontWeight: 700 }}>
                Stint Timeline (P1 → OT)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((p) => {
              const stints = playerStints.filter((s) => s.playerId === p.id);
              if (stints.length === 0) return null;

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          bgcolor: p.avatarColor,
                        }}
                      >
                        {shotChartJerseyMap.get(p.id!) ?? "??"}
                      </Avatar>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
                        {p.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ p: 1 }}>
                    <Box
                      sx={{
                        height: 24,
                        width: "100%",
                        bgcolor: "rgba(0,0,0,0.05)",
                        borderRadius: 1,
                        position: "relative",
                        minWidth: 400,
                      }}
                    >
                      {/* Scoring Runs Background */}
                      {showRuns &&
                        scoringRuns.map((run, ridx) => {
                          const maxPeriod = team?.periodType === "QUARTERS" ? 4 : 2;
                          const currentMax = Math.max(
                            maxPeriod,
                            ...playerStints.map((ps) => ps.period),
                          );
                          const periodLen = (team?.periodLength || 10) * 60;
                          const totalSecs = currentMax * periodLen;

                          const startOffset =
                            (run.period - 1) * periodLen + (periodLen - run.startClock);
                          const endOffset =
                            (run.period - 1) * periodLen + (periodLen - run.endClock);

                          const left = (startOffset / totalSecs) * 100;
                          const width = ((endOffset - startOffset) / totalSecs) * 100;

                          return (
                            <Box
                              key={`run-${ridx}`}
                              sx={{
                                position: "absolute",
                                left: `${left}%`,
                                width: `${width}%`,
                                height: "100%",
                                bgcolor:
                                  run.team === "TEAM"
                                    ? "primary.main"
                                    : "secondary.main",
                                opacity: 0.1,
                                zIndex: 0,
                              }}
                            />
                          );
                        })}

                      {stints.map((s, idx) => {
                        const maxPeriod = team?.periodType === "QUARTERS" ? 4 : 2;
                        const currentMax = Math.max(
                          maxPeriod,
                          ...playerStints.map((ps) => ps.period),
                        );
                        const periodLen = (team?.periodLength || 10) * 60;
                        const totalSecs = currentMax * periodLen;

                        const startOffset =
                          (s.period - 1) * periodLen + (periodLen - s.startClock);
                        const endOffset =
                          (s.period - 1) * periodLen + (periodLen - s.endClock);

                        const left = (startOffset / totalSecs) * 100;
                        const width = ((endOffset - startOffset) / totalSecs) * 100;

                        // Get fouls during this stint
                        const foulsDuringStint = showFouls
                          ? scoreFlowSortedStats.filter(
                              (stat) =>
                                stat.playerId === s.playerId &&
                                stat.period === s.period &&
                                (stat.type === ACTION_TYPES.FOUL ||
                                  stat.type === ACTION_TYPES.FOUL_SHOOTING ||
                                  stat.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
                                  stat.type === ACTION_TYPES.TECHNICAL_FOUL) &&
                                (stat.clockTime || 0) <= s.startClock &&
                                (stat.clockTime || 0) >= s.endClock,
                            )
                          : [];

                        return (
                          <Tooltip
                            key={idx}
                            title={`P${s.period} [${formatClock(s.startClock)} - ${formatClock(s.endClock)}]`}
                          >
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${left}%`,
                                width: `${width}%`,
                                height: "60%",
                                top: "20%",
                                bgcolor: theme.palette.primary.main,
                                opacity: 0.8,
                                borderRadius: 0.5,
                                zIndex: 1,
                                transition: "all 0.2s",
                                "&:hover": { opacity: 1, transform: "scaleY(1.2)" },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.2,
                              }}
                            >
                              {foulsDuringStint.map((_, fidx) => (
                                <Box
                                  key={fidx}
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    bgcolor: "error.main",
                                    borderRadius: "50%",
                                    border: "0.5px solid white",
                                  }}
                                />
                              ))}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );

  const eventLog = (
    <MoleskineCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
          Game Event Log
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={handleExportBookmarks}
            startIcon={<ExpandIcon />}
          >
            Export Bookmarks
          </Button>
          <ToggleButton
            value="keyMoments"
            selected={keyMomentsOnly}
            onChange={() => setKeyMomentsOnly(!keyMomentsOnly)}
            size="small"
            color="primary"
          >
            ⭐ Key Moments
          </ToggleButton>
        </Stack>
      </Box>
      <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
        {eventLogStats.map((s) => {
          let pName = playerNamesMap.get(s.playerId) || "Unknown";
          if (isOpponentId(s.playerId)) pName = `Opponent #${s.playerId.split(":")[1] || "??"}`;

          return (
            <RecentActionItem
              key={s.id}
              stat={s}
              playerName={pName}
              periodLabel={periodLabel}
              isReadOnly={isDeleted}
              onEdit={() => {}} // Disabled in stats view for now
              onDelete={() => {}}
              onToggleBookmark={handleToggleBookmark}
            />
          );
        })}
        {eventLogStats.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            {keyMomentsOnly ? "No bookmarked events." : "No events recorded."}
          </Typography>
        )}
      </Stack>
    </MoleskineCard>
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

  const playerNarratives = useMemo(() => {
    return playerAggregates
      .map((p) => ({
        player: p,
        narrative: generatePlayerNarrative(p),
      }))
      .filter((n) => n.narrative !== null);
  }, [playerAggregates]);

  return (
    <Box
      id="game-stats-container"
      sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1, bgcolor: "white" }}
    >
      <EntityBanner
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              {`${game?.date ? dayjs(game.date).format("MM-DD-YYYY") : ""} ${game?.time || ""} | ${game?.location || ""}`}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy Game ID"}>
              <IconButton size="small" onClick={handleCopyId} sx={{ color: "rgba(255,255,255,0.7)", p: 0.5 }}>
                {copied ? <CheckIcon fontSize="inherit" /> : <CopyIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
          </Stack>
        }
        avatarSrc={game?.opponentLogoUrl}
        avatarColor="rgba(255,255,255,0.1)"
        backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
        primaryColor={team?.primaryColor}
        stats={[ { label: "PPP", value: teamData?.ppp || "0.00" }, { label: "Def. PPP", value: oppData.ppp } ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setVideoExportDialogOpen(true)}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  Export for Video
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
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ClinicIcon />}
                  onClick={() => setIsClinicMode(!isClinicMode)}
                  sx={{
                    bgcolor: isClinicMode ? "white" : "rgba(255,255,255,0.2)",
                    color: isClinicMode ? "primary.main" : "white",
                    "&:hover": { bgcolor: isClinicMode ? "#eee" : "rgba(255,255,255,0.3)" }
                  }}
                >
                  {isClinicMode ? "Close Clinic" : "Start Clinic"}
                </Button>
              </>
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

      {isClinicMode && game && (
        <LockerRoomClinic
          game={game}
          allStats={allStats}
          teamPpp={teamData?.ppp || "0.00"}
        />
      )}

      <Grid container spacing={3}>
        {/* Four Factors Card */}
        {liveFourFactors && (
          <Grid item xs={12}>
            <FourFactorsHUD
              teamStats={liveFourFactors.team}
              oppStats={liveFourFactors.opponent}
              seasonAvg={teamSeasonStats}
            />
          </Grid>
        )}

        {/* Defensive Metrics Card */}
        <Grid item xs={12}>
          <MoleskineCard>
            <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
              Defensive Metrics
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={4}>
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
              <Grid item xs={4}>
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
              <Grid item xs={4}>
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
        <Grid item xs={12}>
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
        <Grid item xs={12} md={compareMode ? 12 : 6}>
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
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
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
                display="block"
                textAlign="center"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                ← Swipe to compare →
              </Typography>
            )}
          </MoleskineCard>
        </Grid>

        {/* Score Flow Card */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12}>
          <MoleskineCard sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Rotation Timeline
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("rotation")}
                aria-label="Expand Rotation Timeline section"
                title="Expand section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {rotationTimeline}
          </MoleskineCard>

          <MoleskineCard sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Matchup Battle
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("matchups")}
                aria-label="Expand Matchup Battle section"
                title="Expand section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {matchupTable}
          </MoleskineCard>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MoleskineCard>
                <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
                  Player Performance Feedback
                </Typography>
                <Grid container spacing={2}>
                  {playerNarratives.map((n) => (
                    <Grid item xs={12} md={6} key={n.player.id}>
                      <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          {n.player.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2, flexGrow: 1 }}>
                          "{n.narrative?.strength} {n.narrative?.growth}"
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`Strength: ${n.narrative?.strength.split(".")[0]}`} size="small" color="success" sx={{ fontSize: "0.65rem" }} />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSnackbar({
                                open: true,
                                message: `Narrative for ${n.player.name} sent to player!`,
                                severity: "success"
                              });
                            }}
                          >
                            Approve & Send
                          </Button>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                  {playerNarratives.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No qualifying player performance narratives (min. 5 mins played).
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </MoleskineCard>
            </Grid>

            <Grid item xs={12} md={4}>
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

            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
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
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Play Type</TableCell>
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
                      {opponentPlayEfficiency.map((play) => (
                        <TableRow key={play.name}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {play.name}
                          </TableCell>
                          <TableCell align="right">{play.attempts}</TableCell>
                          <TableCell align="right">{play.points}</TableCell>
                          <TableCell align="right">{play.efg}%</TableCell>
                        </TableRow>
                      ))}
                      {opponentPlayEfficiency.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No opponent play types recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MoleskineCard>
            </Grid>
            <Grid item xs={12} md={4}>
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setAuditDialogOpen(true)}
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

            {team?.tacticalGoals && team.tacticalGoals.length > 0 && (
              <Grid item xs={12} md={4}>
                <TacticalGoalHUD
                  goals={team.tacticalGoals}
                  currentStats={tacticalGoalStats}
                />
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <OfficiatingImpactSummary
                stats={scoreFlowSortedStats}
                teamScore={teamData?.points || 0}
                oppScore={oppData?.points || 0}
                teamPlayers={teamPlayers}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontFamily: "var(--serif)", mb: 2, mt: 4 }}>
                Player Feedback Narratives
              </Typography>
              <Grid container spacing={2}>
                {playerNarratives.map((n) => (
                  <Grid item xs={12} sm={6} md={4} key={n.player.id}>
                    <PlayerFeedbackCard player={n.player} narrative={n.narrative!} />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              {eventLog}
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
          {expandedSection === "rotation" && "Rotation Timeline"}
          {expandedSection === "matchups" && "Matchup Battle"}
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
          {expandedSection === "matchups" && matchupTable}
          {expandedSection === "rotation" && rotationTimeline}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedSection(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {gameId && (
        <SubstitutionAuditDialog
          open={auditDialogOpen}
          onClose={() => setAuditDialogOpen(false)}
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
              setDeleteDialogOpen(true);
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
              InputLabelProps={{ shrink: true }}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              InputLabelProps={{ shrink: true }}
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

      {/* Video Export Platform Selection Dialog */}
      <Dialog
        open={videoExportDialogOpen}
        onClose={() => setVideoExportDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Export for Video Platform</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose your video analysis platform. We will generate a compatible CSV for easy tagging.
          </DialogContentText>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleVideoExport("HUDL")}
              sx={{ py: 1.5, justifyContent: "space-between" }}
            >
              Hudl
              <Chip label="CSV" size="small" />
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleVideoExport("SYNERGY")}
              sx={{ py: 1.5, justifyContent: "space-between" }}
            >
              Synergy
              <Chip label="CSV" size="small" />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVideoExportDialogOpen(false)}>Cancel</Button>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
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
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
