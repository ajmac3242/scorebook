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
  Tooltip,
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
import { useTokens } from "../theme/useTokens";

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
import { ConfirmDialog } from "../components/dialogs";
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
  const tokens = useTokens();
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
        <Stack direction="row" spacing={tokens.semantic.spacing.xs / 8}>
          {(val as string[]).map((pId) => (
            <Avatar
              key={pId}
              sx={{
                width: 24,
                height: 24,
                fontSize: tokens.typography.fontSize.xs,
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
          ? tokens.semantic.color.feedback.success.main
          : Number(val) < 0
            ? tokens.semantic.color.feedback.error.main
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
            avatarColor={tokens.semantic.color.action.active}
            backTo={game?.teamId ? `/teams/${game.teamId}` : "/teams"}
            primaryColor={team?.primaryColor}
            stats={[
              { label: "PPP", value: aggregates.teamData.ppp },
              { label: "Def. PPP", value: aggregates.oppData.ppp },
            ]}
            actions={
              <Stack
                direction="row"
                spacing={tokens.semantic.spacing.xs / 8}
                sx={{ alignItems: "center" }}
              >
                {!isDeleted && (
                  <Stack
                    direction="row"
                    spacing={tokens.semantic.spacing.xs / 8}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PracticeIcon />}
                      onClick={() => actions.setIsPracticePlannerOpen(true)}
                      color="success"
                      sx={{ fontSize: tokens.typography.fontSize.xs }}
                    >
                      Practice Planner
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={actions.handleExportPDF}
                      disabled={actions.isExporting}
                      sx={{
                        bgcolor: tokens.semantic.color.action.selected,
                        color: tokens.semantic.color.text.inverse,
                        fontSize: tokens.typography.fontSize.xs,
                      }}
                    >
                      {actions.isExporting ? "Exporting..." : "Export PDF"}
                    </Button>
                  </Stack>
                )}
                {!isDeleted ? (
                  <Tooltip title="Edit game details">
                    <IconButton
                      onClick={() => actions.setOpenEditDialog(true)}
                      aria-label="Edit game details"
                      aria-haspopup="dialog"
                      sx={{
                        color: tokens.semantic.color.text.inverse,
                        bgcolor: tokens.semantic.color.action.active,
                        "&:hover": {
                          bgcolor: tokens.semantic.color.action.hover,
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                ) : game?.deletedAt && !team?.deletedAt ? (
                  <Button
                    startIcon={<Restore />}
                    variant="contained"
                    color="success"
                    onClick={actions.handleRestoreGame}
                    sx={{ fontSize: tokens.typography.fontSize.xs }}
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
            pb: tokens.semantic.spacing.xl / 8,
            opacity: isDeleted ? 0.7 : 1,
          }}
        >
          {isDeleted && (
            <Alert
              severity="warning"
              icon={<Warning />}
              sx={{
                mb: tokens.semantic.spacing.lg / 8,
                mt: tokens.semantic.spacing.md / 8,
              }}
            >
              <AlertTitle>Read Only Mode</AlertTitle>
              {game?.deletedAt
                ? `This game is scheduled for deletion in ${actions.timeLeft}.`
                : "The associated team is pending deletion."}
            </Alert>
          )}

          <GameFilterBar filters={filters} rawData={rawData} />

          <Grid container spacing={tokens.semantic.spacing.md / 8}>
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
            <Box
              sx={{
                p: tokens.semantic.spacing.xs / 8,
                maxWidth: 800,
                mx: "auto",
              }}
            >
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

      <ConfirmDialog
        open={actions.isDeleteDialogOpen}
        title="Delete Game?"
        description="Are you sure you want to delete this game? You will have 24 hours to restore it."
        confirmLabel="Yes, Delete"
        onConfirm={actions.handleDeleteGame}
        onClose={() => actions.setIsDeleteDialogOpen(false)}
        destructive
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
