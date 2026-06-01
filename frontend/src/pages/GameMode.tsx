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
  useTheme,
  Alert,
  Snackbar,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  Undo as UndoIcon,
  Warning,
  SportsBasketball,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import QuickSubDialog from "../components/QuickSubDialog";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../components/HalftimeReportDialog";
import { ClutchPerformanceHUD } from "../components/ClutchPerformanceHUD";
import DefensiveBreakdownDialog from "../components/DefensiveBreakdownDialog";
import { TacticalAlertsSidebar } from "../components/TacticalAlertsSidebar";
import { TacticalIdentityHUD } from "../components/TacticalIdentityHUD";
import { VerifiedPeriodModal } from "../components/VerifiedPeriodModal";
import { Scoreboard } from "../components/Scoreboard";
import { TeamStatsCard } from "../components/TeamStatsCard";
import { ActionControls } from "../components/ActionControls";
import { MoleskineCard } from "../components/SharedUI";
import { EditClockDialog } from "../components/EditClockDialog";
import { type StatEvent } from "../db";
import { logger } from "../utils/logger";
import { SPECIAL_PLAYER_IDS } from "../constants/stats";
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
  DefensiveSchemeSelector,
  OffensiveKPICard,
  OpponentBonusChip,
} from "./GameMode/index";
import { StatEntryDialog } from "./GameMode/dialogs/StatEntryDialog";
import { ConfirmDeleteDialog } from "./GameMode/dialogs/ConfirmDeleteDialog";
import { EndGameDialog } from "./GameMode/dialogs/EndGameDialog";
import { PlayerPerformancePanel } from "./GameMode/panels/PlayerPerformancePanel";
import { OpponentScoutingPanel } from "./GameMode/panels/OpponentScoutingPanel";
import { RecentActionsPanel } from "./GameMode/panels/RecentActionsPanel";
import { useGameClock } from "./GameMode/hooks/useGameClock";
import { useGameTimeout } from "./GameMode/hooks/useGameTimeout";
import { useMatchupAssignment } from "./GameMode/hooks/useMatchupAssignment";

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

  // ─── Focused Hooks ──────────────────────────────────────────────────────────

  const { handleEditClock, handleNextPeriod } = useGameClock({
    gameId,
    period,
    periodType,
    setPeriod,
    setClockSeconds,
    setIsClockRunning,
    setIsClockEditDialogOpen,
  });

  const { handleTimeout } = useGameTimeout({
    gameId,
    isReadOnly,
    trackingMode,
    period,
    clockSeconds,
  });

  const { handleAssignDefender } = useMatchupAssignment({
    gameId,
    game,
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
        <Grid item size={{ xs: 12, md: 8 }}>
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
        <Grid item size={{ xs: 12, md: 4 }}>
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

            <LiveLineupCard
              players={players}
              onCourtIds={gameData.onCourtIds}
              game={game}
              team={team}
              statsMap={statsMap}
              jerseyMap={jerseyMap}
              currentLineupStintDuration={gameData.currentLineupStintDuration}
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

            {trackingMode === "TEAM" ? (
              <PlayerPerformancePanel
                sortedStatsGridData={sortedStatsGridData}
                sortConfig={sortConfig}
                onSortChange={(key) =>
                  setSortConfig({
                    key,
                    direction:
                      sortConfig.key === key && sortConfig.direction === "asc"
                        ? "desc"
                        : "asc",
                  })
                }
                jerseyMap={jerseyMap}
                draftOnCourtIds={gameData.onCourtIds}
                chainPrompt={chainPrompt}
                onChainPromptDismiss={() => setChainPrompt(null)}
                onChainAction={handleChainAction}
                playbookEfficiency={playbookEfficiency}
                team={team}
                gameId={gameId || ""}
                period={period}
                clockSeconds={clockSeconds}
                isReadOnly={isReadOnly}
                sparkPlugIndex={sparkPlugIndex}
                playerNamesMap={playerNamesMap}
                teamPpp={gameData.teamPpp}
                sortedGameStats={sortedGameStats}
                trackingMode={trackingMode}
              />
            ) : (
              <OpponentScoutingPanel
                opponentStats={opponentStats}
                game={game}
                players={players}
                draftOnCourtIds={gameData.onCourtIds}
                jerseyMap={jerseyMap}
                matchups={matchups}
                gameId={gameId || ""}
                onAssignDefender={handleAssignDefender}
              />
            )}

            <RecentActionsPanel
              recentStats={gameData.recentStats}
              playerNamesMap={playerNamesMap}
              jerseyMap={jerseyMap}
              isReadOnly={isReadOnly}
              onDeleteRequest={(id) => {
                setStatToDelete(id);
                setIsDeleteDialogOpen(true);
              }}
              onEditRequest={openEditDialog}
              onRecordFirstAction={() => setIsDialogOpen(true)}
              periodLabel={periodLabel}
              opponentName={game?.opponent}
            />
          </Stack>
        </Grid>
      </Grid>

      <StatEntryDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveStat}
        isEditing={isEditing}
        isSavingStat={isSavingStat}
        trackingMode={trackingMode}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
        players={players}
        jerseyMap={jerseyMap}
        draftOnCourtIds={gameData.onCourtIds}
        playerNamesMap={playerNamesMap}
        game={game}
        team={team}
        statType={statType}
        setStatType={setStatType}
        points={points}
        setPoints={setPoints}
        playName={playName}
        setPlayName={setPlayName}
        shotQuality={shotQuality}
        setShotQuality={setShotQuality}
        situation={situation}
        setSituation={setSituation}
        opponentPlayType={opponentPlayType}
        setOpponentPlayType={setOpponentPlayType}
        periodLabel={periodLabel}
        period={period}
        clockSeconds={clockSeconds}
        oppFouls={gameData.teamFoulStats.oppFouls}
        periodType={periodType}
      />

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteStat}
        isDeleting={isDeleting}
      />

      <EndGameDialog
        open={isEndGameDialogOpen}
        onClose={() => setIsEndGameDialogOpen(false)}
        onConfirm={handleEndGame}
        isEnding={isEnding}
      />

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
        seasonPpp={teamSeasonStats?.ppp ?? "0.00"}
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
