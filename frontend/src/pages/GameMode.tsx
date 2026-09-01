import React, { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Grid, Box, Typography, Alert, Snackbar, Button } from "@mui/material";

// Hooks
import { useTokens } from "../theme/useTokens";
import { useGameMode } from "./GameMode/hooks/useGameMode";
import { useGameModeActions } from "./GameMode/hooks/useGameModeActions";

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
  EndGameDialog,
  QuickEditRosterDialog,
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
import { ConfirmDialog } from "../components/dialogs";
import { EditClockDialog } from "./GameMode/dialogs/EditClockDialog";
import QuickSubDialog from "./GameMode/dialogs/QuickSubDialog";
import SubstitutionAuditDialog from "../components/dialogs/SubstitutionAuditDialog";
import FreeThrowWorkflowDialog from "./GameMode/dialogs/FreeThrowWorkflowDialog";
import HalftimeReportDialog from "./GameMode/dialogs/HalftimeReportDialog";
import DefensiveBreakdownDialog from "./GameMode/dialogs/DefensiveBreakdownDialog";
import { VerifiedPeriodModal } from "./GameMode/dialogs/VerifiedPeriodModal";
import { OvertimeTransitionDialog } from "./GameMode/dialogs/OvertimeTransitionDialog";
import { JumpBallDialog } from "./GameMode/dialogs/JumpBallDialog";
import { StartingLineupDialog } from "./GameMode/dialogs/StartingLineupDialog";
import { ClutchPerformanceHUD } from "../components/game/ClutchPerformanceHUD";
import { ScoreAdjustmentDialog } from "./GameMode/dialogs/ScoreAdjustmentDialog";

import { detectShotValueFromCoords } from "../utils/courtUtils";
import { SPECIAL_PLAYER_IDS } from "../constants/stats";
import type { PlaybookEfficiency } from "./GameMode/types";

export default function GameMode() {
  const tokens = useTokens();
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
    clockSeconds,
    isClockRunning,
    isBuzzerActive,
    isIntermission,
    intermissionSeconds,
    intermissionLabel,
    isClockEditDialogOpen,
    setIsClockEditDialogOpen,
    isReadOnly,
    sortedStatsGridData,
    sortConfig,
    setSortConfig,
    chainPrompt,
    setChainPrompt,
    undoneStatCache,
    setUndoneStatCache,
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
    ftAttempts,
    setFtAttempts,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isHalftimeReportOpen,
    setIsHalftimeReportOpen,
    isBreakdownDialogOpen,
    setIsBreakdownDialogOpen,
    isVerificationOpen,
    setIsVerificationOpen,
    isOtTransitionOpen,
    setIsOtTransitionOpen,
    handleConfirmOvertime,
    isJumpBallOpen,
    isPreTipState,
    buzzerBeaters,
    ftShooterId,
    setFtShooterId,
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
    fouledOutOnCourtPlayer,
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
    handleUnlockPeriod,
    handleEditClock,
    handleAdjustClock,
    handleNextPeriod,
    handleToggleClock,
    setIsClockRunning,
    teamPlayers,
  } = useGameMode(gameId || null, teamId || null);

  const [isConfirmReopenOpen, setIsConfirmReopenOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isQuickEditRosterOpen, setIsQuickEditRosterOpen] = useState(false);
  const [scoreAdjustmentTarget, setScoreAdjustmentTarget] = useState<
    "TEAM" | "OPPONENT" | null
  >(null);

  const {
    handleUndo,
    handleReapplyUndo,
    handleEndGame,
    handleSaveStat,
    handleDeleteStat,
    handleQuickSub,
    handleTogglePossession,
    handleOpponentTurnover,
    handleChainAction,
    handleConfirmStartingLineup,
    handleJumpBall,
    handleFlipPossessionArrow,
    handleTimeout,
    handleReopenGame,
    handleDirectScoreOverride,
    handleDirectFoulOverride,
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
    undoneStatCache,
    setUndoneStatCache,
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
    setFtShooterId,
    setFtAttempts,
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
    setIsClockRunning,
    statsMap,
    team,
    setIsJumpBallOpen,
    setIsReopening,
    setIsConfirmReopenOpen,
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
    <Box
      sx={{
        p: {
          xs: tokens.layout.pagePaddingXUnits / 3, // 1 unit = 8px
          sm: tokens.layout.pagePaddingXUnits * 0.66,
          md: tokens.layout.pagePaddingXUnits,
        },
      }}
    >
      {isReadOnly && (
        <Alert
          severity="warning"
          sx={{ mb: tokens.semantic.spacing.md / 8 }}
          action={
            game?.completed === 1 ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => setIsConfirmReopenOpen(true)}
                data-testid="reopen-game-button"
              >
                Re-open Game
              </Button>
            ) : undefined
          }
        >
          This game is finalized and in read-only mode.
        </Alert>
      )}

      {isLineupIllegal && !isReadOnly && (
        <Alert
          severity="error"
          sx={{
            mb: tokens.semantic.spacing.md / 8,
            fontWeight: tokens.typography.fontWeight.black,
          }}
        >
          ILLEGAL LINEUP: Exactly 5 players must be on court. Current:{" "}
          {gameData.onCourtIds.size}
        </Alert>
      )}

      {fouledOutOnCourtPlayer && !isReadOnly && (
        <Alert
          severity="error"
          variant="filled"
          sx={{
            mb: tokens.semantic.spacing.md / 8,
            fontWeight: tokens.typography.fontWeight.black,
          }}
        >
          FOUL OUT CONFLICT: A player with 5 fouls (or limit) is on court.
          Please substitute them out to resume play.
        </Alert>
      )}

      {teamPlayers.length < 5 && !isReadOnly && (
        <Alert
          severity="error"
          variant="filled"
          sx={{
            mb: tokens.semantic.spacing.md / 8,
            fontWeight: tokens.typography.fontWeight.black,
          }}
        >
          ROSTER INCOMPLETE: This team only has {teamPlayers.length} players. At
          least 5 are required to record a game.
        </Alert>
      )}

      <Grid container spacing={tokens.semantic.spacing.lg / 8}>
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
            onScoreClick={(targetTeam) => setScoreAdjustmentTarget(targetTeam)}
            onScoreAdjust={(targetTeam, delta) =>
              handleDirectScoreOverride(targetTeam, delta)
            }
            onFoulAdjust={(targetTeam, delta) =>
              handleDirectFoulOverride(targetTeam, delta)
            }
            onFlipPossessionArrow={handleFlipPossessionArrow}
            haltAlerts={haltAlerts}
            periodLabel={periodLabel}
            maxPeriod={maxPeriod}
            isReadOnly={isReadOnly}
            jerseyMap={jerseyMap}
            foulLimit={game?.foulLimit || team?.defaultFoulLimit || 5}
            isIntermission={isIntermission}
            intermissionSeconds={intermissionSeconds}
            intermissionLabel={intermissionLabel}
            isBuzzerActive={isBuzzerActive}
          />
          <ActionControls
            isReadOnly={isReadOnly}
            onUndo={handleUndo}
            onQuickSub={() => setIsSubDialogOpen(true)}
            onAdjustClock={handleAdjustClock}
            onFtWorkflow={() => {
              // Manual FT trigger:
              // If trackingMode is TEAM, we are on offense, so pick a shooter
              if (trackingMode === "TEAM") setFtShooterId(null);
              // If trackingMode is OPPONENT, opponent is on offense, so shooter is OPPONENT
              else setFtShooterId(SPECIAL_PLAYER_IDS.OPPONENT);
              setIsFtWorkflowOpen(true);
            }}
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
            isLineupIllegal={isLineupIllegal || isPreTipState}
            isFoulOutConflict={!!fouledOutOnCourtPlayer}
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
            onQuickEditRoster={() => setIsQuickEditRosterOpen(true)}
          />
          <CourtMarkerFilters
            markerFilter={markerFilter}
            onFilterChange={(f) => setMarkerFilter(f)}
          />
          <BasketballCourt onCoordClick={handleCourtClick} />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: tokens.semantic.spacing.xs / 8,
              textAlign: "center",
              color: tokens.semantic.color.text.secondary,
            }}
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
            verifiedPeriods={game?.verifiedPeriods}
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Action?"
        description="This action will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteStat}
        onClose={() => setConfirmDeleteOpen(false)}
        destructive
        loading={isDeleting}
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
        onSave={(m, s) => {
          handleEditClock(m, s);
          setIsClockEditDialogOpen(false);
        }}
        initialMinutes={Math.floor(clockSeconds / 60)}
        initialSeconds={clockSeconds % 60}
      />

      <ScoreAdjustmentDialog
        open={!!scoreAdjustmentTarget}
        onClose={() => setScoreAdjustmentTarget(null)}
        targetTeam={scoreAdjustmentTarget}
        teamName={
          scoreAdjustmentTarget === "TEAM"
            ? team?.name || "Our Team"
            : game?.opponent || "Opponent"
        }
        currentScore={
          scoreAdjustmentTarget === "TEAM"
            ? gameData.currentScore
            : gameData.opponentScore
        }
        onSave={async (targetTeam, delta) => {
          await handleDirectScoreOverride(targetTeam, delta);
          setScoreAdjustmentTarget(null);
        }}
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
        onClose={() => {
          setIsSubDialogOpen(false);
          setSubOutPlayerId(null);
        }}
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
        playerId={ftShooterId || ""}
        gameId={gameId || ""}
        period={period}
        clockTime={clockSeconds}
        onClose={() => setIsFtWorkflowOpen(false)}
        onPlayerSelect={setFtShooterId}
        onCourtPlayers={players.filter((p) => gameData.onCourtIds.has(p.id!))}
        jerseyMap={jerseyMap}
        initialAttempts={ftAttempts}
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
        onClose={() => setIsVerificationOpen(false)}
        period={period}
        periodLabel={periodLabel}
        appScore={{ team: gameData.currentScore, opp: gameData.opponentScore }}
        appFouls={{
          team: gameData.teamFoulStats.teamFouls,
          opp: gameData.teamFoulStats.oppFouls,
        }}
        teamPeriodPlayerFouls={gameData.teamPeriodPlayerFouls}
        oppPeriodPlayerFouls={gameData.oppPeriodPlayerFouls}
        players={players}
        jerseyMap={jerseyMap}
        buzzerBeaters={buzzerBeaters}
        isVerified={game?.verifiedPeriods?.includes(period)}
        onUnlock={handleUnlockPeriod}
        onVerify={handleVerifyPeriod}
      />

      <OvertimeTransitionDialog
        open={isOtTransitionOpen}
        onClose={() => setIsOtTransitionOpen(false)}
        onConfirm={handleConfirmOvertime}
        period={period}
        periodLabel={periodLabel}
        currentScore={{
          team: gameData.currentScore,
          opp: gameData.opponentScore,
        }}
        teamName={team?.name || "Our Team"}
        opponentName={game?.opponent || "Opponent"}
        defaultOvertimeLength={team?.defaultOvertimeLength}
      />

      <StartingLineupDialog
        open={isPreTipState && !isReadOnly}
        players={players}
        jerseyMap={jerseyMap}
        onConfirm={handleConfirmStartingLineup}
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

      <QuickEditRosterDialog
        open={isQuickEditRosterOpen}
        onClose={() => setIsQuickEditRosterOpen(false)}
        teamId={teamId}
        players={players}
        teamPlayers={teamPlayers}
      />

      <ConfirmDialog
        open={isConfirmReopenOpen}
        title="Re-open Game?"
        description="Are you sure you want to re-open this game? Re-opening will make the game editable and allow live stat-recording to resume."
        confirmLabel="Re-open"
        onConfirm={handleReopenGame}
        onClose={() => setIsConfirmReopenOpen(false)}
        loading={isReopening}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          snackbar.action === "REAPPLY" ? (
            <Button
              color="primary"
              size="small"
              onClick={handleReapplyUndo}
              data-testid="reapply-undo-button"
            >
              RE-APPLY
            </Button>
          ) : undefined
        }
      />
    </Box>
  );
}
