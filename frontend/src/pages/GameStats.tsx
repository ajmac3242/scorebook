import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Alert,
  AlertTitle,
  Grid,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import {
  Warning,
  Edit as EditIcon,
  Restore,
  FitnessCenter as PracticeIcon,
} from "@mui/icons-material";
import AppPageShell from "../components/layout/AppPageShell";
import EntityBanner from "../components/EntityBanner";
import SubstitutionAuditDialog from "../components/dialogs/SubstitutionAuditDialog";
import dayjs from "dayjs";

// Hooks
import { useGameData } from "./GameStats/hooks/useGameData";
import { useGameFilters } from "./GameStats/hooks/useGameFilters";
import { useGameAggregates } from "./GameStats/hooks/useGameAggregates";
import { useGameActions } from "./GameStats/hooks/useGameActions";

// Sections
import { GameFilterBar } from "./GameStats/sections/GameFilterBar";
import { BoxScoreCard } from "./GameStats/sections/BoxScoreCard";
import { ShotChartCard } from "./GameStats/sections/ShotChartCard";
import { ScoreFlowCard } from "./GameStats/sections/ScoreFlowCard";
import { LineupEfficiencyCard } from "./GameStats/sections/LineupEfficiencyCard";
import { DefensiveMetricsCard } from "./GameStats/sections/DefensiveMetricsCard";
import { EfficiencyAnalyticsCard } from "./GameStats/sections/EfficiencyAnalyticsCard";
import { ImpactAnalyticsSection } from "./GameStats/sections/ImpactAnalyticsSection";
import { SpecialtyExecutionCard } from "./GameStats/sections/SpecialtyExecutionCard";

// Dialogs
import { EditGameDialog } from "./GameStats/dialogs/EditGameDialog";
import { PracticePlannerDialog } from "./GameStats/dialogs/PracticePlannerDialog";
import { DefensiveIntegrityDialog } from "./GameStats/dialogs/DefensiveIntegrityDialog";
import { DeleteGameDialog } from "./GameStats/dialogs/DeleteGameDialog";
import { ExpandedSectionDialog } from "./GameStats/dialogs/ExpandedSectionDialog";

// Utils & Tables for Expanded Dialog
import { BoxScoreSection } from "./GameStats/BoxScoreSection";
import BasketballCourt from "../components/game/BasketballCourt";
import { ShotChartFilters } from "./GameStats/sections/ShotChartFilters";
import StatTable, {
  type StatTableColumn,
} from "../components/data-display/StatTable";
import { Avatar } from "@mui/material";

const GameStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

  const rawData = useGameData(gameId);
  const filters = useGameFilters();
  const aggregates = useGameAggregates({ rawData, filters });
  const actions = useGameActions({
    game: rawData.game,
    gameId,
    teamName: rawData.team?.name,
  });

  const { game, team, players } = rawData;
  const isDeleted = !!game?.deletedAt || !!team?.deletedAt;

  const lineupColumns: StatTableColumn<(typeof aggregates.lineupStats)[0]>[] = [
    {
      key: "lineup",
      label: "Lineup",
      format: (val) => (
        <Stack direction="row" spacing="var(--cs-semantic-spacing-xs)">
          {(val as string[]).map((pId) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: "var(--cs-typography-fontSize-xs)",
              }}
            >
              {aggregates.shotChartJerseyMap.get(pId) ?? "??"}
            </Avatar>
          ))}
        </Stack>
      ),
    },
    {
      key: "seconds",
      label: "MIN",
      align: "right",
      format: (val) => (Number(val) / 60).toFixed(1),
    },
    { key: "pointsFor", label: "PTS FOR", align: "right" },
    { key: "pointsAgainst", label: "PTS AGN", align: "right" },
    { key: "netRatingPer40", label: "NET/40", align: "right" },
    {
      key: "netRating",
      label: "+/-",
      align: "right",
      color: (val) =>
        Number(val) > 0
          ? "var(--cs-semantic-color-feedback-success-main)"
          : Number(val) < 0
            ? "var(--cs-semantic-color-feedback-error-main)"
            : undefined,
      format: (val) => (Number(val) > 0 ? `+${val}` : val),
    },
  ];

  return (
    <>
      <AppPageShell
        breadcrumb={[
          { label: "Teams", to: "/teams" },
          {
            label: team?.name || "Team",
            to: game?.teamId ? `/teams/${game.teamId}` : "/teams",
          },
          { label: `vs ${game?.opponent || "Game"}` },
        ]}
        headerContent={
          <EntityBanner
            title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
            subtitle={`${game?.date ? dayjs(game.date).format("MM-DD-YYYY") : ""} ${game?.time || ""} | ${game?.location || ""}`}
            avatarSrc={game?.opponentLogoUrl}
            avatarColor="var(--cs-semantic-color-action-active)"
            backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
            primaryColor={team?.primaryColor}
            stats={[
              { label: "PPP", value: aggregates.teamData.ppp },
              { label: "Def. PPP", value: aggregates.oppData.ppp },
            ]}
            actions={
              <Stack
                direction="row"
                spacing="var(--cs-semantic-spacing-xs)"
                sx={{ alignItems: "center" }}
              >
                {!isDeleted && (
                  <Stack
                    direction="row"
                    spacing="var(--cs-semantic-spacing-xs)"
                  >
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PracticeIcon />}
                      onClick={() => actions.setIsPracticePlannerOpen(true)}
                      color="success"
                      sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
                    >
                      Practice Planner
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={actions.handleExportPDF}
                      disabled={actions.isExporting}
                      sx={{
                        bgcolor: "var(--cs-semantic-color-action-selected)",
                        color: "var(--cs-semantic-color-text-inverse)",
                        fontSize: "var(--cs-typography-fontSize-xs)",
                      }}
                    >
                      {actions.isExporting ? "Exporting..." : "Export PDF"}
                    </Button>
                  </Stack>
                )}
                {!isDeleted ? (
                  <IconButton
                    onClick={() => actions.setOpenEditDialog(true)}
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      bgcolor: "var(--cs-semantic-color-action-active)",
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                ) : game?.deletedAt && !team?.deletedAt ? (
                  <Button
                    startIcon={<Restore />}
                    variant="contained"
                    color="success"
                    onClick={actions.handleRestoreGame}
                    sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
                  >
                    Restore Game
                  </Button>
                ) : null}
              </Stack>
            }
          />
        }
      >
        <Box
          id="game-stats-container"
          sx={{
            pb: "var(--cs-semantic-spacing-xl)",
            opacity: isDeleted ? 0.7 : 1,
          }}
        >
          {isDeleted && (
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mt: 3 }}>
              <AlertTitle>Read Only Mode</AlertTitle>
              {game?.deletedAt
                ? `This game is scheduled for deletion in ${actions.timeLeft}.`
                : "The associated team is pending deletion."}
            </Alert>
          )}

          <GameFilterBar filters={filters} rawData={rawData} />

          <Grid container spacing="var(--cs-semantic-spacing-md)">
            {filters.activeTab === "impact" && (
              <ImpactAnalyticsSection
                onOffStats={aggregates.onOffStats}
                matchupStats={aggregates.matchupStats}
                players={players}
              />
            )}

            <Grid size={{ xs: 12 }}>
              <DefensiveMetricsCard
                defensiveStats={aggregates.defensiveStats}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <BoxScoreCard
                aggregates={aggregates}
                filters={filters}
                rawData={rawData}
                onExpand={() => filters.setExpandedSection("boxScore")}
              />
            </Grid>

            <Grid size={{ xs: 12, md: filters.compareMode ? 12 : 6 }}>
              <ShotChartCard
                aggregates={aggregates}
                rawData={rawData}
                filters={filters}
                onExpand={() => filters.setExpandedSection("shotChart")}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <ScoreFlowCard
                aggregates={aggregates}
                rawData={rawData}
                filters={filters}
                onExpand={() => filters.setExpandedSection("scoreFlow")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <EfficiencyAnalyticsCard
                aggregates={aggregates}
                onDefensiveIntegrityOpen={() =>
                  actions.setIsDefensiveIntegrityOpen(true)
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <LineupEfficiencyCard
                aggregates={aggregates}
                onExpand={() => filters.setExpandedSection("lineups")}
                onAuditOpen={() => actions.setIsAuditDialogOpen(true)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <SpecialtyExecutionCard
                specialtyExecution={aggregates.specialtyExecution}
              />
            </Grid>
          </Grid>
        </Box>
      </AppPageShell>

      <ExpandedSectionDialog
        open={filters.expandedSection !== null}
        onClose={() => filters.setExpandedSection(null)}
        title={
          filters.expandedSection === "boxScore"
            ? "Box Score"
            : filters.expandedSection === "shotChart"
              ? "Shot Chart"
              : filters.expandedSection === "scoreFlow"
                ? "Score Flow"
                : filters.expandedSection === "lineups"
                  ? "Lineup Efficiency"
                  : ""
        }
      >
        {filters.expandedSection === "boxScore" && (
          <BoxScoreSection
            playerAggregates={aggregates.playerAggregates}
            teamData={aggregates.teamData}
            oppData={aggregates.oppData}
            sortConfig={filters.sortConfig}
            handleSort={filters.handleSort}
          />
        )}
        {filters.expandedSection === "shotChart" && (
          <>
            <ShotChartFilters filters={filters} rawData={rawData} />
            <Box sx={{ p: 1, maxWidth: 800, mx: "auto" }}>
              <BasketballCourt
                markers={
                  filters.shotChartView === "markers"
                    ? aggregates.shotChartMarkers
                    : []
                }
                heatmapData={
                  filters.shotChartView === "heatmap"
                    ? aggregates.heatmapData
                    : undefined
                }
                onMarkerClick={(m) =>
                  filters.setSelectedPlayerId(m.playerId || "ALL")
                }
              />
            </Box>
          </>
        )}
        {filters.expandedSection === "scoreFlow" && (
          <Box sx={{ height: 500 }}>
            <ScoreFlowCard
              aggregates={aggregates}
              rawData={rawData}
              filters={filters}
              onExpand={() => {}}
            />
          </Box>
        )}
        {filters.expandedSection === "lineups" && (
          <StatTable rows={aggregates.lineupStats} columns={lineupColumns} />
        )}
      </ExpandedSectionDialog>

      <EditGameDialog
        open={actions.openEditDialog}
        onClose={() => actions.setOpenEditDialog(false)}
        actions={actions}
      />

      <PracticePlannerDialog
        open={actions.isPracticePlannerOpen}
        onClose={() => actions.setIsPracticePlannerOpen(false)}
        practiceFocusAreas={aggregates.practiceFocusAreas}
      />

      <DefensiveIntegrityDialog
        open={actions.isDefensiveIntegrityOpen}
        onClose={() => actions.setIsDefensiveIntegrityOpen(false)}
        defensiveIntegrity={aggregates.defensiveIntegrity}
      />

      <DeleteGameDialog
        open={actions.isDeleteDialogOpen}
        onClose={() => actions.setIsDeleteDialogOpen(false)}
        onConfirm={actions.handleDeleteGame}
      />

      {gameId && (
        <SubstitutionAuditDialog
          open={actions.isAuditDialogOpen}
          onClose={() => actions.setIsAuditDialogOpen(false)}
          gameId={gameId}
          players={players}
          jerseyMap={aggregates.shotChartJerseyMap}
        />
      )}
    </>
  );
};

export default GameStats;
