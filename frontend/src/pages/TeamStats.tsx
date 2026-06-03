import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Edit as EditIcon, Warning } from "@mui/icons-material";

import { useTokens } from "../theme/useTokens";
import AppPageShell from "../components/layout/AppPageShell";
import EntityBanner from "../components/EntityBanner";

import { useTeamStatsData } from "./TeamStats/hooks/useTeamStatsData";
import { useTeamStatsFilters } from "./TeamStats/hooks/useTeamStatsFilters";
import { useTeamStatsAnalytics } from "./TeamStats/hooks/useTeamStatsAnalytics";
import { useTeamActions } from "./TeamStats/hooks/useTeamActions";

import ScheduleTab from "./TeamStats/sections/ScheduleTab";
import StatsTab from "./TeamStats/sections/StatsTab";
import LineupsTab from "./TeamStats/sections/LineupsTab";
import RosterTab from "./TeamStats/sections/RosterTab";

import TeamSettingsDialog from "./TeamStats/dialogs/TeamSettingsDialog";
import ManageRosterDialog from "./TeamStats/dialogs/ManageRosterDialog";
import AddGameDialog from "./TeamStats/dialogs/AddGameDialog";
import DeleteTeamDialog from "./TeamStats/dialogs/DeleteTeamDialog";

type TeamStatsTab = "schedule" | "stats" | "lineups" | "roster";

const TABS = [
  { value: "schedule", label: "Schedule" },
  { value: "stats", label: "Team Stats" },
  { value: "lineups", label: "Lineup Analytics" },
  { value: "roster", label: "Roster" },
] as const;

const TeamStats: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const tokens = useTokens();
  const isMobile = useMediaQuery("(max-width: 600px)");

  const controlRadius = tokens.semantic.component.radius.button;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const filters = useTeamStatsFilters();

  const rawData = useTeamStatsData({
    teamId,
    gameCountFilter: filters.gameCountFilter,
    scheduleView: filters.scheduleView,
    statView: filters.statView,
  });

  const analytics = useTeamStatsAnalytics({
    aggregatedStats: rawData.aggregatedStats,
    allStats: rawData.allStats,
    sortConfig: filters.sortConfig,
    lineupSortConfig: filters.lineupSortConfig,
  });

  const actions = useTeamActions({
    teamId,
    team: rawData.team,
    allPlayers: rawData.allPlayers,
    teamPlayers: rawData.teamPlayers,
    setSnackbar,
  });

  const headerControls =
    filters.activeTab === "stats" || filters.activeTab === "lineups" ? (
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "flex-end",
          width: "100%",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.2,
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          Analytics window
        </Typography>
        <ToggleButtonGroup
          value={filters.gameCountFilter}
          exclusive
          onChange={(_, val) => val && filters.setGameCountFilter(val)}
          size="small"
          fullWidth={isMobile}
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              borderRadius: `${controlRadius}px !important`,
              px: 1.5,
            },
          }}
        >
          <ToggleButton value="5">Last 5</ToggleButton>
          <ToggleButton value="10">Last 10</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    ) : undefined;

  return (
    <>
      <AppPageShell<TeamStatsTab>
        breadcrumb={[
          { label: "Teams", to: "/teams" },
          { label: rawData.team?.name || "Team" },
        ]}
        activeTab={filters.activeTab}
        tabs={TABS}
        onTabChange={(tab) => filters.setActiveTab(tab)}
        controls={headerControls}
        headerContent={
          <EntityBanner
            title={rawData.team?.name || "Team"}
            subtitle={`${rawData.teamAggregates.record}${rawData.team?.description ? ` | ${rawData.team.description}` : ""}`}
            gamesPlayed={rawData.gameIds.length}
            avatarSrc={rawData.team?.logoUrl}
            avatarColor="var(--cs-semantic-color-action-active)"
            primaryColor={rawData.team?.primaryColor}
            stats={[
              { label: "PPG", value: rawData.teamAggregates.ppg },
              { label: "RPG", value: rawData.teamAggregates.rpg },
              { label: "APG", value: rawData.teamAggregates.apg },
              { label: "PPP", value: rawData.teamAggregates.ppp },
              { label: "Def. PPP", value: rawData.teamAggregates.oppPpp },
            ]}
            actions={
              !rawData.isDeleted ? (
                <TeamSettingsDialog
                  open={actions.openSettingsDialog}
                  onClose={() => actions.setOpenSettingsDialog(false)}
                  onSave={actions.handleUpdateTeamSettings}
                  onDeleteRequest={() => {
                    actions.setOpenSettingsDialog(false);
                    actions.setIsDeleteDialogOpen(true);
                  }}
                  editName={actions.editName}
                  setEditName={actions.setEditName}
                  editLogoUrl={actions.editLogoUrl}
                  setEditLogoUrl={actions.setEditLogoUrl}
                  editColor={actions.editColor}
                  setEditColor={actions.setEditColor}
                  editPeriodType={actions.editPeriodType}
                  setEditPeriodType={actions.setEditPeriodType}
                  editPeriodLength={actions.editPeriodLength}
                  setEditPeriodLength={actions.setEditPeriodLength}
                  editOvertimeLength={actions.editOvertimeLength}
                  setEditOvertimeLength={actions.setEditOvertimeLength}
                  editMaxStintDuration={actions.editMaxStintDuration}
                  setEditMaxStintDuration={actions.setEditMaxStintDuration}
                  editTimeoutLimit={actions.editTimeoutLimit}
                  setEditTimeoutLimit={actions.setEditTimeoutLimit}
                  editFoulLimit={actions.editFoulLimit}
                  setEditFoulLimit={actions.setEditFoulLimit}
                  editFoulWarningThresholds={actions.editFoulWarningThresholds}
                  setEditFoulWarningThresholds={
                    actions.setEditFoulWarningThresholds
                  }
                  editPlaybook={actions.editPlaybook}
                  setEditPlaybook={actions.setEditPlaybook}
                  newPlayName={actions.newPlayName}
                  setNewPlayName={actions.setNewPlayName}
                  tokens={tokens}
                />
              ) : undefined
            }
            extraActions={
              !rawData.isDeleted ? (
                <Tooltip title="Edit team settings" placement="bottom">
                  <IconButton
                    size="small"
                    aria-label="Edit team settings"
                    onClick={() => actions.setOpenSettingsDialog(true)}
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      bgcolor: "rgba(255,255,255,0.12)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={actions.handleRestoreTeam}
                >
                  Restore Team
                </Button>
              )
            }
          />
        }
      >
        <Stack spacing={3} sx={{ opacity: rawData.isDeleted ? 0.72 : 1 }}>
          {rawData.isDeleted ? (
            <Alert severity="warning" icon={<Warning />}>
              <AlertTitle>Team pending deletion</AlertTitle>
              This team and its games are scheduled for permanent deletion in{" "}
              {rawData.timeLeft}. All data is currently read-only.
            </Alert>
          ) : null}

          {filters.activeTab === "schedule" && (
            <ScheduleTab
              filteredSchedule={rawData.filteredSchedule}
              scheduleView={filters.scheduleView}
              setScheduleView={filters.setScheduleView}
              isDeleted={rawData.isDeleted}
              teamId={teamId}
              team={rawData.team}
              controlRadius={controlRadius}
              onCreateGame={() => {
                actions.resetGameForm();
                actions.setOpenAddGame(true);
              }}
              isMobile={isMobile}
            />
          )}

          {filters.activeTab === "stats" && (
            <StatsTab
              playerStats={analytics.playerStats}
              statView={filters.statView}
              setStatView={filters.setStatView}
              gameIds={rawData.gameIds}
              teamId={teamId}
              controlRadius={controlRadius}
              sortConfig={filters.sortConfig}
              handleSort={filters.handleSort}
              tokens={tokens}
            />
          )}

          {filters.activeTab === "lineups" && (
            <LineupsTab
              lineupStats={analytics.lineupStats}
              localJerseyNumbers={actions.localJerseyNumbers}
              sortedRosterJerseyMap={rawData.sortedRosterJerseyMap}
              lineupSortConfig={filters.lineupSortConfig}
              handleLineupSort={filters.handleLineupSort}
              controlRadius={controlRadius}
            />
          )}

          {filters.activeTab === "roster" && (
            <RosterTab
              sortedRoster={rawData.sortedRoster}
              sortedRosterJerseyMap={rawData.sortedRosterJerseyMap}
              aggregatedStats={rawData.aggregatedStats}
              isDeleted={rawData.isDeleted}
              teamId={teamId}
              team={rawData.team}
              controlRadius={controlRadius}
              onManageRoster={() => actions.setOpenRosterDialog(true)}
            />
          )}
        </Stack>
      </AppPageShell>

      <ManageRosterDialog
        open={actions.openRosterDialog}
        onClose={actions.handleCancelRoster}
        onSave={actions.handleSaveRoster}
        allPlayers={rawData.allPlayers}
        teamPlayers={rawData.teamPlayers}
        pendingRosterChanges={actions.pendingRosterChanges}
        localJerseyNumbers={actions.localJerseyNumbers}
        rosterSearchTerm={actions.rosterSearchTerm}
        setRosterSearchTerm={actions.setRosterSearchTerm}
        onStageChange={actions.stageRosterChange}
        onStageJerseyUpdate={actions.stageJerseyUpdate}
        tokens={tokens}
      />

      <AddGameDialog
        open={actions.openAddGame}
        onClose={() => actions.setOpenAddGame(false)}
        onSubmit={actions.handleAddGame}
        activeStep={actions.activeStep}
        setActiveStep={actions.setActiveStep}
        isSubmitting={actions.isSubmittingGame}
        allOpponents={rawData.allOpponents}
        allRecentLocations={rawData.allRecentLocations}
        newOpponent={actions.newOpponent}
        setNewOpponent={actions.setNewOpponent}
        newOpponentId={actions.newOpponentId}
        setNewOpponentId={actions.setNewOpponentId}
        newOpponentLogoUrl={actions.newOpponentLogoUrl}
        setNewOpponentLogoUrl={actions.setNewOpponentLogoUrl}
        newDate={actions.newDate}
        setNewDate={actions.setNewDate}
        newTime={actions.newTime}
        setNewTime={actions.setNewTime}
        newLocation={actions.newLocation}
        setNewLocation={actions.setNewLocation}
        newPeriodType={actions.newPeriodType}
        setNewPeriodType={actions.setNewPeriodType}
        newPeriodLength={actions.newPeriodLength}
        setNewPeriodLength={actions.setNewPeriodLength}
        newTimeoutLimit={actions.newTimeoutLimit}
        setNewTimeoutLimit={actions.setNewTimeoutLimit}
        newFoulLimit={actions.newFoulLimit}
        setNewFoulLimit={actions.setNewFoulLimit}
        newTacticalKpis={actions.newTacticalKpis}
        setNewTacticalKpis={actions.setNewTacticalKpis}
        tokens={tokens}
      />

      <DeleteTeamDialog
        open={actions.isDeleteDialogOpen}
        teamName={rawData.team?.name}
        onClose={() => actions.setIsDeleteDialogOpen(false)}
        onConfirm={actions.handleDeleteTeam}
        tokens={tokens}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TeamStats;
