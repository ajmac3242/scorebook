/**
 * @file GameMode.tsx
 * @description The live game tracking interface.
 * Thin composition layer: reads from useGameMode + useGameModeActions,
 * wires UI-only handlers, and assembles the layout.
 * All DB mutations are in useGameModeActions.
 * All sub-sections are delegated to /GameMode/ sub-components.
 */
import React, { useEffect, useCallback } from "react";
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
  Alert,
  Snackbar,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import {
  SportsBasketball,
  Undo as UndoIcon,
  Warning,
  Check,
  Close,
  PanTool,
  SwapHoriz,
  FlashOn,
  Shield,
  ArrowBack,
  HelpOutlined,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import RecentActionItem from "../components/RecentActionItem";
import QuickSubDialog from "../components/QuickSubDialog";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../components/HalftimeReportDialog";
import { ClutchPerformanceHUD } from "../components/ClutchPerformanceHUD";
import DefensiveBreakdownDialog from "../components/DefensiveBreakdownDialog";
import PlaybookEfficiencyWidget from "../components/PlaybookEfficiencyWidget";
import { TacticalAlertsSidebar } from "../components/TacticalAlertsSidebar";
import { TacticalIdentityHUD } from "../components/TacticalIdentityHUD";
import { VerifiedPeriodModal } from "../components/VerifiedPeriodModal";
import { PlayerStatRow } from "../components/PlayerStatRow";
import { Scoreboard } from "../components/Scoreboard";
import { TeamStatsCard } from "../components/TeamStatsCard";
import { ActionControls } from "../components/ActionControls";
import { MoleskineCard } from "../components/SharedUI";
import { EditClockDialog } from "../components/EditClockDialog";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
  SITUATIONS,
} from "../constants/stats";
import { type PlayerAggregates, getPlayerDisplayName } from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { detectShotValueFromCoords } from "../utils/courtUtils";
import { pulse } from "../styles/animations";
import { useGameMode } from "../hooks/useGameMode";
import { useGameModeActions } from "../hooks/useGameModeActions";
import {
  VoiceModeBanner,
  TrackingModeToolbar,
  CourtMarkerFilters,
  MatchupAnalyticsCard,
  LiveLineupCard,
  SparkPlugTable,
  DefensiveSchemeSelector,
  OffensiveKPICard,
  QuickAction,
} from "./GameMode/index";

/** Displays bonus/foul status chip for opponent when an opponent player is selected. */
const OpponentBonusChip: React.FC<{
  selectedPlayerId: string | null;
  oppFouls: number;
  periodType: string;
}> = ({ selectedPlayerId, oppFouls, periodType }) => {
  const pId = selectedPlayerId || "";
  const isOpp =
    pId === SPECIAL_PLAYER_IDS.OPPONENT ||
    pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
  if (!isOpp) return null;
  const foulsRequired = periodType === "QUARTERS" ? 5 : 7;
  if (oppFouls >= foulsRequired)
    return <Chip label="IN BONUS" size="small" color="error" />;
  if (oppFouls === foulsRequired - 1)
    return <Chip label="NEXT: BONUS" size="small" color="warning" />;
  return null;
};

const GameMode: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const gameId = searchParams.get("gameId");
  const teamId = searchParams.get("teamId");
  const lastEnergyAlertRef = React.useRef<string | null>(null);

  const {
    selectedX,
    setSelectedX,
    selectedY,
    setSelectedY,
    isDialogOpen,
    setIsDialogOpen,
    selectedPlayerId,
    setSelectedPlayerId,
    statType,
    setStatType,
    points,
    setPoints,
    playName,
    setPlayName,
    shotQuality,
    setShotQuality,
    clockSeconds,
    setClockSeconds,
    isClockRunning,
    setIsClockRunning,
    sortConfig,
    setSortConfig,
    markerFilter,
    setMarkerFilter,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    statToDelete,
    setStatToDelete,
    isEditing,
    setIsEditing,
    editingStatId,
    setEditingStatId,
    isEndGameDialogOpen,
    setIsEndGameDialogOpen,
    isClockEditDialogOpen,
    setIsClockEditDialogOpen,
    setIsSummaryDialogOpen,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isFtWorkflowOpen,
    setIsFtWorkflowOpen,
    isVerificationOpen,
    handleVerifyPeriod,
    situation,
    setSituation,
    opponentPlayType,
    setOpponentPlayType,
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    voiceEnabled,
    setVoiceEnabled,
    isListening,
    lastTranscript,
    matchupEfficiency,
    sparkPlugIndex,
    showMatchupMatrix,
    setShowMatchupMatrix,
    setLastOpponentStatId,
    isDeleting,
    setIsDeleting,
    isEnding,
    setIsEnding,
    isSavingStat,
    setIsSavingStat,
    isSavingSub,
    setIsSavingSub,
    chainPrompt,
    setChainPrompt,
    snackbar,
    setSnackbar,
    isSubDialogOpen,
    setIsSubDialogOpen,
    setSubOutPlayerId,
    draftOnCourtIds,
    setDraftOnCourtIds,
    selectedSwapId,
    setSelectedSwapId,
    period,
    setPeriod,
    trackingMode,
    setTrackingMode,
    players,
    playerNamesMap,
    game,
    team,
    teamSeasonStats,
    isReadOnly,
    periodType,
    periodLabel,
    maxPeriod,
    sortedGameStats,
    gameData,
    jerseyMap,
    sortedStatsGridData,
    statsMap,
    matchups,
    opponentStats,
    halftimeStats,
    playerStreaks,
    playbookEfficiency,
    markers,
    shotROI,
    isClutchMode,
    clutchStats,
    paintTouchStats,
    haltAlerts,
  } = useGameMode(gameId, teamId);

  // ─── DB Action Handlers (via useGameModeActions) ──────────────────────────────

  const {
    handleUndo,
    handleEndGame,
    handleSaveStat,
    handleDeleteStat,
    handleQuickSub,
    handleTogglePossession,
    handleOpponentTurnover,
    handleChainAction,
  } = useGameModeActions({
    gameId,
    period,
    clockSeconds,
    isReadOnly,
    trackingMode,
    isEditing,
    editingStatId,
    selectedPlayerId,
    statType,
    points,
    playName,
    shotQuality,
    situation,
    opponentPlayType,
    selectedX,
    selectedY,
    matchups,
    game,
    gameData,
    draftOnCourtIds,
    chainPrompt,
    statToDelete,
    isSavingSub,
    setSnackbar,
    setIsDialogOpen,
    setStatType,
    setPlayName,
    setSituation,
    setOpponentPlayType,
    setIsEditing,
    setEditingStatId,
    setSelectedPlayerId,
    setLastOpponentStatId,
    setIsBreakdownDialogOpen,
    setChainPrompt,
    setIsFtWorkflowOpen,
    setIsSavingStat,
    setIsEnding,
    setIsEndGameDialogOpen,
    setIsSummaryDialogOpen,
    setIsDeleting,
    setIsDeleteDialogOpen,
    setStatToDelete,
    setIsSubDialogOpen,
    setIsSavingSub,
  });

  // ─── UI-Only Handlers (stay in page) ─────────────────────────────────────────

  // Keyboard shortcut: Ctrl+Z / Cmd+Z → Undo
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

  const handleCourtClick = useCallback(
    (x: number, y: number) => {
      if (isReadOnly) return;
      setSelectedX(x);
      setSelectedY(y);
      setPoints(detectShotValueFromCoords(x, y));
      setSelectedPlayerId(
        trackingMode === "OPPONENT" ? SPECIAL_PLAYER_IDS.OPPONENT : null,
      );
      setIsDialogOpen(true);
    },
    [
      isReadOnly,
      trackingMode,
      setSelectedX,
      setSelectedY,
      setPoints,
      setSelectedPlayerId,
      setIsDialogOpen,
    ],
  );

  const handleSwapClick = useCallback(
    (id: string) => {
      if (!selectedSwapId || selectedSwapId === id) {
        setSelectedSwapId(selectedSwapId === id ? null : id);
        return;
      }
      const isAOnCourt =
        draftOnCourtIds.has(selectedSwapId) ||
        selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");
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
    [selectedSwapId, draftOnCourtIds, setSelectedSwapId, setDraftOnCourtIds],
  );

  const openEditDialog = useCallback(
    (stat: StatEvent) => {
      if (isReadOnly) return;
      setEditingStatId(stat.id ?? null);
      setSelectedPlayerId(stat.playerId as string);
      setStatType(stat.type);
      setPoints(stat.points || 2);
      setPlayName(stat.playName || "");
      setShotQuality(stat.shotQuality || null);
      setSituation(stat.situation || null);
      setSelectedX(stat.locationX || 0);
      setSelectedY(stat.locationY || 0);
      setIsEditing(true);
      setIsDialogOpen(true);
    },
    [
      isReadOnly,
      setEditingStatId,
      setSelectedPlayerId,
      setStatType,
      setPoints,
      setPlayName,
      setShotQuality,
      setSituation,
      setSelectedX,
      setSelectedY,
      setIsEditing,
      setIsDialogOpen,
    ],
  );

  const handleEditClock = useCallback(
    async (mins: number, secs: number) => {
      const totalSeconds = mins * 60 + secs;
      setClockSeconds(totalSeconds);
      if (gameId) {
        try {
          await db.games.update(gameId, { clockTime: totalSeconds, synced: 0 });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
      setIsClockEditDialogOpen(false);
    },
    [gameId, setClockSeconds, setIsClockEditDialogOpen],
  );

  const handleNextPeriod = useCallback(async () => {
    const nextPeriod = period < 10 ? period + 1 : 1;
    setPeriod(nextPeriod);
    const nextSeconds = (periodType === "QUARTERS" ? 10 : 20) * 60;
    setClockSeconds(nextSeconds);
    setIsClockRunning(false);
    if (gameId) {
      try {
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
  }, [
    gameId,
    period,
    periodType,
    setPeriod,
    setClockSeconds,
    setIsClockRunning,
  ]);

  const handleTimeout = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId,
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

  const handleLineupPlayerClick = useCallback(
    (playerId: string) => {
      setSubOutPlayerId(playerId);
      setIsSubDialogOpen(true);
    },
    [setSubOutPlayerId, setIsSubDialogOpen],
  );

  const handleEmptySlotClick = useCallback(
    (slotId: string) => {
      setSubOutPlayerId(slotId);
      setIsSubDialogOpen(true);
    },
    [setSubOutPlayerId, setIsSubDialogOpen],
  );

  const handleQuickActionClick = useCallback(
    (type: string | null) => setStatType(type),
    [setStatType],
  );

  // ─── Energy Alert Effect ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameId || !teamId) {
      navigate("/");
      return;
    }
    const topSpark = sparkPlugIndex[0];
    if (topSpark && topSpark.compositeIndex >= 12 && !isReadOnly) {
      const alertKey = `${topSpark.playerId}-${topSpark.compositeIndex}`;
      if (lastEnergyAlertRef.current !== alertKey) {
        lastEnergyAlertRef.current = alertKey;
        const pName =
          playerNamesMap.get(topSpark.playerId)?.split(" ")[0] || "Player";
        const jersey = jerseyMap.get(topSpark.playerId);
        setSnackbar({
          open: true,
          message: `🔥 ENERGY ALERT: #${jersey} ${pName} is providing a massive Spark Plug impact!`,
          severity: "info",
        });
      }
    }
  }, [
    gameId,
    teamId,
    navigate,
    sparkPlugIndex,
    playerNamesMap,
    jerseyMap,
    isReadOnly,
    setSnackbar,
  ]);

  if (!gameId || !teamId) return null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ pb: 4, opacity: isReadOnly ? 0.7 : 1 }}>
      {isReadOnly && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          This game is in read-only mode because it or its parent is pending
          deletion.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left Column: Court + Controls ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          {voiceEnabled && (
            <VoiceModeBanner
              isListening={isListening}
              lastTranscript={lastTranscript}
            />
          )}

          <Box
            sx={{ mb: 2, bgcolor: "rgba(0,0,0,0.02)", p: 1, borderRadius: 2 }}
          >
            <TacticalIdentityHUD
              kpis={[
                {
                  name: "paint_touches",
                  label: "Paint Touches",
                  value: paintTouchStats.total,
                  target: 25,
                },
                {
                  name: "efg",
                  label: "eFG%",
                  value: Math.round(parseFloat(gameData.teamPpp) * 50),
                  target: 52,
                  isPercentage: true,
                },
                {
                  name: "stop_pct",
                  label: "Stop %",
                  value: gameData.defensiveStats.stopPct,
                  target: 60,
                  isPercentage: true,
                },
              ]}
            />
          </Box>

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
              if (!isReadOnly) setIsClockEditDialogOpen(true);
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
                onQuickSub={() => setIsSubDialogOpen(true)}
                onFtWorkflow={() => {
                  if (selectedPlayerId) {
                    setIsFtWorkflowOpen(true);
                  } else {
                    setSnackbar({
                      open: true,
                      message: "Select a player first",
                      severity: "warning",
                    });
                  }
                }}
                onAuditSubs={() => setIsAuditDialogOpen(true)}
                onTimeout={handleTimeout}
                onNextPeriod={handleNextPeriod}
                onTogglePossession={() => handleTogglePossession()}
                onOpponentTurnover={handleOpponentTurnover}
                possessionState={gameData.possessionState}
                recentStatsLength={gameData.recentStats.length}
                onEndGame={() => setIsEndGameDialogOpen(true)}
                isGameCompleted={!!game?.completed}
                isEnding={isEnding}
              />
              <TrackingModeToolbar
                trackingMode={trackingMode}
                onTrackingModeChange={(val) => {
                  if (val) setTrackingMode(val as "TEAM" | "OPPONENT");
                }}
                voiceEnabled={voiceEnabled}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                isReadOnly={isReadOnly}
                game={game}
                team={team}
              />
            </Box>

            <CourtMarkerFilters
              markerFilter={markerFilter}
              onFilterChange={(f) => setMarkerFilter(f)}
            />

            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={markers}
            />

            {isMobile && !isReadOnly && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  textAlign: "center",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                Tip: Tap the court to record a play at that location
              </Typography>
            )}
          </MoleskineCard>
        </Grid>

        {/* ── Right Column: Analytics + Lineup ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {isClutchMode && (
              <MoleskineCard
                sx={{
                  bgcolor: "rgba(211,47,47,0.05)",
                  border: "2px solid",
                  borderColor: "error.main",
                  animation: `${pulse} 4s infinite ease-in-out`,
                }}
              >
                <ClutchPerformanceHUD
                  onCourtStats={clutchStats.filter((p) =>
                    gameData.onCourtIds.has(p.id.toString()),
                  )}
                  jerseyMap={jerseyMap}
                />
              </MoleskineCard>
            )}

            <MoleskineCard>
              <TacticalAlertsSidebar alerts={haltAlerts} />
            </MoleskineCard>

            <MatchupAnalyticsCard
              matchupEfficiency={matchupEfficiency}
              showMatchupMatrix={showMatchupMatrix}
              onToggleMatrix={() => setShowMatchupMatrix(!showMatchupMatrix)}
              opponents={opponentStats}
              matchups={matchups}
              jerseyMap={jerseyMap}
              players={players}
              onCourtIds={gameData.onCourtIds}
              gameId={gameId}
              game={game}
            />

            <TeamStatsCard
              defensiveStats={gameData.defensiveStats}
              teamPpp={gameData.teamPpp}
              oppPpp={gameData.oppPpp}
              livePace={gameData.livePace}
              refTightness={gameData.refTightness}
              activeSchemePpp={
                gameData.schemeEfficiency.find(
                  (s) => s.name === game?.activeDefensiveScheme,
                )?.ppp
              }
            />

            <OffensiveKPICard
              paintTouchStats={paintTouchStats}
              shotROI={shotROI}
            />

            <DefensiveSchemeSelector
              activeScheme={game?.activeDefensiveScheme}
              gameId={gameId}
              isReadOnly={isReadOnly}
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
                <LiveLineupCard
                  players={players}
                  onCourtIds={gameData.onCourtIds}
                  game={game}
                  team={team}
                  statsMap={statsMap}
                  jerseyMap={jerseyMap}
                  currentLineupStintDuration={
                    gameData.currentLineupStintDuration
                  }
                  currentLineupPlusMinus={gameData.currentLineupPlusMinus}
                  period={period}
                  isReadOnly={isReadOnly}
                  chainPrompt={chainPrompt}
                  playerStreaks={playerStreaks}
                  stintDurations={gameData.stintDurations}
                  periodFoulMap={gameData.onCourtPeriodFouls}
                  onPlayerClick={handleLineupPlayerClick}
                  onEmptySlotClick={handleEmptySlotClick}
                  onChainAction={handleChainAction}
                  onDismissChain={() => setChainPrompt(null)}
                />

                <MoleskineCard>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Player Performance
                  </Typography>
                  <SparkPlugTable
                    sparkPlugIndex={sparkPlugIndex}
                    jerseyMap={jerseyMap}
                    playerNamesMap={playerNamesMap}
                  />
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small" aria-label="Player stats">
                      <TableHead>
                        <TableRow>
                          {[
                            {
                              label: "#",
                              key: "jerseyNumber",
                              desc: "Jersey Number",
                            },
                            { label: "NAME", key: "name", desc: "Player Name" },
                            {
                              label: "MIN",
                              key: "min",
                              desc: "Minutes Played",
                            },
                            {
                              label: "PTS",
                              key: "points",
                              desc: "Points Scored",
                            },
                            {
                              label: "REB",
                              key: "rebounds",
                              desc: "Total Rebounds",
                            },
                            { label: "AST", key: "assists", desc: "Assists" },
                            {
                              label: "PF",
                              key: "fouls",
                              desc: "Personal Fouls",
                            },
                            {
                              label: "+/-",
                              key: "plusMinus",
                              desc: "Plus/Minus Rating",
                            },
                          ].map((head) => (
                            <TableCell
                              key={head.key}
                              sx={{ fontSize: "0.6rem", fontWeight: 800 }}
                            >
                              <Tooltip title={head.desc}>
                                <TableSortLabel
                                  active={sortConfig.key === head.key}
                                  direction={
                                    sortConfig.key === head.key
                                      ? sortConfig.direction
                                      : "asc"
                                  }
                                  onClick={() =>
                                    setSortConfig({
                                      key: head.key as keyof PlayerAggregates,
                                      direction:
                                        sortConfig.key === head.key &&
                                        sortConfig.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    })
                                  }
                                >
                                  {head.label}
                                </TableSortLabel>
                              </Tooltip>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedStatsGridData.map((row) => (
                          <PlayerStatRow
                            key={row.id}
                            jerseyNumber={row.jerseyNumber ?? ""}
                            name={row.name}
                            isOnCourt={gameData.onCourtIds.has(String(row.id))}
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
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MoleskineCard>
              </>
            ) : (
              /* ── Opponent Scouting Panel ── */
              <MoleskineCard>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  {game?.opponent || "Opponent"} Scouting
                </Typography>
                {opponentStats.length > 0 ? (
                  opponentStats.map((opp) => (
                    <Box
                      key={opp.id}
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mb: 1, alignItems: "center" }}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: "0.7rem",
                            bgcolor: opp.isHot ? "error.main" : "primary.main",
                          }}
                        >
                          {opp.jersey}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 800, display: "block" }}
                          >
                            Opponent #{opp.jersey}
                            {opp.isHot && (
                              <span style={{ marginLeft: 4 }}>🔥</span>
                            )}
                            {opp.isClutchThreat && (
                              <Chip
                                label="CLUTCH"
                                size="small"
                                color="error"
                                sx={{
                                  ml: 0.5,
                                  height: 16,
                                  fontSize: "0.55rem",
                                }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {opp.points} pts | {opp.makes}-{opp.attempts} FG |{" "}
                            {opp.turnovers} TO
                          </Typography>
                          {opp.straightPoints >= 4 && (
                            <Chip
                              label={`${opp.straightPoints}-0 RUN`}
                              size="small"
                              color="warning"
                              sx={{ ml: 0.5, height: 16, fontSize: "0.55rem" }}
                            />
                          )}
                        </Box>
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                      >
                        Primary Defender
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ flexWrap: "wrap" }}
                      >
                        {players
                          .filter((p) => gameData.onCourtIds.has(p.id!))
                          .map((p) => (
                            <Button
                              key={p.id}
                              variant={
                                matchups[opp.id] === p.id
                                  ? "contained"
                                  : "outlined"
                              }
                              size="small"
                              onClick={async () => {
                                if (!gameId) return;
                                const newMatchups = {
                                  ...(game?.matchups || {}),
                                  [opp.id]:
                                    matchups[opp.id] === p.id ? "" : p.id!,
                                };
                                await db.games.update(gameId, {
                                  matchups: newMatchups,
                                  synced: 0,
                                });
                                await syncService.pushUpdates();
                              }}
                              sx={{
                                minWidth: 0,
                                p: 0.5,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                height: 24,
                              }}
                            >
                              #{jerseyMap.get(p.id!)}
                            </Button>
                          ))}
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      No opponent players tracked yet.
                    </Typography>
                    <Alert
                      severity="info"
                      sx={{ textAlign: "left", fontSize: "0.7rem" }}
                    >
                      <strong>QUICK TIP</strong> — Tap the court in Opponent
                      mode to record stats for specific jersey numbers.
                    </Alert>
                  </Box>
                )}
              </MoleskineCard>
            )}

            {/* ── Recent Actions ── */}
            <MoleskineCard>
              <Stack
                direction="row"
                sx={{
                  mb: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, color: "text.secondary" }}
                >
                  Recent Actions
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ fontSize: "0.7rem" }}>
                      <strong>KEYBOARD SHORTCUTS</strong>
                      <br />
                      M: Make &nbsp; X: Miss &nbsp; A: Assist
                      <br />
                      O/D: Rebound &nbsp; T: Turnover
                      <br />
                      S: Steal &nbsp; B: Block &nbsp; F: Foul
                      <br />
                      P: Paint &nbsp; Space: Clock
                      <br />
                      Ctrl+Z: Undo last
                    </Box>
                  }
                >
                  <IconButton size="small">
                    <HelpOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              {gameData.recentStats.filter((s) => !s.deletedAt).length === 0 ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <SportsBasketball
                    sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Ready for Tip-off
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Tap the court or use quick actions to record live game
                    stats.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SportsBasketball />}
                    onClick={() => setIsDialogOpen(true)}
                    sx={{ mt: 1, fontWeight: 800 }}
                  >
                    Record First Action
                  </Button>
                </Box>
              ) : (
                gameData.recentStats.map((s, index) => (
                  <RecentActionItem
                    key={s.id || index}
                    stat={s}
                    playerName={
                      playerNamesMap.get(s.playerId as string) ??
                      game?.opponent ??
                      "Opponent"
                    }
                    periodLabel={periodLabel}
                    isReadOnly={isReadOnly}
                    isLatest={index === 0}
                    onEdit={openEditDialog}
                    onDelete={(id) => {
                      setStatToDelete(id);
                      setIsDeleteDialogOpen(true);
                    }}
                  />
                ))
              )}
            </MoleskineCard>
          </Stack>
        </Grid>
      </Grid>

      {/* ─── Stat Entry Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
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
            return;
          }
          if (isSavingStat) return;
          const key = e.key.toLowerCase();
          const actionMap: Record<string, string> = {
            m: ACTION_TYPES.MAKE,
            x: ACTION_TYPES.MISS,
            o: ACTION_TYPES.OFF_REBOUND,
            d: ACTION_TYPES.DEF_REBOUND,
            a: ACTION_TYPES.ASSIST,
            t: ACTION_TYPES.TURNOVER,
            s: ACTION_TYPES.STEAL,
            b: ACTION_TYPES.BLOCK,
            f: ACTION_TYPES.FOUL_SHOOTING,
          };
          if (actionMap[key]) setStatType(actionMap[key]);
          if (key === "p") setStatType(ACTION_TYPES.PAINT_TOUCH);
        }}
      >
        <DialogTitle>{isEditing ? "Edit Action" : "Record Action"}</DialogTitle>
        <DialogContent>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mb: 2, alignItems: "center" }}
            id="stat-dialog-player-info"
          >
            <Avatar sx={{ bgcolor: "primary.main", fontWeight: 900 }}>
              {selectedPlayerId
                ? trackingMode === "OPPONENT"
                  ? "OP"
                  : jerseyMap.get(selectedPlayerId) || "?"
                : "?"}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {selectedPlayerId
                  ? getPlayerDisplayName(
                      selectedPlayerId,
                      playerNamesMap,
                      game?.opponent,
                      team?.name,
                    )
                  : "Select a player..."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {periodLabel} {period} | {formatClock(clockSeconds)}
              </Typography>
            </Box>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              display: "block",
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            Action Type
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mb: 2,
            }}
          >
            {[
              { type: ACTION_TYPES.MAKE, label: "Make (M)", icon: Check },
              { type: ACTION_TYPES.MISS, label: "Miss (X)", icon: Close },
              {
                type: ACTION_TYPES.OFF_REBOUND,
                label: "Off Reb (O)",
                icon: SportsBasketball,
              },
              {
                type: ACTION_TYPES.DEF_REBOUND,
                label: "Def Reb (D)",
                icon: SportsBasketball,
              },
              { type: ACTION_TYPES.ASSIST, label: "Assist (A)", icon: PanTool },
              {
                type: ACTION_TYPES.TURNOVER,
                label: "Turnover (T)",
                icon: SwapHoriz,
              },
              { type: ACTION_TYPES.STEAL, label: "Steal (S)", icon: FlashOn },
              { type: ACTION_TYPES.BLOCK, label: "Block (B)", icon: ArrowBack },
              {
                type: ACTION_TYPES.FOUL_SHOOTING,
                label: "S. Foul (F)",
                icon: Warning,
              },
              {
                type: ACTION_TYPES.FLOOR_DIVE,
                label: "Floor Dive",
                icon: SportsBasketball,
              },
              {
                type: ACTION_TYPES.CHARGE_TAKEN,
                label: "Charge",
                icon: PanTool,
              },
              {
                type: ACTION_TYPES.GREAT_CONTEST,
                label: "Contest",
                icon: Shield,
              },
              {
                type: ACTION_TYPES.PAINT_TOUCH,
                label: "Paint Touch (P)",
                icon: SportsBasketball,
              },
            ].map((action) => (
              <QuickAction
                key={action.type}
                type={action.type}
                label={action.label}
                icon={action.icon}
                statType={statType}
                onClick={handleQuickActionClick}
              />
            ))}
          </Box>

          {trackingMode === "TEAM" && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Who?
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {players
                  .filter((p) => gameData.onCourtIds.has(p.id!))
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        selectedPlayerId === p.id ? "contained" : "outlined"
                      }
                      size="small"
                      onClick={() => setSelectedPlayerId(p.id!)}
                      sx={{
                        minWidth: 0,
                        fontWeight: 700,
                        borderColor: "#D1D1D1",
                      }}
                    >
                      {jerseyMap.get(p.id!)}
                    </Button>
                  ))}
              </Stack>
            </Box>
          )}

          {trackingMode === "OPPONENT" && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Opponent Jersey # (Optional)
              </Typography>
              <Stack direction="row" sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
                {[
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "10",
                  "11",
                  "12",
                  "23",
                  "24",
                  "30",
                  "32",
                  "33",
                  "34",
                  "35",
                ].map((num) => {
                  const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
                  return (
                    <Button
                      key={num}
                      variant={
                        selectedPlayerId === oppId ? "contained" : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        setSelectedPlayerId(
                          selectedPlayerId === oppId
                            ? SPECIAL_PLAYER_IDS.OPPONENT
                            : oppId,
                        )
                      }
                      sx={{
                        minWidth: 40,
                        fontWeight: 700,
                        borderColor: "#D1D1D1",
                      }}
                    >
                      {num}
                    </Button>
                  );
                })}
              </Stack>
              <OpponentBonusChip
                selectedPlayerId={selectedPlayerId}
                oppFouls={gameData.teamFoulStats.oppFouls}
                periodType={periodType}
              />
            </Box>
          )}

          {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
            trackingMode === "TEAM" &&
            team?.playbook &&
            team.playbook.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Offensive Play
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
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
                </Stack>
              </Box>
            )}

          {(statType === ACTION_TYPES.MAKE ||
            statType === ACTION_TYPES.MISS) && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Shot Quality
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {Object.values(SHOT_QUALITY).map((q) => (
                    <Chip
                      key={q}
                      label={q}
                      size="small"
                      onClick={() =>
                        setShotQuality(shotQuality === q ? null : q)
                      }
                      color={shotQuality === q ? "primary" : "default"}
                      variant={shotQuality === q ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Situation
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {Object.values(SITUATIONS).map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      size="small"
                      onClick={() => setSituation(situation === s ? null : s)}
                      color={situation === s ? "primary" : "default"}
                      variant={situation === s ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {statType === ACTION_TYPES.MAKE && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Points
              </Typography>
              <Stack direction="row" sx={{ gap: 0.5 }}>
                {[1, 2, 3].map((pt) => (
                  <Button
                    key={pt}
                    variant={points === pt ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setPoints(pt)}
                    sx={{ minWidth: 40, fontWeight: 800 }}
                  >
                    {pt}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
            trackingMode === "OPPONENT" && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Opponent Play Type
                </Typography>
                <ToggleButtonGroup
                  value={opponentPlayType}
                  exclusive
                  onChange={(_, val) => setOpponentPlayType(val)}
                  size="small"
                  fullWidth
                >
                  {["ISO", "P&R", "POST", "SPOT", "TRANSITION"].map((pt) => (
                    <ToggleButton
                      key={pt}
                      value={pt}
                      sx={{ fontSize: "0.65rem" }}
                    >
                      {pt}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDialogOpen(false)}
            disabled={isSavingStat}
          >
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

      {/* ─── Confirm Delete Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Action?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will be permanently removed. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
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

      {/* ─── End Game Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={isEndGameDialogOpen}
        onClose={() => setIsEndGameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Finalize Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will mark the game as complete and lock all stats. You can
            still view them afterward.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsEndGameDialogOpen(false)}
            disabled={isEnding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEndGame}
            variant="contained"
            color="primary"
            disabled={isEnding}
          >
            {isEnding ? "Finalizing..." : "Finalize Game"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Other Dialogs ────────────────────────────────────────────────────── */}
      <EditClockDialog
        open={isClockEditDialogOpen}
        initialMinutes={Math.floor(clockSeconds / 60)}
        initialSeconds={clockSeconds % 60}
        onSave={handleEditClock}
        onClose={() => setIsClockEditDialogOpen(false)}
      />
      <QuickSubDialog
        open={isSubDialogOpen}
        players={players}
        team={team}
        game={game}
        draftOnCourtIds={draftOnCourtIds}
        selectedSwapId={selectedSwapId}
        jerseyMap={jerseyMap}
        statsMap={statsMap}
        isSaving={isSavingSub}
        handleSwapClick={handleSwapClick}
        handleQuickSub={handleQuickSub}
        onClose={() => setIsSubDialogOpen(false)}
      />
      <SubstitutionAuditDialog
        open={isAuditDialogOpen}
        gameId={gameId}
        players={players}
        jerseyMap={jerseyMap}
        onClose={() => setIsAuditDialogOpen(false)}
      />
      <FreeThrowWorkflowDialog
        open={isFtWorkflowOpen}
        playerId={selectedPlayerId ?? ""}
        gameId={gameId}
        period={period}
        clockTime={clockSeconds}
        onClose={() => setIsFtWorkflowOpen(false)}
      />
      <HalftimeReportDialog
        open={isHalftimeReportOpen}
        teamPpp={gameData.teamPpp}
        oppPpp={gameData.oppPpp}
        seasonPpp={teamSeasonStats.ppp}
        topLineups={halftimeStats.lineupStats.slice(0, 3)}
        bottomLineups={halftimeStats.lineupStats.slice(-3)}
        opponentThreats={gameData.momentumAlerts.opponentThreats}
        schemeEfficiency={halftimeStats.schemeEfficiency}
        jerseyMap={jerseyMap}
        onClose={() => setIsHalftimeReportOpen(false)}
      />
      <DefensiveBreakdownDialog
        open={isBreakdownDialogOpen}
        onClose={(reason?: string) => {
          setIsBreakdownDialogOpen(false);
          if (reason) logger.info("Defensive breakdown:", reason);
        }}
      />
      <VerifiedPeriodModal
        open={isVerificationOpen}
        period={period}
        periodLabel={periodLabel}
        appScore={{ team: gameData.currentScore, opp: gameData.opponentScore }}
        appFouls={{
          team: gameData.teamFoulStats.teamFouls,
          opp: gameData.teamFoulStats.oppFouls,
        }}
        onVerify={handleVerifyPeriod}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          snackbar.action === "UNDO" ? (
            <Button
              size="small"
              color="inherit"
              startIcon={<UndoIcon />}
              onClick={handleUndo}
            >
              Undo
            </Button>
          ) : undefined
        }
      />
    </Box>
  );
};

export default GameMode;
