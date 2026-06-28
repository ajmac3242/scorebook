import React, { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Grid, Box, Typography, Alert, Snackbar } from "@mui/material";

// Hooks
import { useGameMode } from "./GameMode/hooks/useGameMode";
import { useGameModeActions } from "./GameMode/hooks/useGameModeActions";
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
  RecentActionsPanel,
} from "./GameMode/index";

// Shared Components
import { Scoreboard } from "../components/game/Scoreboard";
import { ActionControls } from "../components/game/ActionControls";
import BasketballCourt from "../components/game/BasketballCourt";
import { TacticalIdentityHUD } from "../components/game/TacticalIdentityHUD";
import { TacticalAlertsSidebar } from "../components/game/TacticalAlertsSidebar";
import { EditClockDialog } from "./GameMode/dialogs/EditClockDialog";
import QuickSubDialog from "./GameMode/dialogs/QuickSubDialog";
import SubstitutionAuditDialog from "../components/dialogs/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "./GameMode/dialogs/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "./GameMode/dialogs/HalftimeReportDialog";
import DefensiveBreakdownDialog from "./GameMode/dialogs/DefensiveBreakdownDialog";
import { VerifiedPeriodModal } from "./GameMode/dialogs/VerifiedPeriodModal";
import { JumpBallDialog } from "./GameMode/dialogs/JumpBallDialog";
import { ClutchPerformanceHUD } from "../components/game/ClutchPerformanceHUD";

import { detectShotValueFromCoords } from "../utils/courtUtils";
import { SPECIAL_PLAYER_IDS } from "../constants/stats";
import type { PlaybookEfficiency } from "./GameMode/types";

export default function GameMode() {
  const { gameId: pathGameId } = useParams();
  const [searchParams] = useSearchParams();
  const queryGameId = searchParams.get("gameId");
  const queryTeamId = searchParams.get("teamId");

  const gameId = pathGameId || queryGameId;
  const teamId = queryTeamId;

  const {
    game,
    team,
    players,
    jerseyMap,
    playerNamesMap,
    draftOnCourtIds,
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
    subOutPlayerId,
    setSubOutPlayerId,
    setIsFtWorkflowOpen,
    isFtWorkflowOpen,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    isVerificationOpen,
    isJumpBallOpen,
    setIsJumpBallOpen,
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
    handleSwapClick,
    isLineupIllegal,
    points,
    setPoints,
    shotQuality,
    setShotQuality,
    haltAlerts,
    maxPeriod,
    playerStreaks,
    teamSeasonStats,
    halftimeStats,
    handleVerifyPeriod,
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
    handleJumpBall,
    handleFlipPossessionArrow,
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
    setSubOutPlayerId,
    setIsSavingSub: () => {},
    statsMap,
    team,
  });

  const { handleEditClock, handleNextPeriod, handleToggleClock } = useGameClock(
    {
      gameId: gameId || null,
      period,
      periodType: team?.periodType || "QUARTERS",
      setPeriod,
      setClockSeconds,
      setIsClockRunning,
      setIsClockEditDialogOpen,
      periodLength: team?.defaultPeriodLength || game?.periodLength,
      overtimeLength: team?.defaultOvertimeLength,
    },
  );

  const { handleTimeout } = useGameTimeout({
    gameId: gameId || null,
    isReadOnly,
    trackingMode: trackingMode as "TEAM" | "OPPONENT",
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
      if (isReadOnly || gameData.onCourtIds.size !== 5 || clockSeconds === 0)
        return;
      setSelectedX(x);
      setSelectedY(y);
      setPoints(detectShotValueFromCoords(x, y));
      setSelectedPlayerId(
        trackingMode === "OPPONENT" ? SPECIAL_PLAYER_IDS.OPPONENT : null,
      );
      setStatEntryOpen(true);
    },
    [
      isReadOnly,
      setSelectedX,
      setSelectedY,
      setPoints,
      setSelectedPlayerId,
      trackingMode,
      setStatEntryOpen,
      gameData.onCourtIds.size,
      clockSeconds,
    ],
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

      {isLineupIllegal && !isReadOnly && (
        <Alert severity="error" sx={{ mb: 2, fontWeight: 800 }}>
          ILLEGAL LINEUP: Exactly 5 players must be on court. Current:{" "}
          {gameData.onCourtIds.size}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid sx={{ width: { xs: "100%", lg: "58.33%" } }}>
          {voiceEnabled && (
            <VoiceModeBanner
              isListening={isListening}
              lastTranscript={lastTranscript}
            />
          )}
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
            isLineupIllegal={isLineupIllegal}
            onFlipPossessionArrow={handleFlipPossessionArrow}
            onToggleClock={handleToggleClock}
            isClockRunning={isClockRunning}
          />
          <TrackingModeToolbar
            trackingMode={trackingMode}
            onTrackingModeChange={(m) =>
              setTrackingMode(m as "TEAM" | "OPPONENT")
            }
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
            isReadOnly={isReadOnly}
            game={game || null}
            team={team || null}
          />
          <CourtMarkerFilters
            markerFilter={markerFilter}
            onFilterChange={(f) => setMarkerFilter(f)}
          />
          <BasketballCourt onCoordClick={handleCourtClick} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1, textAlign: "center" }}
          >
            Tip: Tap the court to record an action at that location.
          </Typography>
        </Grid>

        {/* Right Column */}
        <Grid sx={{ width: { xs: "100%", lg: "41.67%" } }}>
          {isClutchMode && (
            <ClutchPerformanceHUD
              onCourtStats={sortedStatsGridData.filter((p) =>
                gameData.onCourtIds.has(p.id.toString()),
              )}
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
            matchups={matchups}
            onCourtIds={gameData.onCourtIds}
            gameId={gameId}
            game={game || null}
          />
          <TacticalIdentityHUD kpis={[]} />
          <DefensiveSchemeSelector
            activeScheme={game?.activeDefensiveScheme || "MAN"}
            gameId={gameId}
            isReadOnly={isReadOnly}
          />
          <OffensiveKPICard
            paintTouchStats={paintTouchStats}
            shotROI={shotROI}
          />
          {trackingMode === "TEAM" && <TacticalAlertsSidebar alerts={[]} />}
          <LiveLineupCard
            players={players}
            onCourtIds={gameData.onCourtIds}
            game={game || null}
            team={team || null}
            statsMap={statsMap}
            jerseyMap={jerseyMap}
            currentLineupStintDuration={gameData.currentLineupStintDuration}
            currentLineupPlusMinus={gameData.currentLineupPlusMinus}
            period={period}
            isReadOnly={isReadOnly}
            chainPrompt={chainPrompt}
            stintDurations={gameData.stintDurations}
            playerStreaks={playerStreaks}
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
                  direction: sortConfig.direction === "desc" ? "asc" : "desc",
                })
              }
              jerseyMap={jerseyMap}
              draftOnCourtIds={gameData.onCourtIds}
              chainPrompt={chainPrompt}
              onChainPromptDismiss={() => setChainPrompt(null)}
              playbookEfficiency={
                playbookEfficiency as unknown as PlaybookEfficiency
              }
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
              draftOnCourtIds={gameData.onCourtIds}
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
            onDeleteRequest={(id) => {
              setStatToDelete(id);
              setConfirmDeleteOpen(true);
            }}
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
        trackingMode={trackingMode as "TEAM" | "OPPONENT"}
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
        isClockRunning={isClockRunning}
        oppFouls={gameData.teamFoulStats.oppFouls}
        periodType={periodType}
        statsMap={statsMap}
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
        isSaving={isSavingSub}
        handleSwapClick={handleSwapClick}
        handleQuickSub={handleQuickSub}
        onClose={() => setIsSubDialogOpen(false)}
        isForced={!!subOutPlayerId}
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
        teamPpp={gameData.teamPpp}
        oppPpp={gameData.oppPpp}
        seasonPpp={teamSeasonStats?.ppp ?? "0.00"}
        topLineups={halftimeStats.lineupStats.slice(0, 3)}
        bottomLineups={halftimeStats.lineupStats.slice(-3).reverse()}
        opponentThreats={gameData.momentumAlerts.opponentThreats}
        schemeEfficiency={halftimeStats.schemeEfficiency}
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
        appFouls={{
          team: gameData.teamFoulStats.teamFouls,
          opp: gameData.teamFoulStats.oppFouls,
        }}
        onVerify={handleVerifyPeriod}
      />

      <JumpBallDialog
        open={isJumpBallOpen}
        teamName={team?.name || "Our Team"}
        opponentName={game?.opponent || "Opponent"}
        onSelectWinner={(winnerId) => {
          handleJumpBall(winnerId);
          setIsJumpBallOpen(false);
        }}
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
