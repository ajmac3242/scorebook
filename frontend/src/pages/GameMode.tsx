import React, { useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";

// Hooks
import { useGameMode } from "../hooks/useGameMode";
import { useGameModeActions } from "../hooks/useGameModeActions";
import { useGameClock } from "./GameMode/hooks/useGameClock";
import { useGameTimeout } from "./GameMode/hooks/useGameTimeout";

// Page-specific Components
import {
  VoiceModeBanner,
  TrackingModeToolbar,
  CourtMarkerFilters,
  MatchupAnalyticsCard,
  LiveLineupCard,
  DefensiveSchemeSelector,
  OffensiveKPICard,
  StatEntryDialog,
  ConfirmDeleteDialog,
  EndGameDialog,
  PlayerPerformancePanel,
  OpponentScoutingPanel,
  RecentActionsPanel
} from "./GameMode/index";

// Shared Components
import { Scoreboard } from "../components/Scoreboard";
import { ActionControls } from "../components/ActionControls";
import BasketballCourt from "../components/BasketballCourt";
import { TacticalIdentityHUD } from "../components/TacticalIdentityHUD";
import { TacticalAlertsSidebar } from "../components/TacticalAlertsSidebar";
import { EditClockDialog } from "../components/EditClockDialog";
import QuickSubDialog from "../components/QuickSubDialog";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "../components/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "../components/HalftimeReportDialog";
import DefensiveBreakdownDialog from "../components/DefensiveBreakdownDialog";
import { VerifiedPeriodModal } from "../components/VerifiedPeriodModal";
import { ClutchPerformanceHUD } from "../components/ClutchPerformanceHUD";

export default function GameMode() {
  const { gameId, teamId } = useParams();

  const {
    game,
    team,
    players,
    jerseyMap,
    playerNamesMap,
    draftOnCourtIds,
    setDraftOnCourtIds,
    trackingMode,
    setTrackingMode,
    period,
    setPeriod,
    clockSeconds,
    setClockSeconds,
    isClockRunning,
    setIsClockRunning,
    isClockEditDialogOpen,
    setIsClockEditDialogOpen,
    isReadOnly,
    sortedStatsGridData,
    sortConfig,
    setSortConfig,
    chainPrompt,
    setChainPrompt,
    playbookEfficiency,
    opponentStats,
    matchups,
    isClutchMode,
    periodLabel,
    periodType,
    gameData,
    statsMap,
    isSubDialogOpen,
    setIsSubDialogOpen,
    setIsFtWorkflowOpen,
    isFtWorkflowOpen,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    isVerificationOpen,
    handleVerifyPeriod,
    selectedX,
    setSelectedX,
    selectedY,
    setSelectedY,
    isSavingSub,
    voiceEnabled,
    setVoiceEnabled,
    isListening,
    lastTranscript,
    markerFilter,
    setMarkerFilter,
    matchupEfficiency,
    showMatchupMatrix,
    setShowMatchupMatrix,
    paintTouchStats,
    shotROI,
    gameStats,
    isSavingStat,
    setIsSavingStat,
    isEnding,
    setIsEnding,
    isDeleting,
    setIsDeleting,
    statToDelete,
    setStatToDelete,
    editingStatId,
    setEditingStatId,
    statType,
    setStatType,
    playName,
    setPlayName,
    situation,
    setSituation,
    opponentPlayType,
    setOpponentPlayType,
    isEditing,
    setIsEditing,
    selectedPlayerId,
    setSelectedPlayerId,
    snackbar,
    setSnackbar,
    isDialogOpen: statEntryOpen,
    setIsDialogOpen: setStatEntryOpen,
    isDeleteDialogOpen: confirmDeleteOpen,
    setIsDeleteDialogOpen: setConfirmDeleteOpen,
    isEndGameDialogOpen: endGameDialogOpen,
    setIsEndGameDialogOpen: setEndGameDialogOpen,
    selectedSwapId,
    setSelectedSwapId,
    points,
    setPoints,
    shotQuality,
    setShotQuality,
    haltAlerts,
    maxPeriod,
  } = useGameMode(gameId || null, teamId || null);

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
    gameId: gameId || null,
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
    setIsDialogOpen: setStatEntryOpen,
    setStatType,
    setPlayName,
    setSituation,
    setOpponentPlayType,
    setIsEditing,
    setEditingStatId,
    setSelectedPlayerId,
    setLastOpponentStatId: () => {},
    setIsBreakdownDialogOpen,
    setChainPrompt,
    setIsFtWorkflowOpen,
    setIsSavingStat,
    setIsEnding,
    setIsEndGameDialogOpen: setEndGameDialogOpen,
    setIsSummaryDialogOpen: () => {},
    setIsDeleting,
    setIsDeleteDialogOpen: setConfirmDeleteOpen,
    setStatToDelete,
    setIsSubDialogOpen,
    setIsSavingSub: () => {},
  });

  const { handleEditClock, handleNextPeriod } = useGameClock({
    gameId: gameId || null,
    period,
    periodType: team?.periodType || "QUARTERS",
    setPeriod,
    setClockSeconds,
    setIsClockRunning,
    setIsClockEditDialogOpen,
  });

  const { handleTimeout } = useGameTimeout({
    gameId: gameId || null,
    isReadOnly,
    trackingMode: (trackingMode as "TEAM" | "OPPONENT"),
    period,
    clockSeconds,
  });

  const handleLineupPlayerClick = useCallback(
    (playerId: string) => {
      setSelectedPlayerId(playerId);
      setIsSubDialogOpen(true);
    },
    [setSelectedPlayerId, setIsSubDialogOpen],
  );

  const handleEmptySlotClick = useCallback(
    (slotId: string) => {
      setSelectedPlayerId(slotId);
      setIsSubDialogOpen(true);
    },
    [setSelectedPlayerId, setIsSubDialogOpen],
  );

  const handleCourtClick = useCallback(
    (x: number, y: number) => {
      if (isReadOnly) return;
      setSelectedX(x);
      setSelectedY(y);
      setStatEntryOpen(true);
    },
    [isReadOnly, setSelectedX, setSelectedY, setStatEntryOpen],
  );

  const openEditDialog = useCallback(
    (stat: any) => {
      if (isReadOnly) return;
      setEditingStatId(stat.id ?? null);
      setSelectedPlayerId(stat.playerId);
      setStatType(stat.type);
      setPoints(stat.points || 2);
      setPlayName(stat.playName || "");
      setShotQuality(stat.shotQuality || null);
      setSituation(stat.situation || null);
      setSelectedX(stat.locationX || 0);
      setSelectedY(stat.locationY || 0);
      setIsEditing(true);
      setStatEntryOpen(true);
    },
    [isReadOnly, setEditingStatId, setSelectedPlayerId, setStatType, setPoints, setPlayName, setShotQuality, setSituation, setSelectedX, setSelectedY, setIsEditing, setStatEntryOpen],
  );

  const handleSwapClick = useCallback(
    (id: string) => {
       if (!selectedSwapId || selectedSwapId === id) {
        setSelectedSwapId(selectedSwapId === id ? null : id);
        return;
      }
      const isAOnCourt = draftOnCourtIds.has(selectedSwapId) || selectedSwapId.startsWith("EMPTY");
      const isBOnCourt = draftOnCourtIds.has(id) || id.startsWith("EMPTY");
      if (isAOnCourt === isBOnCourt) {
        setSelectedSwapId(id);
        return;
      }
      setDraftOnCourtIds((prev) => {
        const next = new Set(prev);
        const [onCourt, bench] = isAOnCourt ? [selectedSwapId, id] : [id, selectedSwapId];
        if (!onCourt.startsWith("EMPTY")) next.delete(onCourt);
        if (!bench.startsWith("EMPTY")) next.add(bench);
        return next;
      });
      setSelectedSwapId(null);
    },
    [selectedSwapId, draftOnCourtIds, setSelectedSwapId, setDraftOnCourtIds]
  );

  if (!gameId || !teamId) return null;

  const recentStats = gameData.recentStats;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This game is finalized and in read-only mode.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid sx={{ width: { xs: '100%', lg: '58.33%' } }}>
          {voiceEnabled && <VoiceModeBanner isListening={isListening} lastTranscript={lastTranscript} />}
          <Scoreboard
            game={game}
            team={team}
            gameData={gameData}
            period={period}
            clockSeconds={clockSeconds}
            isClockRunning={isClockRunning}
            onEditClock={() => setIsClockEditDialogOpen(true)}
            haltAlerts={haltAlerts}
            periodLabel={periodLabel}
            maxPeriod={maxPeriod}
            isReadOnly={isReadOnly}
          />
          <ActionControls
            isReadOnly={isReadOnly}
            onUndo={handleUndo}
            onQuickSub={() => setIsSubDialogOpen(true)}
            onFtWorkflow={() => setIsFtWorkflowOpen(true)}
            onAuditSubs={() => setIsAuditDialogOpen(true)}
            onTimeout={handleTimeout}
            onNextPeriod={() => handleNextPeriod()}
            onTogglePossession={() => handleTogglePossession("OUR_TEAM")}
            onOpponentTurnover={handleOpponentTurnover}
            possessionState={gameData.possessionState}
            recentStatsLength={recentStats.length}
            onEndGame={() => setEndGameDialogOpen(true)}
            isGameCompleted={!!game?.completed}
            isEnding={isEnding}
          />
          <TrackingModeToolbar
            trackingMode={trackingMode}
            onTrackingModeChange={(m) => setTrackingMode(m as "TEAM" | "OPPONENT")}
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
            isReadOnly={isReadOnly}
            game={game || null}
            team={team || null}
          />
          <CourtMarkerFilters markerFilter={markerFilter} onFilterChange={(f) => setMarkerFilter(f)} />
          <BasketballCourt
            onCoordClick={handleCourtClick}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
            Tip: Tap the court to record an action at that location.
          </Typography>
        </Grid>

        {/* Right Column */}
        <Grid sx={{ width: { xs: '100%', lg: '41.67%' } }}>
          {isClutchMode && (
            <ClutchPerformanceHUD
              onCourtStats={sortedStatsGridData.filter(p => draftOnCourtIds.has(p.id.toString()))}
              jerseyMap={jerseyMap}
            />
          )}
          <MatchupAnalyticsCard
            matchupEfficiency={matchupEfficiency}
            showMatchupMatrix={showMatchupMatrix}
            onToggleMatrix={() => setShowMatchupMatrix(!showMatchupMatrix)}
            opponents={[]}
            players={players}
            jerseyMap={jerseyMap}
          />
          <TacticalIdentityHUD kpis={[]} />
          <DefensiveSchemeSelector activeScheme={game?.activeDefensiveScheme || "MAN"} gameId={gameId} isReadOnly={isReadOnly} />
          <OffensiveKPICard paintTouchStats={paintTouchStats} shotROI={shotROI} />
          {trackingMode === "TEAM" && <TacticalAlertsSidebar alerts={[]} />}
          <LiveLineupCard
            players={players}
            onCourtIds={draftOnCourtIds}
            game={game || null}
            team={team || null}
            statsMap={statsMap}
            jerseyMap={jerseyMap}
            currentLineupStintDuration={0}
            currentLineupPlusMinus={0}
            period={period}
            isReadOnly={isReadOnly}
            chainPrompt={chainPrompt}
            onPlayerClick={handleLineupPlayerClick}
            onEmptySlotClick={handleEmptySlotClick}
            onChainAction={handleChainAction}
            onDismissChain={() => setChainPrompt(null)}
          />
          {trackingMode === "TEAM" ? (
            <PlayerPerformancePanel
              sortedStatsGridData={sortedStatsGridData}
              sortConfig={sortConfig}
              onSortChange={(key) => setSortConfig({ key, direction: sortConfig.direction === "desc" ? "asc" : "desc" })}
              jerseyMap={jerseyMap}
              draftOnCourtIds={draftOnCourtIds}
              chainPrompt={chainPrompt}
              onChainPromptDismiss={() => setChainPrompt(null)}
              playbookEfficiency={playbookEfficiency as any}
              gameId={gameId || ""}
              period={period}
              clockSeconds={clockSeconds}
              isReadOnly={isReadOnly}
              gameStats={gameStats}
            />
          ) : (
            <OpponentScoutingPanel
              opponentStats={opponentStats}
              game={game}
              players={players}
              draftOnCourtIds={draftOnCourtIds}
              jerseyMap={jerseyMap}
              matchups={matchups}
              gameId={gameId || null}
            />
          )}
          <RecentActionsPanel
            recentStats={recentStats}
            playerNamesMap={playerNamesMap}
            jerseyMap={jerseyMap}
            isReadOnly={isReadOnly}
            onDeleteRequest={(id) => openEditDialog(recentStats.find(s => s.id === id)!)}
            onRecordFirstAction={() => setStatEntryOpen(true)}
          />
        </Grid>
      </Grid>

      {/* Dialogs */}
      <StatEntryDialog
        open={statEntryOpen}
        onClose={() => setStatEntryOpen(false)}
        onSave={handleSaveStat}
        isEditing={isEditing}
        isSavingStat={isSavingStat}
        trackingMode={(trackingMode as "TEAM" | "OPPONENT")}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
        players={players}
        jerseyMap={jerseyMap}
        draftOnCourtIds={draftOnCourtIds}
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
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteStat}
        isDeleting={isDeleting}
      />

      <EndGameDialog
        open={endGameDialogOpen}
        onClose={() => setEndGameDialogOpen(false)}
        onConfirm={handleEndGame}
        isEnding={isEnding}
      />

      <EditClockDialog
        open={isClockEditDialogOpen}
        onClose={() => setIsClockEditDialogOpen(false)}
        onSave={(m, s) => handleEditClock(m, s)}
        initialMinutes={Math.floor(clockSeconds / 60)}
        initialSeconds={clockSeconds % 60}
      />

      <QuickSubDialog
        open={isSubDialogOpen}
        players={players}
        team={team || undefined}
        game={game || null}
        draftOnCourtIds={draftOnCourtIds}
        selectedSwapId={selectedSwapId}
        jerseyMap={jerseyMap}
        statsMap={statsMap}
        isSaving={false}
        handleSwapClick={handleSwapClick}
        handleQuickSub={handleQuickSub}
        onClose={() => setIsSubDialogOpen(false)}
      />
      <SubstitutionAuditDialog
        open={isAuditDialogOpen}
        gameId={gameId || ""}
        players={players}
        jerseyMap={jerseyMap}
        onClose={() => setIsAuditDialogOpen(false)}
      />
      <FreeThrowWorkflowDialog
        open={isFtWorkflowOpen}
        playerId={selectedPlayerId || ""}
        gameId={gameId || ""}
        period={period}
        clockTime={clockSeconds}
        onClose={() => setIsFtWorkflowOpen(false)}
      />
      <HalftimeReportDialog
        open={isHalftimeReportOpen}
        teamPpp="0.00"
        oppPpp="0.00"
        seasonPpp="0.00"
        topLineups={[]}
        bottomLineups={[]}
        opponentThreats={[]}
        schemeEfficiency={[]}
        jerseyMap={jerseyMap}
        onClose={() => setIsHalftimeReportOpen(false)}
      />
      <DefensiveBreakdownDialog
        open={isBreakdownDialogOpen}
        onClose={() => setIsBreakdownDialogOpen(false)}
      />
      <VerifiedPeriodModal
        open={isVerificationOpen}
        period={period}
        periodLabel={periodLabel}
        appScore={{ team: gameData.currentScore, opp: gameData.opponentScore }}
        appFouls={{ team: gameData.teamFoulStats.teamFouls, opp: gameData.teamFoulStats.oppFouls }}
        onVerify={() => {}}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
