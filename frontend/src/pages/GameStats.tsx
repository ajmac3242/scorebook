import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Delete,
  Restore,
  Edit as EditIcon,
} from "@mui/icons-material";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import PlayerStatRow from "../components/PlayerStatRow";
import StatExportMenu from "../components/StatExportMenu";
import { useGameStats } from "../hooks/useGameStats";
import { db } from "../db";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import ScoreFlowTooltip from "../components/ScoreFlowTooltip";
import DefensiveMetricsCard from "../components/DefensiveMetricsCard";
import ShotChartSection from "../components/ShotChartSection";

const GameStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;
  const {
    game, team, players, playerAggregates, shotChartJerseyMap,
    shotChartMarkers, heatmapData, scoreFlowData, oppData, teamData,
    defensiveStats,
    selectedPlayerId, setSelectedPlayerId, selectedType, setSelectedType,
    selectedQuality, setSelectedQuality, selectedPlay, setSelectedPlay,
    periodFilter, setPeriodFilter, clutchFilter, setClutchFilter,
    compareMode, setCompareMode, shotChartView, setShotChartView,
    handleSort, periodLabel, periods
  } = useGameStats(gameId);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent || ""); setEditDate(game.date || "");
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

  const handleUpdateGame = async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, { opponent: editOpponent, date: editDate, synced: 0 });
      await syncService.pushUpdates(); setOpenEditDialog(false);
    } catch (err) { logger.error("Failed to update game:", err); }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("game-stats-container");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BoxScore_${team?.name}_vs_${game?.opponent}_${game?.date}.pdf`);
    } catch (err) { logger.error("Failed to export PDF:", err); } finally { setIsExporting(false); }
  };

  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

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
          {!isDeleted && (<IconButton onClick={() => setOpenEditDialog(true)} sx={{ color: "white" }}><EditIcon /></IconButton>)}
        </Stack>}
      />
      {isDeleted && (<Alert severity="warning" sx={{ mt: 2 }}><AlertTitle>Read Only Mode</AlertTitle>{game?.deletedAt ? `Scheduled for deletion in ${timeLeft}.` : "Pending deletion."}</Alert>)}
      <Box sx={{ my: 3, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <ToggleButtonGroup value={periodFilter} exclusive onChange={(_, val) => val && setPeriodFilter(val)} size="small">
          {periods.map((p) => (<ToggleButton key={p} value={p}>{p === "ALL" ? "Full Game" : `${periodLabel} ${p}`}</ToggleButton>))}
        </ToggleButtonGroup>
        <ToggleButton value="clutch" selected={clutchFilter} onChange={() => setClutchFilter(!clutchFilter)} size="small" color="primary">🔥 CLUTCH MODE</ToggleButton>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}><DefensiveMetricsCard defensiveStats={defensiveStats} /></Grid>
        <Grid item xs={12}><MoleskineCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Typography variant="h6">Box Score</Typography><IconButton onClick={() => {}}><ExpandIcon /></IconButton></Box>
          <TableContainer><Table size="small">
            <TableHead><TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
              <TableCell onClick={() => handleSort("name")} sx={{ cursor: "pointer" }}>PLAYER</TableCell>
              <TableCell align="right" onClick={() => handleSort("min")} sx={{ cursor: "pointer" }}>MIN</TableCell>
              <TableCell align="right" onClick={() => handleSort("points")} sx={{ cursor: "pointer" }}>PTS</TableCell>
              <TableCell align="right" onClick={() => handleSort("plusMinus")} sx={{ cursor: "pointer" }}>+/-</TableCell>
            </TableRow></TableHead>
            <TableBody>{playerAggregates.map((row) => (<PlayerStatRow key={row.id} row={row} />))}</TableBody>
          </Table></TableContainer></MoleskineCard></Grid>
        <Grid item xs={12} md={6}>
          <ShotChartSection
            compareMode={compareMode} setCompareMode={setCompareMode}
            shotChartView={shotChartView} setShotChartView={setShotChartView}
            selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId}
            players={players} selectedType={selectedType} setSelectedType={setSelectedType}
            selectedQuality={selectedQuality} setSelectedQuality={setSelectedQuality}
            selectedPlay={selectedPlay} setSelectedPlay={setSelectedPlay}
            playbook={team?.playbook} shotChartMarkers={shotChartMarkers}
            heatmapData={heatmapData} onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
            periodLabel={periodLabel}
          />
        </Grid>
        <Grid item xs={12} md={6}><MoleskineCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}><Typography variant="h6">Score Flow</Typography><IconButton onClick={() => {}}><ExpandIcon /></IconButton></Box>
          <Box sx={{ height: 400 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={scoreFlowData}><CartesianGrid vertical={false} /><XAxis dataKey="time" /><YAxis yAxisId="spread" /><YAxis yAxisId="ppp" orientation="right" /><Tooltip content={<ScoreFlowTooltip jerseyMap={shotChartJerseyMap} />} /><Area yAxisId="spread" dataKey="Spread" /><Line yAxisId="ppp" dataKey="teamPpp" dot={false} /><Line yAxisId="ppp" dataKey="oppPpp" dot={false} /></ComposedChart></ResponsiveContainer></Box></MoleskineCard></Grid>
      </Grid>
      {gameId && (<SubstitutionAuditDialog open={isAuditDialogOpen} onClose={() => setIsAuditDialogOpen(false)} gameId={gameId} players={players} jerseyMap={shotChartJerseyMap} />)}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>Edit Game Details<IconButton color="error" onClick={() => { setOpenEditDialog(false); }}><Delete /></IconButton></DialogTitle>
        <DialogContent><Stack spacing={3} sx={{ mt: 1 }}><TextField fullWidth label="Opponent" value={editOpponent} onChange={(e) => setEditOpponent(e.target.value)} /><TextField fullWidth label="Date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></Stack></DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpenEditDialog(false)}>Cancel</Button><Button onClick={handleUpdateGame} variant="contained">Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
