import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Avatar,
  IconButton,
  Button,
  Alert,
  AlertTitle,
  useMediaQuery,
} from "@mui/material";
import {
  OpenInFull as ExpandIcon,
  Restore,
  Warning,
  Edit as EditIcon,
} from "@mui/icons-material";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import { db } from "../db";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BoxScoreSection } from "./GameStats/BoxScoreSection";
import { ScoreFlowSection } from "./GameStats/sections/ScoreFlowSection";
import { ShotChartSection } from "./GameStats/sections/ShotChartSection";
import { DefensiveSection } from "./GameStats/sections/DefensiveSection";
import { ImpactSection } from "./GameStats/sections/ImpactSection";
import { EfficiencySection } from "./GameStats/sections/EfficiencySection";
import { ExpandedSectionDialog } from "./GameStats/dialogs/ExpandedSectionDialog";
import { EditGameDialog } from "./GameStats/dialogs/EditGameDialog";
import { DeleteGameDialog } from "./GameStats/dialogs/DeleteGameDialog";
import { PracticePlannerDialog } from "./GameStats/dialogs/PracticePlannerDialog";
import { DefensiveIntegrityDialog } from "./GameStats/dialogs/DefensiveIntegrityDialog";
import { useGameStatsData } from "./GameStats/hooks/useGameStatsData";
import { useGameStatsAnalytics } from "./GameStats/hooks/useGameStatsAnalytics";

type ExpandedSectionType =
  | "boxScore"
  | "shotChart"
  | "scoreFlow"
  | "lineups"
  | null;

/**
 * GameStats page component.
 * Displays detailed box score, shot charts, and score flow for a specific game.
 */
const GameStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") ?? undefined;
  const isMobile = useMediaQuery("(max-width:600px)");

  // --- UI state ---
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  // Shot chart state
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedQuality, setSelectedQuality] = useState("ALL");
  const [selectedBreakdown, setSelectedBreakdown] = useState("ALL");
  const [selectedPlay, setSelectedPlay] = useState("ALL");
  const [compareMode, setCompareMode] = useState(false);
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );
  const [comparePeriod1, setComparePeriod1] = useState("1");
  const [comparePeriod2, setComparePeriod2] = useState("2");

  // Dialog state
  const [expandedSection, setExpandedSection] =
    useState<ExpandedSectionType>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPracticePlannerOpen, setIsPracticePlannerOpen] = useState(false);
  const [isDefensiveIntegrityOpen, setIsDefensiveIntegrityOpen] =
    useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);

  // Edit game state
  const [editOpponent, setEditOpponent] = useState("");
  const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [isExporting, setIsExporting] = useState(false);

  // --- Data ---
  const data = useGameStatsData(gameId);
  const { game, team, players, allStats } = data;

  // --- Analytics ---
  const analytics = useGameStatsAnalytics(data, {
    periodFilter,
    clutchFilter,
    sortConfig,
    shotChartFilters: {
      selectedPlayerId,
      selectedType,
      selectedQuality,
      selectedBreakdown,
      selectedPlay,
    },
    comparePeriod1,
    comparePeriod2,
  });

  const {
    playerAggregates,
    shotChartMarkers,
    heatmapData,
    heatmapData1,
    heatmapData2,
    scoreFlowData,
    oppData,
    teamData,
    lineupStats,
    onOffStats,
    matchupStats,
    defensiveStats,
    defensiveIntegrity,
    individualDefensiveBreakdown,
    specialtyExecution,
    assistNetwork,
    shotROI,
    paintTouchStats,
    opponentPlayTypeEfficiency,
    playEfficiency,
    processEfficiency,
    shotClockEfficiency,
    practiceFocusAreas,
    periods,
    shotChartJerseyMap,
  } = analytics;

  // Sync edit fields when game loads
  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent ?? "");
      setEditOpponentLogoUrl(game.opponentLogoUrl ?? "");
      setEditDate(game.date ?? "");
      setEditTime(game.time ?? "");
      setEditLocation(game.location ?? "");
    }
  }, [game]);

  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

  const playbook = useMemo(() => {
    const names = new Set<string>();
    for (const s of allStats) {
      if (s.playName) names.add(s.playName);
    }
    return Array.from(names);
  }, [allStats]);

  // --- Handlers ---
  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  }, []);

  const handleDeleteGame = useCallback(async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.syncGame(gameId);
      setIsDeleteDialogOpen(false);
      setOpenEditDialog(false);
    } catch (e) {
      logger.error("Delete game failed", e);
    }
  }, [gameId]);

  const handleRestoreGame = useCallback(async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, { deletedAt: undefined, synced: 0 });
      await syncService.syncGame(gameId);
    } catch (e) {
      logger.error("Restore game failed", e);
    }
  }, [gameId]);

  const handleUpdateGame = useCallback(async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, {
        opponent: editOpponent,
        opponentLogoUrl: editOpponentLogoUrl,
        date: editDate,
        time: editTime,
        location: editLocation,
        synced: 0,
      });
      await syncService.syncGame(gameId);
      setOpenEditDialog(false);
    } catch (e) {
      logger.error("Update game failed", e);
    }
  }, [
    gameId,
    editOpponent,
    editOpponentLogoUrl,
    editDate,
    editTime,
    editLocation,
  ]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const el = document.getElementById("game-stats-container");
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        canvas.width,
        canvas.height,
      );
      pdf.save(`game-stats-${game?.opponent ?? "export"}.pdf`);
    } catch (e) {
      logger.error("PDF export failed", e);
    } finally {
      setIsExporting(false);
    }
  }, [game?.opponent]);

  // --- Shared ReactNode tables (reused in dialogs and sections) ---
  const boxScoreTable = (
    <BoxScoreSection
      playerAggregates={playerAggregates}
      oppData={oppData}
      teamData={teamData}
      sortConfig={sortConfig}
      onSort={handleSort}
    />
  );

  const lineupTable = (
    <TableContainer component={Box}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}>
            {["Lineup", "MIN", "PTS FOR", "PTS AGN", "NET/40", "+/-"].map(
              (h) => (
                <TableCell
                  key={h}
                  align={h === "Lineup" ? "left" : "right"}
                  sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                >
                  {h}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {lineupStats.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Stack
                  direction="row"
                  spacing={"var(--cs-semantic-spacing-xs)"}
                >
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
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color:
                    row.netRating > 0
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : row.netRating < 0
                        ? "var(--cs-semantic-color-feedback-error-main)"
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

  return (
    <Box
      id="game-stats-container"
      sx={{
        pb: "var(--cs-semantic-spacing-xl)",
        opacity: isDeleted ? 0.7 : 1,
        bgcolor: "var(--cs-semantic-color-background-default)",
      }}
    >
      <EntityBanner
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date ? dayjs(game.date).format("MM-DD-YYYY") : ""} ${game?.time || ""} | ${game?.location || ""}`}
        avatarSrc={game?.opponentLogoUrl}
        avatarColor="var(--cs-semantic-color-action-active)"
        backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
        primaryColor={team?.primaryColor}
        stats={[
          { label: "PPP", value: teamData.ppp },
          { label: "Def. PPP", value: oppData.ppp },
        ]}
        actions={
          <Stack
            direction="row"
            spacing={"var(--cs-semantic-spacing-xs)"}
            sx={{ alignItems: "center" }}
          >
            {!isDeleted && (
              <Stack direction="row" spacing={"var(--cs-semantic-spacing-xs)"}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setIsPracticePlannerOpen(true)}
                  color="success"
                >
                  Practice Planner
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  sx={{
                    bgcolor: "var(--cs-semantic-color-action-selected)",
                    color: "var(--cs-semantic-color-text-inverse)",
                  }}
                >
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
              </Stack>
            )}
            {!isDeleted ? (
              <IconButton
                onClick={() => setOpenEditDialog(true)}
                sx={{
                  color: "var(--cs-semantic-color-text-inverse)",
                  bgcolor: "var(--cs-semantic-color-action-active)",
                }}
              >
                <EditIcon />
              </IconButton>
            ) : (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Restore />}
                onClick={handleRestoreGame}
              >
                Restore
              </Button>
            )}
          </Stack>
        }
      />

      {isDeleted && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{
            mx: "var(--cs-semantic-spacing-md)",
            mt: "var(--cs-semantic-spacing-md)",
          }}
        >
          <AlertTitle>Game Deleted</AlertTitle>
          This game has been deleted. Stats are read-only. You have 24 hours to
          restore it.
        </Alert>
      )}

      {/* Period / Clutch Filter Toolbar */}
      <Box
        sx={{
          px: "var(--cs-semantic-spacing-md)",
          pt: "var(--cs-semantic-spacing-md)",
        }}
      >
        <Stack
          direction="row"
          spacing={"var(--cs-semantic-spacing-md)"}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{periodLabel}</InputLabel>
            <Select
              value={periodFilter}
              label={periodLabel}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              {periods.map((p) => (
                <MenuItem key={p} value={p}>
                  {p === "ALL" ? "All Periods" : `${periodLabel} ${p}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            variant={clutchFilter ? "contained" : "outlined"}
            color="warning"
            onClick={() => setClutchFilter((v) => !v)}
          >
            Clutch Only
          </Button>
        </Stack>
      </Box>

      <Grid
        container
        spacing={"var(--cs-semantic-spacing-md)"}
        sx={{ p: "var(--cs-semantic-spacing-md)" }}
      >
        {/* On/Off Impact + Matchup Accountability */}
        <ImpactSection
          onOffStats={onOffStats}
          matchupStats={matchupStats}
          jerseyMap={shotChartJerseyMap}
        />

        {/* Defensive Metrics + Individual Breakdown + Lineup */}
        <DefensiveSection
          defensiveStats={defensiveStats}
          individualDefensiveBreakdown={individualDefensiveBreakdown}
          lineupStats={lineupStats}
          jerseyMap={shotChartJerseyMap}
        />

        {/* Box Score */}
        <Grid size={{ xs: 12 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}
              >
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

        {/* Shot Chart */}
        <Grid size={{ xs: 12, md: compareMode ? 12 : 6 }}>
          <ShotChartSection
            players={players}
            playbook={playbook}
            periodFilter={periodFilter}
            periodLabel={periodLabel}
            periods={periods}
            isMobile={isMobile}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            selectedBreakdown={selectedBreakdown}
            setSelectedBreakdown={setSelectedBreakdown}
            selectedPlay={selectedPlay}
            setSelectedPlay={setSelectedPlay}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            shotChartView={shotChartView}
            setShotChartView={setShotChartView}
            comparePeriod1={comparePeriod1}
            setComparePeriod1={setComparePeriod1}
            comparePeriod2={comparePeriod2}
            setComparePeriod2={setComparePeriod2}
            shotChartMarkers={shotChartMarkers}
            heatmapData={heatmapData}
            heatmapData1={heatmapData1}
            heatmapData2={heatmapData2}
            allStats={allStats}
            onExpand={() => setExpandedSection("shotChart")}
          />
        </Grid>

        {/* Score Flow */}
        {!compareMode && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ScoreFlowSection
              scoreFlowData={scoreFlowData}
              jerseyMap={shotChartJerseyMap}
              periodFilter={periodFilter}
              periodLabel={periodLabel}
              periodLength={game?.periodLength}
              allStatsLength={allStats.length}
              maxPeriod={analytics.maxPeriod}
              onExpand={() => setExpandedSection("scoreFlow")}
            />
          </Grid>
        )}

        {/* Efficiency Analytics (8 sub-cards) */}
        <EfficiencySection
          paintTouchStats={paintTouchStats}
          shotROI={shotROI}
          assistNetwork={assistNetwork}
          opponentPlayTypeEfficiency={opponentPlayTypeEfficiency}
          shotClockEfficiency={shotClockEfficiency}
          processEfficiency={processEfficiency}
          playEfficiency={playEfficiency}
          defensiveIntegrity={defensiveIntegrity}
          specialtyExecution={specialtyExecution}
          lineupTable={lineupTable}
          jerseyMap={shotChartJerseyMap}
          teamPpp={teamData.ppp}
          onOpenDefensiveIntegrity={() => setIsDefensiveIntegrityOpen(true)}
          onExpandLineups={() => setExpandedSection("lineups")}
          onOpenAuditSubs={() => setIsAuditDialogOpen(true)}
        />
      </Grid>

      {/* Dialogs */}
      <ExpandedSectionDialog
        expandedSection={expandedSection}
        onClose={() => setExpandedSection(null)}
        boxScoreTable={boxScoreTable}
        shotChartFilters={null}
        shotChartCourt={null}
        scoreFlowChart={null}
        lineupTable={lineupTable}
      />

      {gameId && (
        <SubstitutionAuditDialog
          open={isAuditDialogOpen}
          onClose={() => setIsAuditDialogOpen(false)}
          gameId={gameId}
          players={players}
          jerseyMap={shotChartJerseyMap}
        />
      )}

      <EditGameDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        editOpponent={editOpponent}
        setEditOpponent={setEditOpponent}
        editOpponentLogoUrl={editOpponentLogoUrl}
        setEditOpponentLogoUrl={setEditOpponentLogoUrl}
        editDate={editDate}
        setEditDate={setEditDate}
        editTime={editTime}
        setEditTime={setEditTime}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        onSave={handleUpdateGame}
        onDeleteClick={() => {
          setOpenEditDialog(false);
          setIsDeleteDialogOpen(true);
        }}
      />

      <PracticePlannerDialog
        open={isPracticePlannerOpen}
        onClose={() => setIsPracticePlannerOpen(false)}
        practiceFocusAreas={practiceFocusAreas}
      />

      <DefensiveIntegrityDialog
        open={isDefensiveIntegrityOpen}
        onClose={() => setIsDefensiveIntegrityOpen(false)}
        defensiveIntegrity={defensiveIntegrity}
      />

      <DeleteGameDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteGame}
      />
    </Box>
  );
};

export default GameStats;
