import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Alert, AlertTitle, Box, Stack, Tab, Tabs } from "@mui/material";
import { Warning } from "@mui/icons-material";
import AppPageShell from "../components/layout/AppPageShell";
import EntityBanner from "../components/EntityBanner";
import StatRankRow, {
  type StatRankKpi,
} from "../components/data-display/StatRankRow";
import {
  useRosterAggregates,
  type RosterPlayerStats,
} from "../hooks/useRosterAggregates";
import {
  usePlayerStatsData,
  usePlayerStatsFilters,
  PlayerSummaryCard,
  PlayerShotChartCard,
  PlayerStatsFilterBar,
  EditPlayerDialog,
} from "./PlayerStats/index";
import { PlayerGameLogCard } from "./PlayerStats/sections/PlayerGameLogCard";

const ACTION_TYPES = [
  "MAKE",
  "MISS",
  "REBOUND",
  "ASSIST",
  "STEAL",
  "TURNOVER",
  "BLOCK",
  "FOUL",
];

const KPI_CONFIG: StatRankKpi[] = [
  { label: "PPG", statKey: "points", formatValue: (v) => v.toFixed(1) },
  { label: "RPG", statKey: "rebounds", formatValue: (v) => v.toFixed(1) },
  { label: "APG", statKey: "assists", formatValue: (v) => v.toFixed(1) },
  {
    label: "FG%",
    statKey: "fgPctRaw",
    formatValue: (v) => `${Math.round(v)}%`,
  },
  { label: "MIN", statKey: "min", formatValue: (v) => v.toFixed(0) },
];

const PlayerStats: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "shotChart">("stats");

  const rawData = usePlayerStatsData({ playerId, teamIdParam });
  const filters = usePlayerStatsFilters({ ...rawData });

  const {
    player,
    currentTeam,
    isDeleted,
    timeLeft,
    accent,
    accentFocus,
    jerseyNumber,
    games,
    allStats,
  } = rawData;

  const {
    selectedGameId,
    setSelectedGameId,
    selectedType,
    setSelectedType,
    clutchFilter,
    setClutchFilter,
    shotChartView,
    setShotChartView,
    filteredStats,
    aggregates,
    heatmapData,
  } = filters;

  const rosterAggregates = useRosterAggregates(teamIdParam);

  const playerStatsForRank: Record<string, number> = {
    points: aggregates.points,
    rebounds: aggregates.rebounds,
    assists: aggregates.assists,
    fgPctRaw: parseFloat(aggregates.fgPct),
    min: aggregates.min,
  };

  const rosterStatsForRank: Record<string, number>[] =
    rosterAggregates.length > 0
      ? (rosterAggregates as unknown as Record<string, number>[])
      : [playerStatsForRank];

  const courtMarkers = React.useMemo(
    () =>
      filteredStats
        .filter(
          (s) =>
            (s.type === "MAKE" || s.type === "MISS") &&
            s.locationX !== undefined &&
            s.locationY !== undefined,
        )
        .map((s, i) => ({
          id: `${s.gameId}-${i}`,
          x: s.locationX ?? 0,
          y: s.locationY ?? 0,
          type: s.type,
          label: s.type,
          color:
            s.type === "MAKE"
              ? accent
              : "var(--cs-semantic-color-feedback-error-main)",
          playerId,
          playerName: player?.name || "Player",
        })),
    [filteredStats, accent, playerId, player?.name],
  );

  const selectedGame = React.useMemo(
    () => games.find((g) => g.id === selectedGameId),
    [games, selectedGameId],
  );

  return (
    <Box sx={{ opacity: isDeleted ? 0.78 : 1 }}>
      <AppPageShell
        bleedHeader
        headerContent={
          <EntityBanner
            title={player?.name || "Player"}
            subtitle={currentTeam?.name || "Career Stats"}
            backTo="/players"
            backToLabel="Players"
            square
            gamesPlayed={games.length}
            avatarColor={accent}
            primaryColor={currentTeam?.primaryColor || accent}
            jerseyNumber={jerseyNumber}
            onEdit={!isDeleted ? () => setOpenEditDialog(true) : undefined}
            editLabel="Edit player"
            stats={[
              { label: "MIN", value: aggregates.min },
              { label: "PTS", value: aggregates.points },
              { label: "REB", value: aggregates.rebounds },
              { label: "AST", value: aggregates.assists },
              { label: "FG%", value: `${aggregates.fgPct}%` },
            ]}
          />
        }
      >
        <Stack spacing={2.5}>
          <PlayerStatsFilterBar
            games={games}
            selectedGameId={selectedGameId}
            setSelectedGameId={setSelectedGameId}
            actionTypes={ACTION_TYPES}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            clutchFilter={clutchFilter}
            setClutchFilter={setClutchFilter}
            shotChartView={shotChartView}
            setShotChartView={setShotChartView}
            selectedGame={selectedGame}
            accent={accent}
          />

          {isDeleted && (
            <Alert severity="warning" icon={<Warning />}>
              <AlertTitle>Pending Deletion</AlertTitle>
              This player is scheduled for deletion in <strong>{timeLeft}</strong>. Restore them from the Players list.
            </Alert>
          )}

          <StatRankRow
            playerStats={playerStatsForRank}
            rosterStats={rosterStatsForRank}
            kpis={KPI_CONFIG}
          />

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ minHeight: 40 }}
            >
              <Tab label="Stats" value="stats" />
              <Tab label="Shot Chart" value="shotChart" />
            </Tabs>
          </Box>

          {activeTab === "stats" && (
            <Stack spacing={2.5}>
              <PlayerSummaryCard
                aggregates={aggregates}
                currentTeam={currentTeam}
                selectedType={selectedType}
                selectedGameId={selectedGameId}
                clutchFilter={clutchFilter}
              />
              <PlayerGameLogCard
                games={games}
                allStats={allStats}
                playerId={playerId}
              />
            </Stack>
          )}

          {activeTab === "shotChart" && (
            <PlayerShotChartCard
              shotChartView={shotChartView}
              courtMarkers={courtMarkers}
              heatmapData={heatmapData}
              eventCount={filteredStats.length}
            />
          )}
        </Stack>
      </AppPageShell>

      <EditPlayerDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        player={player}
        playerId={playerId}
        accentFocus={accentFocus}
      />
    </Box>
  );
};

export default PlayerStats;
