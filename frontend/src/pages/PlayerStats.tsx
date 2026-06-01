import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Grid,
  Stack,
} from "@mui/material";
import { Warning } from "@mui/icons-material";
import AppPageShell from "../components/layout/AppPageShell";
import EntityBanner from "../components/EntityBanner";
import {
  usePlayerStatsData,
  usePlayerStatsFilters,
  PlayerSummaryCard,
  PlayerShotChartCard,
  PlayerActionLogCard,
  PlayerStatsFilterBar,
  EditPlayerDialog,
} from "./PlayerStats/index";
import { IconButton, Tooltip } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";

const ACTION_TYPES = ["MAKE", "MISS", "REBOUND", "ASSIST", "STEAL", "TURNOVER", "BLOCK", "FOUL"];

const PlayerStats: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const [openEditDialog, setOpenEditDialog] = useState(false);

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

  const courtMarkers = React.useMemo(() => {
    return filteredStats
      .filter(
        (stat) =>
          (stat.type === "MAKE" || stat.type === "MISS") &&
          stat.locationX !== undefined &&
          stat.locationY !== undefined,
      )
      .map((stat, index) => ({
        id: `${stat.gameId}-${index}`,
        x: stat.locationX ?? 0,
        y: stat.locationY ?? 0,
        type: stat.type,
        label: stat.type,
        color: stat.type === "MAKE" ? accent : "var(--cs-semantic-color-feedback-error-main)",
        playerId,
        playerName: player?.name || "Player",
      }));
  }, [filteredStats, accent, playerId, player?.name]);

  const selectedGame = React.useMemo(
    () => games.find((game) => game.id === selectedGameId),
    [games, selectedGameId],
  );

  return (
    <Box sx={{ opacity: isDeleted ? 0.78 : 1 }}>
      <AppPageShell
        breadcrumb={[
          { label: "Players", to: "/players" },
          { label: player?.name || "Player" },
        ]}
        headerContent={
          <EntityBanner
            title={player?.name || "Player"}
            subtitle={currentTeam?.name || "Career Stats"}
            avatarColor={accent}
            jerseyNumber={jerseyNumber}
            actions={
              <Tooltip title="Edit player">
                <span>
                  <IconButton
                    aria-label="edit player"
                    onClick={() => setOpenEditDialog(true)}
                    disabled={isDeleted}
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      bgcolor: "rgba(255,255,255,0.1)",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.2)",
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            }
            stats={[
              { label: "MIN", value: aggregates.min },
              { label: "PTS", value: aggregates.points },
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
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 0 }}>
              <AlertTitle>Pending Deletion</AlertTitle>
              This player is scheduled for deletion in{" "}
              <strong>{timeLeft}</strong>. Restore them from the Players list.
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, xl: 4 }}>
              <PlayerSummaryCard
                aggregates={aggregates}
                currentTeam={currentTeam}
                selectedType={selectedType}
                selectedGameId={selectedGameId}
                clutchFilter={clutchFilter}
              />
            </Grid>

            <Grid size={{ xs: 12, xl: 8 }}>
              <PlayerShotChartCard
                shotChartView={shotChartView}
                setShotChartView={setShotChartView}
                courtMarkers={courtMarkers}
                heatmapData={heatmapData}
                accentColor={accent}
                eventCount={filteredStats.length}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <PlayerActionLogCard filteredEvents={filteredStats} games={games} />
            </Grid>
          </Grid>
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
