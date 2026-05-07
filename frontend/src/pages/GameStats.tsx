import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
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
  Divider,
  Select,
  MenuItem,
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
import PlayerStatRow from "../components/PlayerStatRow";
import StatExportMenu from "../components/StatExportMenu";
import ScoreFlowTooltip from "../components/ScoreFlowTooltip";
import DefensiveMetricsCard from "../components/DefensiveMetricsCard";
import { useGameStats } from "../hooks/useGameStats";
import { db } from "../db";
import { ACTION_TYPES } from "../constants/stats";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SortableHeader from "../components/SortableHeader";
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
  ComposedChart,
} from "recharts";

const GameStats: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

  const {
    game, team, players, allStats, playerAggregates, shotChartJerseyMap,
    shotChartMarkers, heatmapData, heatmapData1, heatmapData2,
    scoreFlowData, oppData, teamData, playEfficiency, processEfficiency,
    lineupStats, defensiveStats,
    selectedPlayerId, setSelectedPlayerId, selectedType, setSelectedType,
    selectedQuality, setSelectedQuality, selectedPlay, setSelectedPlay,
    periodFilter, setPeriodFilter, clutchFilter, setClutchFilter,
    compareMode, setCompareMode, comparePeriod1, setComparePeriod1,
    comparePeriod2, setComparePeriod2, shotChartView, setShotChartView,
    sortConfig, handleSort, periodLabel, periods
  } = useGameStats(gameId);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");

  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent || ""); setEditDate(game.date || "");
      setEditTime(game.time || ""); setEditLocation(game.location || "");
      setEditOpponentLogoUrl(game.opponentLogoUrl || "");
    }
  }, [game]);

  useEffect(() => {
    if (game?.deletedAt) {
      const timer = setInterval(() => {
        const diff = dayjs(game.deletedAt).add(24, "hour").diff(dayjs());
        if (diff <= 0) setTimeLeft("Deleting now...");
        else setTimeLeft(`${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game?.deletedAt]);

  const handleDeleteGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, { deletedAt: new Date().toISOString(), synced: 0 });
      await syncService.pushUpdates(); setIsDeleteDialogOpen(false);
    } catch (err) { logger.error("Failed to delete game:", err); }
  };

  const handleRestoreGame = async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, { deletedAt: undefined, synced: 0 });
      await syncService.pushUpdates();
    } catch (err) { logger.error("Failed to restore game:", err); }
  };

  const handleUpdateGame = async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, { opponent: editOpponent, date: editDate, time: editTime, location: editLocation, opponentLogoUrl: editOpponentLogoUrl, synced: 0 });
      await syncService.pushUpdates(); setOpenEditDialog(false);
    } catch (err) { logger.error("Failed to update game:", err); }
  };

  const handleExportPDF = async () => {
    setIsExporting(true); const element = document.getElementById("game-stats-container");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png"); const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight); pdf.save(`BoxScore_${team?.name}_vs_${game?.opponent}_${game?.date}.pdf`);
    } catch (err) { logger.error("Failed to export PDF:", err); } finally { setIsExporting(false); }
  };

  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

  const boxScoreTable = (
    <TableContainer sx={{ mx: { xs: -2, sm: 0 }, width: { xs: "calc(100% + 32px)", sm: "100%" } }}>
      <Table size="small">
        <TableHead><TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
          <SortableHeader label="PLAYER" sortKey="name" align="left" sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="MIN" sortKey="min" sortConfig={sortConfig} onSort={handleSort} tooltip="Minutes Played" />
          <SortableHeader label="PTS" sortKey="points" sortConfig={sortConfig} onSort={handleSort} tooltip="Points" />
          <SortableHeader label="FG" sortKey="makes" sortConfig={sortConfig} onSort={handleSort} tooltip="Field Goals" />
          <SortableHeader label="FG%" sortKey="fgPct" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="eFG%" sortKey="efgPct" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="OREB" sortKey="offRebounds" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="DREB" sortKey="defRebounds" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="REB" sortKey="rebounds" sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="AST" sortKey="assists" sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="STL" sortKey="steals" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="BLK" sortKey="blocks" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="TO" sortKey="turnovers" hideOnMobile sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="PF" sortKey="fouls" sortConfig={sortConfig} onSort={handleSort} />
          <SortableHeader label="+/-" sortKey="plusMinus" sortConfig={sortConfig} onSort={handleSort} />
        </TableRow></TableHead>
        <TableBody>
          {playerAggregates.map((row) => (<PlayerStatRow key={row.id} row={row} />))}
          <TableRow sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}><TableCell sx={{ fontWeight: 700 }}>TEAM TOTALS (PPP: {teamData.ppp})</TableCell><TableCell align="right">-</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{teamData.points}</TableCell><TableCell align="right" colSpan={12}>-</TableCell></TableRow>
          <TableRow sx={{ bgcolor: "secondary.light" }}><TableCell sx={{ fontWeight: 700 }}>OPPONENT (PPP: {oppData.ppp})</TableCell><TableCell align="right">-</TableCell><TableCell align="right">{oppData.points}</TableCell><TableCell align="right">{oppData.makes}-{oppData.attempts}</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.fgPct}%</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>-</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.offRebounds}</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.defRebounds}</TableCell><TableCell align="right">{oppData.rebounds}</TableCell><TableCell align="right">{oppData.assists}</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.steals}</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.blocks}</TableCell><TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{oppData.turnovers}</TableCell><TableCell align="right">{oppData.fouls}</TableCell><TableCell align="right">-</TableCell></TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const scoreFlowChart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={scoreFlowData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" /><YAxis yAxisId="spread" orientation="left" /><YAxis yAxisId="ppp" orientation="right" domain={[0, 2]} />
        <Tooltip content={<ScoreFlowTooltip jerseyMap={shotChartJerseyMap} />} /><Legend /><ReferenceLine yAxisId="spread" y={0} stroke="#666" strokeWidth={2} label="Neutral" />
        {scoreFlowData.filter((d) => d.event === ACTION_TYPES.TIMEOUT).map((d, idx) => (<ReferenceLine key={`to-${idx}`} x={d.time} stroke={theme.palette.warning.main} strokeWidth={1} strokeDasharray="3 3" />))}
        <Area yAxisId="spread" type="stepAfter" dataKey="Spread" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.3} strokeWidth={2} />
        <Line yAxisId="ppp" type="monotone" dataKey="teamPpp" name="Team PPP" stroke={theme.palette.primary.main} strokeWidth={1} dot={false} strokeDasharray="3 3" />
        <Line yAxisId="ppp" type="monotone" dataKey="oppPpp" name="Opp PPP" stroke={theme.palette.secondary.main} strokeWidth={1} dot={false} strokeDasharray="3 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <Box id="game-stats-container" sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1, bgcolor: "white" }}>
      <EntityBanner
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date ? dayjs(game.date).format("MM-DD-YYYY") : ""} ${game?.time || ""} | ${game?.location || ""}`}
        avatarSrc={game?.opponentLogoUrl}
        backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"} primaryColor={team?.primaryColor}
        stats={[{ label: "PPP", value: teamData.ppp }, { label: "Def. PPP", value: oppData.ppp }]}
        actions={<Stack direction="row" spacing={1} alignItems="center">
          <StatExportMenu onExportPDF={handleExportPDF} isExporting={isExporting} isDeleted={isDeleted} />
          {!isDeleted && (<IconButton onClick={() => setOpenEditDialog(true)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)", transform: "scale(1.1)" } }}><EditIcon /></IconButton>)}
        </Stack>}
      />
      {isDeleted && (<Alert severity="warning" sx={{ mb: 4, mt: 3 }}><AlertTitle>Read Only Mode</AlertTitle>{game?.deletedAt ? `Scheduled for deletion in ${timeLeft}.` : "Pending deletion."}</Alert>)}
      <Box sx={{ mb: 4, mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <ToggleButtonGroup value={periodFilter} exclusive onChange={(_, val) => val && setPeriodFilter(val)} size="small" fullWidth={Boolean(isMobile)}>
          {periods.map((p) => (<ToggleButton key={p} value={p}>{p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}</ToggleButton>))}
        </ToggleButtonGroup>
        <ToggleButton value="clutch" selected={clutchFilter} onChange={() => setClutchFilter(!clutchFilter)} size="small" color="primary">🔥 CLUTCH MODE</ToggleButton>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}><DefensiveMetricsCard defensiveStats={defensiveStats} /></Grid>
        <Grid item xs={12}><MoleskineCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}><Typography variant="h6">Box Score</Typography><IconButton onClick={() => setExpandedSection("boxScore")}><ExpandIcon /></IconButton></Box>
          {boxScoreTable}</MoleskineCard></Grid>
        <Grid item xs={12} md={6}><MoleskineCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}><Typography variant="h6">Shot Chart</Typography><IconButton onClick={() => setExpandedSection("shotChart")}><ExpandIcon /></IconButton></Box>
          <Box sx={{ p: 1 }}><BasketballCourt markers={shotChartView === "markers" ? shotChartMarkers : []} heatmapData={shotChartView === "heatmap" ? heatmapData : undefined} onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")} /></Box></MoleskineCard></Grid>
        <Grid item xs={12} md={6}><MoleskineCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}><Typography variant="h6">Score Flow</Typography><IconButton onClick={() => setExpandedSection("scoreFlow")}><ExpandIcon /></IconButton></Box>
          <Box sx={{ height: 400 }}>{scoreFlowChart}</Box></MoleskineCard></Grid>
      </Grid>
      {gameId && (<SubstitutionAuditDialog open={isAuditDialogOpen} onClose={() => setIsAuditDialogOpen(false)} gameId={gameId} players={players} jerseyMap={shotChartJerseyMap} />)}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>Edit Game Details<IconButton color="error" onClick={() => { setOpenEditDialog(false); setIsDeleteDialogOpen(true); }}><Delete /></IconButton></DialogTitle>
        <DialogContent><Stack spacing={3} sx={{ mt: 1 }}>
          <TextField fullWidth label="Opponent" value={editOpponent} onChange={(e) => setEditOpponent(e.target.value)} />
          <TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
        </Stack></DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setOpenEditDialog(false)}>Cancel</Button><Button onClick={handleUpdateGame} variant="contained">Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
