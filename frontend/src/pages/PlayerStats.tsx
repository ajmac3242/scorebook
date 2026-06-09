import React, { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Warning } from "@mui/icons-material";
import AppPageShell from "../components/layout/AppPageShell";
import EntityBanner from "../components/EntityBanner";
import StatRankRow, {
  type StatRankKpi,
} from "../components/data-display/StatRankRow";
import { useRosterAggregates } from "../hooks/useRosterAggregates";
import {
  usePlayerStatsData,
  usePlayerStatsFilters,
  PlayerShotChartCard,
  PlayerStatsFilterBar,
  EditPlayerDialog,
} from "./PlayerStats/index";
import { PlayerGameLogCard } from "./PlayerStats/sections/PlayerGameLogCard";

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
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );

  const rawData = usePlayerStatsData({ playerId, teamIdParam });
  const {
    player,
    currentTeam,
    availableTeams,
    isDeleted,
    timeLeft,
    accent,
    accentFocus,
    jerseyNumber,
    scopedGames,
    scopedStats,
    selectedTeamId,
    setSelectedTeamId,
  } = rawData;

  const filters = usePlayerStatsFilters({
    games: scopedGames,
    allStats: scopedStats,
    teamIdParam: selectedTeamId,
  });

  const {
    selectedGameId,
    setSelectedGameId,
    selectedGameWindow,
    setSelectedGameWindow,
    filteredStats,
    filteredGames,
    aggregates,
    heatmapData,
  } = filters;

  const rosterAggregates = useRosterAggregates(selectedTeamId || teamIdParam);

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

  const courtMarkers = useMemo(
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
            gamesPlayed={filteredGames.length}
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
          {isDeleted && (
            <Alert severity="warning" icon={<Warning />}>
              <AlertTitle>Pending Deletion</AlertTitle>
              This player is scheduled for deletion in{" "}
              <strong>{timeLeft}</strong>. Restore them from the Players list.
            </Alert>
          )}

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
              <Typography variant="subtitle2" color="text.secondary">
                Summary
              </Typography>

              <PlayerStatsFilterBar
                games={filteredGames}
                availableTeams={availableTeams}
                selectedTeamId={selectedTeamId}
                setSelectedTeamId={setSelectedTeamId}
                selectedGameId={selectedGameId}
                setSelectedGameId={setSelectedGameId}
                selectedGameWindow={selectedGameWindow}
                setSelectedGameWindow={setSelectedGameWindow}
              />

              <StatRankRow
                playerStats={playerStatsForRank}
                rosterStats={rosterStatsForRank}
                kpis={KPI_CONFIG}
              />

              <PlayerGameLogCard
                games={filteredGames}
                allStats={filteredStats}
                playerId={playerId}
              />
            </Stack>
          )}

          {activeTab === "shotChart" && (
            <PlayerShotChartCard
              shotChartView={shotChartView}
              onShotChartViewChange={setShotChartView}
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
