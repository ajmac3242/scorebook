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
  Button,
  Stack,
  Avatar,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Star as StarIcon,
  TrendingUp,
  Event,
  Assessment,
  Groups,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import PageSectionCard from "../components/layout/PageSectionCard";
import { EmptyState } from "../components/feedback";
import { useTokens } from "../theme/useTokens";
import {
  calculateTeamAggregates,
  calculatePlayerAggregates,
  calculateLineupStats,
  calculateGameResult,
  getInitials,
} from "../utils/stats";
import BasketballCourt from "../components/game/BasketballCourt";
import { getShotZone } from "../utils/shotZones";
import { ACTION_TYPES } from "../constants/stats";
import dayjs from "dayjs";
import { formatDisplayTime } from "../utils/datetime";
import AppPageShell from "../components/layout/AppPageShell";
import KpiStat from "../components/data-display/KpiStat";

/**
 * Dashboard component providing a "My Team" overview or a welcome message.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
    // ⚡ Bolt: Only calculate aggregates for the filtered window
    return calculateTeamAggregates(
      teamGames.filter((g) => gameIds.includes(g?.id || "")),
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
    for (let i = 0; i < allStats.length; i++) {
      const s = allStats[i];
      if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS)
        continue;

      if (selectedPeriod !== "ALL") {
        if (selectedPeriod === "OT") {
          const isHalves = favoriteTeam?.periodType === "HALVES";
          const threshold = isHalves ? 2 : 4;
          if (s.period <= threshold) continue;
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
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
      .slice(0, 3);
  }, [teamGames]);

  if (favoriteTeam === undefined) {
    return (
      <AppPageShell title="Loading Dashboard...">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "40vh",
          }}
        >
          <CircularProgress />
        </Box>
      </AppPageShell>
    );
  }

  if (favoriteTeam === null) {
    return (
      <AppPageShell title="Notebook Overview">
        <EmptyState
          icon={
            <StarIcon
              sx={{ fontSize: tokens.semantic.component.iconSize.xl }}
            />
          }
          title="Welcome to CourtSight!"
          description="Set your primary team to see a personalized dashboard with stats, heatmaps, and upcoming schedule at a glance."
          action={
            <Button
              component={Link}
              to="/teams"
              variant="contained"
              size="large"
              startIcon={<StarIcon />}
            >
              Star a Team in Notebook
            </Button>
          }
        />
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
            mb: tokens.semantic.spacing.md / 8,
            gap: tokens.semantic.spacing.md / 8,
          }}
        >
          <Avatar
            src={favoriteTeam.logoUrl}
            variant="rounded"
            aria-label={`${favoriteTeam.name} team logo`}
            sx={{
              width: 64,
              height: 64,
              bgcolor:
                favoriteTeam.primaryColor ||
                tokens.semantic.color.brand.primary.main,
              fontSize: tokens.typography.fontSize["2xl"],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.inverse,
              boxShadow: tokens.semantic.elevation.shadow.card,
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
                color: tokens.semantic.color.text.primary,
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
                mt: tokens.semantic.spacing.xs / 8,
                fontWeight: tokens.typography.fontWeight.semibold,
                bgcolor: tokens.palette.warningScale[50],
                color: tokens.palette.warningScale[800],
                border: `1px solid ${tokens.palette.warningScale[200]}`,
              }}
            />
          </Box>
        </Box>
      }
    >
      <Grid container spacing={tokens.semantic.spacing.lg / 8}>
        {/* Key Stats */}
        <Grid size={{ xs: 12, md: 8 }}>
          <PageSectionCard sx={{ height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: tokens.semantic.spacing.lg / 8,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: tokens.semantic.spacing.xs / 8,
                }}
              >
                <TrendingUp
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
                >
                  Team Aggregates
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={gameCountFilter}
                exclusive
                onChange={(_, val) => val && setGameCountFilter(val)}
                size="small"
                aria-label="Filter team aggregates by last games count"
              >
                <ToggleButton
                  value="5"
                  sx={{ px: tokens.semantic.spacing.xs / 8 }}
                >
                  L5
                </ToggleButton>
                <ToggleButton
                  value="10"
                  sx={{ px: tokens.semantic.spacing.xs / 8 }}
                >
                  L10
                </ToggleButton>
                <ToggleButton
                  value="all"
                  sx={{ px: tokens.semantic.spacing.xs / 8 }}
                >
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Grid container spacing={tokens.semantic.spacing.md / 8}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <KpiStat label="Record" value={aggregates.record} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <KpiStat label="PPG" value={aggregates.ppg} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <KpiStat label="OPPG" value={aggregates.oppg} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <KpiStat label="RPG" value={aggregates.rpg} />
              </Grid>
            </Grid>

            <Divider sx={{ my: tokens.semantic.spacing.xl / 8 }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                mb: tokens.semantic.spacing.md / 8,
                gap: tokens.semantic.spacing.xs / 8,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: tokens.semantic.spacing.xs / 8,
                }}
              >
                <Assessment
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
                >
                  Shot Efficiency (Heatmap)
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={selectedPeriod}
                exclusive
                onChange={(_, val) => val && setSelectedPeriod(val)}
                size="small"
                aria-label="Filter stats by period"
              >
                <ToggleButton value="ALL" aria-label="Show all periods">
                  All
                </ToggleButton>
                <ToggleButton value="1" aria-label="Show period 1">
                  P1
                </ToggleButton>
                <ToggleButton value="2" aria-label="Show period 2">
                  P2
                </ToggleButton>
                {favoriteTeam?.periodType === "QUARTERS" && (
                  <ToggleButton value="3" aria-label="Show period 3">
                    P3
                  </ToggleButton>
                )}
                {favoriteTeam?.periodType === "QUARTERS" && (
                  <ToggleButton value="4" aria-label="Show period 4">
                    P4
                  </ToggleButton>
                )}
                <ToggleButton value="OT" aria-label="Show overtime">
                  OT
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box
              sx={{
                maxWidth: 600,
                mx: "auto",
                p: tokens.semantic.spacing.xs / 8,
              }}
            >
              <BasketballCourt heatmapData={heatmapData} />
            </Box>

            <Divider sx={{ my: tokens.semantic.spacing.xl / 8 }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: tokens.semantic.spacing.lg / 8,
                gap: tokens.semantic.spacing.xs / 8,
              }}
            >
              <Groups
                sx={{ color: tokens.semantic.color.brand.primary.main }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
              >
                Top Performing Lineups
              </Typography>
            </Box>

            {lineupStats.length === 0 ? (
              <EmptyState
                icon={
                  <Groups
                    sx={{ fontSize: tokens.semantic.component.iconSize.xl }}
                  />
                }
                title="No Lineup Data"
                description="Not enough lineup data for this period."
              />
            ) : (
              <Grid
                container
                spacing={tokens.semantic.spacing.md / 8}
                sx={{ mb: tokens.semantic.spacing.xl / 8 }}
              >
                {lineupStats.slice(0, 3).map((lineup, idx) => (
                  <Grid size={{ xs: 12 }} key={idx}>
                    <Box
                      sx={{
                        p: tokens.semantic.spacing.sm / 8,
                        borderRadius: `${tokens.semantic.shape.radius.md}px`,
                        bgcolor: tokens.semantic.color.action.hover,
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
                              fontSize: tokens.typography.fontSize.xs,
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
                            fontWeight: tokens.typography.fontWeight.black,
                            color:
                              lineup.netRating > 0
                                ? tokens.semantic.color.feedback.success.main
                                : tokens.semantic.color.feedback.error.main,
                          }}
                        >
                          {lineup.netRating > 0 ? "+" : ""}
                          {lineup.netRating}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: tokens.semantic.color.text.secondary }}
                        >
                          NET +/- ({Math.round(lineup.seconds / 60)}m)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            <Divider sx={{ my: tokens.semantic.spacing.xl / 8 }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: tokens.semantic.spacing.lg / 8,
                gap: tokens.semantic.spacing.xs / 8,
              }}
            >
              <StarIcon
                sx={{ color: tokens.semantic.color.brand.primary.main }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
              >
                Season Leaders
              </Typography>
            </Box>
            <Grid container spacing={tokens.semantic.spacing.lg / 8}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: tokens.semantic.color.action.hover,
                    textAlign: "center",
                    border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.semantic.color.text.secondary }}
                  >
                    POINTS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.black,
                      my: tokens.semantic.spacing.xs / 8,
                    }}
                  >
                    {leaders.ppg?.points || "0.0"}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: tokens.typography.fontWeight.semibold }}
                  >
                    {leaders.ppg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: tokens.semantic.color.action.hover,
                    textAlign: "center",
                    border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.semantic.color.text.secondary }}
                  >
                    REBOUNDS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.black,
                      my: tokens.semantic.spacing.xs / 8,
                    }}
                  >
                    {leaders.rpg?.rebounds || "0.0"}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: tokens.typography.fontWeight.semibold }}
                  >
                    {leaders.rpg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <PageSectionCard
                  sx={{
                    bgcolor: tokens.semantic.color.action.hover,
                    textAlign: "center",
                    border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.semantic.color.text.secondary }}
                  >
                    ASSISTS PER GAME
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.black,
                      my: tokens.semantic.spacing.xs / 8,
                    }}
                  >
                    {leaders.apg?.assists || "0.0"}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: tokens.typography.fontWeight.semibold }}
                  >
                    {leaders.apg?.name || "N/A"}
                  </Typography>
                </PageSectionCard>
              </Grid>
            </Grid>
          </PageSectionCard>
        </Grid>

        {/* Schedule & Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={tokens.semantic.spacing.lg / 8}>
            <PageSectionCard>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: tokens.semantic.spacing.md / 8,
                  gap: tokens.semantic.spacing.xs / 8,
                }}
              >
                <Assessment
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
                >
                  Recent Results
                </Typography>
              </Box>
              {recentResults.length === 0 ? (
                <EmptyState
                  icon={
                    <Assessment
                      sx={{ fontSize: tokens.semantic.component.iconSize.xl }}
                    />
                  }
                  title="No Recent Results"
                  description="No games completed yet."
                />
              ) : (
                <Stack spacing={tokens.semantic.spacing.md / 8}>
                  {recentResults.map((game) => (
                    <Box
                      key={game.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View stats for game vs ${game.opponent}`}
                      sx={{
                        p: tokens.semantic.spacing.md / 8,
                        borderRadius: `${tokens.semantic.shape.radius.md}px`,
                        bgcolor: tokens.semantic.color.action.hover,
                        border: `1px solid ${tokens.semantic.color.border.subtle}`,
                        cursor: "pointer",
                        transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
                        "&:hover": {
                          bgcolor: tokens.semantic.color.action.selected,
                          transform: "translateY(-4px)",
                          boxShadow: tokens.semantic.elevation.shadow.card,
                        },
                      }}
                      onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(`/game/stats?gameId=${game.id}`);
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: tokens.semantic.spacing.xs / 8,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: tokens.semantic.color.text.secondary }}
                        >
                          {dayjs(game.date).format("MMM D")}
                        </Typography>
                        <Chip
                          label={game.result}
                          size="small"
                          color={
                            game.result === "W"
                              ? "success"
                              : game.result === "L"
                                ? "error"
                                : "default"
                          }
                          sx={{
                            height: 16,
                            fontSize: tokens.typography.fontSize.xs,
                            fontWeight: tokens.typography.fontWeight.black,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                        >
                          vs {game.opponent}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: tokens.typography.fontWeight.black,
                          }}
                        >
                          {game.teamScore} - {game.oppScore}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </PageSectionCard>

            <PageSectionCard>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: tokens.semantic.spacing.md / 8,
                  gap: tokens.semantic.spacing.xs / 8,
                }}
              >
                <Event
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
                >
                  Upcoming Games
                </Typography>
              </Box>
              {upcomingGames.length === 0 ? (
                <EmptyState
                  icon={
                    <Event
                      sx={{ fontSize: tokens.semantic.component.iconSize.xl }}
                    />
                  }
                  title="No Upcoming Games"
                  description="No upcoming games scheduled."
                />
              ) : (
                <Stack spacing={tokens.semantic.spacing.md / 8}>
                  {upcomingGames.map((game) => (
                    <Box
                      key={game.id}
                      sx={{
                        p: tokens.semantic.spacing.md / 8,
                        borderRadius: `${tokens.semantic.shape.radius.md}px`,
                        bgcolor: tokens.semantic.color.action.hover,
                        border: `1px solid ${tokens.semantic.color.border.subtle}`,
                        cursor: "pointer",
                        transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
                        "&:hover": {
                          bgcolor: tokens.semantic.color.action.selected,
                          transform: "translateY(-4px)",
                          boxShadow: tokens.semantic.elevation.shadow.card,
                        },
                      }}
                      onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(`/game/stats?gameId=${game.id}`);
                        }
                      }}
                      aria-label={`Upcoming game vs ${game.opponent} on ${dayjs(game.date).format("MMM D, YYYY")}`}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: tokens.semantic.spacing.xs / 8,
                          color: tokens.semantic.color.text.secondary,
                        }}
                      >
                        {dayjs(game.date).format("MMM D, YYYY")}{" "}
                        {formatDisplayTime(game.time)}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: tokens.semantic.typography.h6.fontWeight,
                        }}
                      >
                        vs {game.opponent}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: tokens.semantic.color.text.secondary }}
                      >
                        {game.location}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: tokens.semantic.spacing.lg / 8 }}
                onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                aria-label={`View full schedule for ${favoriteTeam.name}`}
              >
                View Full Schedule
              </Button>
            </PageSectionCard>

            <PageSectionCard
              sx={{
                bgcolor:
                  favoriteTeam.primaryColor ||
                  tokens.semantic.color.brand.primary.main,
                color: tokens.semantic.color.text.inverse,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: tokens.semantic.typography.h6.fontWeight,
                  mb: tokens.semantic.spacing.sm / 8,
                }}
              >
                Quick Actions
              </Typography>
              <Stack spacing={tokens.semantic.spacing.sm / 8}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: tokens.semantic.color.action.hover,
                    "&:hover": { bgcolor: tokens.semantic.color.action.active },
                  }}
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                >
                  Schedule New Game
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: tokens.semantic.color.action.hover,
                    "&:hover": { bgcolor: tokens.semantic.color.action.active },
                  }}
                  startIcon={<Assessment />}
                  onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                >
                  Manage Roster
                </Button>
              </Stack>
            </PageSectionCard>
          </Stack>
        </Grid>
      </Grid>
    </AppPageShell>
  );
};

export default Dashboard;
