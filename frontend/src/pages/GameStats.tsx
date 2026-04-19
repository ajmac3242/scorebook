import React, { useState, useMemo, useEffect } from "react";
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
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Warning,
  Edit as EditIcon,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import { getShotZone } from "../utils/shotZones";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  calculateLineupStats,
  calculateStopsAndKills,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SortableHeader from "../components/SortableHeader";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedPlay, setSelectedPlay] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
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
        liveContext:
          game && !game.completed
            ? {
                clockTime: game.clockTime || 0,
                period: game.currentPeriod || 1,
              }
            : undefined,
      },
    );
  }, [players, scoreFlowSortedStats, teamPlayers, game]);

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
      const playMatch =
        selectedPlay === "ALL" || (s.playName && s.playName === selectedPlay);
      if (playerMatch && typeMatch && playMatch) {
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
  }, [stats, selectedPlayerId, selectedType, selectedPlay, shotChartJerseyMap]);

  const shotChartMarkers = derivedStats.markers;

  const heatmapData = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number }> = {};
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS)
        continue;
      if (selectedPlayerId !== "ALL" && s.playerId !== selectedPlayerId)
        continue;
      if (selectedType !== "ALL" && s.type !== selectedType) continue;
      if (selectedPlay !== "ALL" && s.playName !== selectedPlay) continue;

      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
      data[zone].attempts++;
      if (s.type === ACTION_TYPES.MAKE) data[zone].makes++;
    }
    return data;
  }, [stats, selectedPlayerId, selectedType, selectedPlay]);

  const scoreFlowData = useMemo(() => {
    return calculateScoreFlow(scoreFlowSortedStats, game?.periodLength);
  }, [scoreFlowSortedStats, game?.periodLength]);

  const oppData = useMemo(() => {
    return calculateOpponentAggregates(stats);
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

  const lineupStats = useMemo(() => {
    return calculateLineupStats(scoreFlowSortedStats, {
      isSorted: true,
      periodLength: game?.periodLength,
      liveContext:
        game && !game.completed
          ? { clockTime: game.clockTime || 0, period: game.currentPeriod || 1 }
          : undefined,
    });
  }, [scoreFlowSortedStats, game]);

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
          ))}
          <TableRow sx={{ bgcolor: "secondary.light" }}>
            <TableCell sx={{ fontWeight: 700 }}>OPPONENT</TableCell>
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
      <AreaChart data={scoreFlowData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
        <Area
          type="stepAfter"
          dataKey="Spread"
          stroke={theme.palette.primary.main}
          fill={theme.palette.primary.main}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Line
          type="stepAfter"
          dataKey="Team"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
          hide
        />
        <Line
          type="stepAfter"
          dataKey="Opponent"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={false}
          hide
        />
      </AreaChart>
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
                      {shotChartJerseyMap.get(pId) || "??"}
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
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted && (
              <Button
                variant="contained"
                size="small"
                onClick={handleExportPDF}
                disabled={isExporting}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
              >
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
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
        }}
      >
        <ToggleButtonGroup
          value={periodFilter}
          exclusive
          onChange={(_, val) => val && setPeriodFilter(val)}
          size="small"
          fullWidth={Boolean(isMobile)}
        >
          {periods.map((p) => (
            <ToggleButton key={p} value={p}>
              {p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
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
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {boxScoreTable}
          </MoleskineCard>
        </Grid>

        {/* Shot Chart Card */}
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
                Shot Chart{" "}
                {periodFilter !== "ALL" && `(${periodLabel} ${periodFilter})`}
              </Typography>
              <IconButton
                onClick={() => setExpandedSection("shotChart")}
                aria-label="Expand Shot Chart section"
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            {shotChartFilters}
            <Box sx={{ p: 1 }}>{shotChartCourt}</Box>
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
              >
                <ExpandIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 400 }}>{scoreFlowChart}</Box>
          </MoleskineCard>
        </Grid>

        {/* Lineups Card */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                    >
                      <ExpandIcon />
                    </IconButton>
                  </Stack>
                </Box>
                {lineupTable}
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
