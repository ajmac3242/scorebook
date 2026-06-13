/**
 * @file Dashboard.tsx
 * @description Redesigned Dashboard to focus on "My Team".
 * Displays high-level stats, heatmaps, and upcoming games for the starred team.
 */

import React, { useMemo } from "react";
import {
  Typography,
  Box,
  Grid,
  Stack,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Star as StarIcon, Groups } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import PageSectionCard from "../components/layout/PageSectionCard";
import { useTokens } from "../theme/useTokens";
import {
  calculateTeamAggregates,
  calculatePlayerAggregates,
  calculateLineupStats,
  calculateGameResult,
  getInitials,
} from "../utils/stats";
import { getShotZone } from "../utils/shotZones";
import { ACTION_TYPES } from "../constants/stats";
import dayjs from "dayjs";
import AppPageShell from "../components/layout/AppPageShell";

// Modular Sections
import TeamAggregatesSection from "./Dashboard/sections/TeamAggregatesSection";
import HeatmapSection from "./Dashboard/sections/HeatmapSection";
import RecentResultsSection from "./Dashboard/sections/RecentResultsSection";
import UpcomingGamesSection from "./Dashboard/sections/UpcomingGamesSection";
import QuickActionsSection from "./Dashboard/sections/QuickActionsSection";

/**
 * Dashboard component providing a "My Team" overview or a welcome message.
 */
const Dashboard: React.FC = () => {
  const tokens = useTokens();
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("ALL");
  const [gameCountFilter, setGameCountFilter] = React.useState<string>("all");

  // Find the starred team
  // 🎨 Palette: Map undefined to null to distinguish "loading" from "not found"
  const favoriteTeam = useLiveQuery(
    () =>
      db.teams
        .where("isFavorite")
        .equals(1)
        .first()
        .then((res) => res || null),
    [],
  );

  const teamId = favoriteTeam?.id;

  // Fetch games for the favorite team
  const rawTeamGames = useLiveQuery(
    () => (teamId ? db.games.where("teamId").equals(teamId).toArray() : []),
    [teamId],
  );

  const teamGames = useMemo(() => rawTeamGames || [], [rawTeamGames]);

  // Fetch stats for all those games
  const gameIds = useMemo(() => {
    if (!Array.isArray(teamGames)) return [];
    const completed = teamGames
      .filter((g) => g?.completed)
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

    let filtered = completed;
    if (gameCountFilter !== "all") {
      filtered = completed.slice(0, parseInt(gameCountFilter));
    }
    return filtered.map((g) => g.id).filter(Boolean) as string[];
  }, [teamGames, gameCountFilter]);

  const rawAllStats = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats.where("gameId").anyOf(gameIds).toArray()
        : [],
    [gameIds],
  );

  const allStats = useMemo(() => rawAllStats || [], [rawAllStats]);

  // Fetch players for leaders section
  const rawTeamPlayers = useLiveQuery(
    () =>
      teamId ? db.teamPlayers.where("teamId").equals(teamId).toArray() : [],
    [teamId],
  );

  const teamPlayers = useMemo(() => rawTeamPlayers || [], [rawTeamPlayers]);

  const playerIds = useMemo(
    () => teamPlayers.map((tp) => tp.playerId),
    [teamPlayers],
  );

  const rawPlayers = useLiveQuery(
    () =>
      playerIds.length > 0
        ? db.players.where("id").anyOf(playerIds).toArray()
        : [],
    [playerIds],
  );

  const players = useMemo(() => rawPlayers || [], [rawPlayers]);

  const aggregates = useMemo(() => {
    if (!Array.isArray(teamGames) || !Array.isArray(allStats)) {
      return {
        ppg: "0.0",
        rpg: "0.0",
        apg: "0.0",
        oppg: "0.0",
        record: "0-0",
        totalGames: 0,
        ppp: "0.00",
        possessions: 0,
        oppPpp: "0.00",
      };
    }
    // ⚡ Bolt: Use a Set for O(1) lookups during filtering
    const gameIdSet = new Set(gameIds);
    return calculateTeamAggregates(
      teamGames.filter((g) => gameIdSet.has(g?.id || "")),
      allStats,
    );
  }, [teamGames, allStats, gameIds]);

  const playerAverages = useMemo(() => {
    if (
      !Array.isArray(players) ||
      !Array.isArray(allStats) ||
      !Array.isArray(teamPlayers)
    )
      return [];
    return calculatePlayerAggregates(players, allStats, teamPlayers, "average");
  }, [players, allStats, teamPlayers]);

  const lineupStats = useMemo(() => {
    if (!Array.isArray(allStats)) return [];
    return calculateLineupStats(allStats).filter(
      (l) => l.seconds > 120, // Min 2 minutes to show on dashboard
    );
  }, [allStats]);

  const leaders = useMemo(() => {
    const sortedByPoints = [...playerAverages].sort(
      (a, b) => b.points - a.points,
    );
    const sortedByRebounds = [...playerAverages].sort(
      (a, b) => b.rebounds - a.rebounds,
    );
    const sortedByAssists = [...playerAverages].sort(
      (a, b) => b.assists - a.assists,
    );

    return {
      ppg: sortedByPoints[0],
      rpg: sortedByRebounds[0],
      apg: sortedByAssists[0],
    };
  }, [playerAverages]);

  const recentResults = useMemo(() => {
    return teamGames
      .filter((g) => g.completed)
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
      .slice(0, 3)
      .map((game) => {
        const { teamScore, oppScore, result } = calculateGameResult(
          game.id!,
          allStats,
        );
        return { ...game, teamScore, oppScore, result };
      });
  }, [teamGames, allStats]);

  const heatmapData = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number }> = {};
    // ⚡ Bolt: Move threshold calculation outside the loop to avoid redundant evaluations
    const isHalves = favoriteTeam?.periodType === "HALVES";
    const otThreshold = isHalves ? 2 : 4;

    for (let i = 0; i < allStats.length; i++) {
      const s = allStats[i];
      if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS)
        continue;

      if (selectedPeriod !== "ALL") {
        if (selectedPeriod === "OT") {
          if (s.period <= otThreshold) continue;
        } else if (s.period.toString() !== selectedPeriod) {
          continue;
        }
      }

      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
      data[zone].attempts++;
      if (s.type === ACTION_TYPES.MAKE) data[zone].makes++;
    }
    return data;
  }, [allStats, selectedPeriod, favoriteTeam?.periodType]);

  const upcomingGames = useMemo(() => {
    const now = dayjs();
    return teamGames
      .filter(
        (g) => !g.completed && dayjs(g.date).isAfter(now.subtract(1, "day")),
      )
      .sort((a) => dayjs(a.date).diff(dayjs(a.date)))
      .slice(0, 3);
  }, [teamGames]);

  if (favoriteTeam === undefined) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (favoriteTeam === null) {
    return (
      <AppPageShell title="Notebook Overview">
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 6, sm: 10 },
            px: { xs: 2, sm: 4 },
            bgcolor: "var(--cs-semantic-color-action-hover)",
            borderRadius: "var(--cs-semantic-shape-radius-xl)",
            border: `2px dashed var(--cs-semantic-color-border-subtle)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <StarIcon
            sx={{
              /* Decorative welcome icon — intentionally larger than icon scale */
              fontSize: 64,
              color: "primary.main",
              opacity: 0.2,
              mb: "var(--cs-semantic-spacing-md)",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: tokens.semantic.typography.h4.fontFamily,
              mb: 2,
              fontWeight: tokens.semantic.typography.h4.fontWeight,
            }}
          >
            Welcome to CourtSight!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: "var(--cs-semantic-spacing-xl)",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Set your primary team to see a personalized dashboard with stats,
            heatmaps, and upcoming schedule at a glance.
          </Typography>
          <Stack
            direction="row"
            spacing="var(--cs-semantic-spacing-md)"
            sx={{ justifyContent: "center" }}
          >
            <Button
              component={Link}
              to="/teams"
              variant="contained"
              size="large"
              startIcon={<StarIcon />}
              sx={{
                px: "var(--cs-semantic-spacing-xl)",
                py: 1.5,
                borderRadius: "var(--cs-semantic-shape-radius-md)",
              }}
            >
              Star a Team in Notebook
            </Button>
          </Stack>
        </Box>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      headerContent={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: "var(--cs-semantic-spacing-md)",
            gap: "var(--cs-semantic-spacing-md)",
          }}
        >
          <Avatar
            src={favoriteTeam.logoUrl}
            variant="rounded"
            sx={{
              width: 64,
              height: 64,
              bgcolor:
                favoriteTeam.primaryColor ||
                tokens.semantic.color.brand.primary.main,
              fontSize: "var(--cs-typography-fontSize-2xl)",
              fontWeight: "bold",
              color: "white",
              boxShadow: "var(--cs-elevation-shadow-card)",
            }}
          >
            {getInitials(favoriteTeam.name)}
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: tokens.semantic.typography.h4.fontFamily,
                fontWeight: tokens.semantic.typography.h4.fontWeight,
                color: "var(--cs-semantic-color-text-primary)",
              }}
            >
              {favoriteTeam.name}
            </Typography>
            <Chip
              icon={
                <StarIcon
                  sx={{
                    fontSize: "1rem !important",
                    color: tokens.palette.warningScale[400],
                  }}
                />
              }
              label="My Team"
              size="small"
              sx={{
                mt: 0.5,
                fontWeight: 600,
                bgcolor: "var(--cs-palette-yellow-50)",
                color: "var(--cs-palette-yellow-800)",
                border: "1px solid var(--cs-palette-yellow-200)",
              }}
            />
          </Box>
        </Box>
      }
    >
      <Grid container spacing="var(--cs-semantic-spacing-lg)">
        {/* Key Stats */}
        <Grid size={{ xs: 12, md: 8 }}>
          <PageSectionCard sx={{ height: "100%" }}>
            <TeamAggregatesSection
              gameCountFilter={gameCountFilter}
              setGameCountFilter={setGameCountFilter}
              aggregates={aggregates}
            />

            <Divider sx={{ my: "var(--cs-semantic-spacing-xl)" }} />

            <HeatmapSection
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              periodType={favoriteTeam?.periodType}
              heatmapData={heatmapData}
            />

            <Divider sx={{ my: "var(--cs-semantic-spacing-xl)" }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: "var(--cs-semantic-spacing-lg)",
                gap: "var(--cs-semantic-spacing-xs)",
              }}
            >
              <Groups color="primary" />
              <Typography
                variant="h6"
                sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
              >
                Top Performing Lineups
              </Typography>
            </Box>

            {lineupStats.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  py: "var(--cs-semantic-spacing-md)",
                  textAlign: "center",
                }}
              >
                Not enough lineup data for this period.
              </Typography>
            ) : (
              <Grid
                container
                spacing="var(--cs-semantic-spacing-md)"
                sx={{ mb: "var(--cs-semantic-spacing-xl)" }}
              >
                {lineupStats.slice(0, 3).map((lineup, idx) => (
                  <Grid size={{ xs: 12 }} key={idx}>
                    <Box
                      sx={{
                        p: "var(--cs-semantic-spacing-sm)",
                        borderRadius: "var(--cs-semantic-shape-radius-md)",
                        bgcolor: "var(--cs-semantic-color-action-hover)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Stack direction="row" spacing={0.5}>
                        {lineup.lineup.map((pId) => (
                          <Avatar
                            key={pId}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "var(--cs-typography-fontSize-xs)",
                              bgcolor: favoriteTeam.primaryColor,
                            }}
                          >
                            {teamPlayers.find((tp) => tp.playerId === pId)
                              ?.jerseyNumber || "??"}
                          </Avatar>
                        ))}
                      </Stack>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            color:
                              lineup.netRating > 0
                                ? "var(--cs-semantic-color-feedback-success-main)"
                                : "var(--cs-semantic-color-feedback-error-main)",
                          }}
                        >
                          {lineup.netRating > 0 ? "+" : ""}
                          {lineup.netRating}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          NET +/- ({Math.round(lineup.seconds / 60)}m)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            <Divider sx={{ my: "var(--cs-semantic-spacing-xl)" }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: "var(--cs-semantic-spacing-lg)",
                gap: "var(--cs-semantic-spacing-xs)",
              }}
            >
              <StarIcon color="primary" />
              <Typography
                variant="h6"
                sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
              >
                Season Leaders
              </Typography>
            </Box>
            <Grid container spacing="var(--cs-semantic-spacing-lg)">
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: "var(--cs-semantic-color-action-hover)",
                    textAlign: "center",
                    border: `1px solid var(--cs-semantic-color-border-subtle)`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    POINTS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      my: "var(--cs-semantic-spacing-xs)",
                    }}
                  >
                    {leaders.ppg?.points || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.ppg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: "var(--cs-semantic-color-action-hover)",
                    textAlign: "center",
                    border: `1px solid var(--cs-semantic-color-border-subtle)`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    REBOUNDS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      my: "var(--cs-semantic-spacing-xs)",
                    }}
                  >
                    {leaders.rpg?.rebounds || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.rpg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: "var(--cs-semantic-color-action-hover)",
                    textAlign: "center",
                    border: `1px solid var(--cs-semantic-color-border-subtle)`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    ASSISTS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      my: "var(--cs-semantic-spacing-xs)",
                    }}
                  >
                    {leaders.apg?.assists || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.apg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
            </Grid>
          </PageSectionCard>
        </Grid>

        {/* Schedule & Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing="var(--cs-semantic-spacing-lg)">
            <RecentResultsSection recentResults={recentResults} />
            <UpcomingGamesSection
              upcomingGames={upcomingGames}
              favoriteTeamId={favoriteTeam.id!}
              favoriteTeamName={favoriteTeam.name}
            />
            <QuickActionsSection favoriteTeam={favoriteTeam} />
          </Stack>
        </Grid>
      </Grid>
    </AppPageShell>
  );
};

export default Dashboard;
