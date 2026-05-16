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
import { MoleskineCard, PageHeader, StatItem } from "../components/SharedUI";
import {
  calculateTeamAggregates,
  calculatePlayerAggregates,
  calculateLineupStats,
  calculateGameResult,
  getInitials,
} from "../utils/stats";
import BasketballCourt from "../components/BasketballCourt";
import { getShotZone } from "../utils/shotZones";
import { ACTION_TYPES } from "../constants/stats";
import dayjs from "dayjs";

/**
 * Dashboard component providing a "My Team" overview or a welcome message.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
      <Box>
        <PageHeader title="Notebook Overview" />
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 6, sm: 10 },
            px: { xs: 2, sm: 4 },
            bgcolor: "rgba(0,0,0,0.02)",
            borderRadius: 4,
            border: "2px dashed rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <StarIcon
            sx={{
              fontSize: 64,
              color: "primary.main",
              opacity: 0.2,
              mb: 2,
            }}
          />
          <Typography
            variant="h4"
            sx={{ fontFamily: "var(--serif)", mb: 2, fontWeight: 700 }}
          >
            Welcome to CourtSight!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
          >
            Set your primary team to see a personalized dashboard with stats,
            heatmaps, and upcoming schedule at a glance.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              to="/teams"
              variant="contained"
              size="large"
              startIcon={<StarIcon />}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Star a Team in Notebook
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Avatar
          src={favoriteTeam.logoUrl}
          variant="rounded"
          sx={{
            width: 64,
            height: 64,
            bgcolor: favoriteTeam.primaryColor || "primary.main",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {getInitials(favoriteTeam.name)}
        </Avatar>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontFamily: "var(--serif)", fontWeight: 800 }}
          >
            {favoriteTeam.name}
          </Typography>
          <Chip
            icon={
              <StarIcon
                sx={{
                  fontSize: "1rem !important",
                  color: "#FFD700 !important",
                }}
              />
            }
            label="My Team"
            size="small"
            sx={{
              mt: 0.5,
              fontWeight: 600,
              bgcolor: "rgba(255, 215, 0, 0.1)",
              color: "#B8860B",
              border: "1px solid rgba(255, 215, 0, 0.3)",
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Key Stats */}
        <Grid  size={{ xs: 12, md: 8 }}>
          <MoleskineCard sx={{ height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
                <ToggleButton value="5" sx={{ px: 1.5 }}>
                  L5
                </ToggleButton>
                <ToggleButton value="10" sx={{ px: 1.5 }}>
                  L10
                </ToggleButton>
                <ToggleButton value="all" sx={{ px: 1.5 }}>
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Grid container spacing={2}>
              <Grid  size={{ xs: 6, sm: 3 }}>
                <StatItem label="Record" value={aggregates.record} />
              </Grid>
              <Grid  size={{ xs: 6, sm: 3 }}>
                <StatItem label="PPG" value={aggregates.ppg} />
              </Grid>
              <Grid  size={{ xs: 6, sm: 3 }}>
                <StatItem label="OPPG" value={aggregates.oppg} />
              </Grid>
              <Grid  size={{ xs: 6, sm: 3 }}>
                <StatItem label="RPG" value={aggregates.rpg} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                mb: 2,
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
            <Box sx={{ maxWidth: 600, mx: "auto", p: 1 }}>
              <BasketballCourt heatmapData={heatmapData} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
              <Groups color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Top Performing Lineups
              </Typography>
            </Box>

            {lineupStats.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                Not enough lineup data for this period.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {lineupStats.slice(0, 3).map((lineup, idx) => (
                  <Grid key={idx} size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.02)",
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
                              fontSize: "0.7rem",
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
                                ? "success.main"
                                : "error.main",
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

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
              <StarIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Season Leaders
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid  size={{ xs: 12, sm: 4 }}>
                <MoleskineCard
                  sx={{
                    bgcolor: "rgba(0,0,0,0.02)",
                    textAlign: "center",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    POINTS PER GAME
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>
                    {leaders.ppg?.points || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.ppg?.name || "N/A"}
                  </Typography>
                </MoleskineCard>
              </Grid>
              <Grid  size={{ xs: 12, sm: 4 }}>
                <MoleskineCard
                  sx={{
                    bgcolor: "rgba(0,0,0,0.02)",
                    textAlign: "center",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    REBOUNDS PER GAME
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>
                    {leaders.rpg?.rebounds || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.rpg?.name || "N/A"}
                  </Typography>
                </MoleskineCard>
              </Grid>
              <Grid  size={{ xs: 12, sm: 4 }}>
                <MoleskineCard
                  sx={{
                    bgcolor: "rgba(0,0,0,0.02)",
                    textAlign: "center",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    ASSISTS PER GAME
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>
                    {leaders.apg?.assists || "0.0"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {leaders.apg?.name || "N/A"}
                  </Typography>
                </MoleskineCard>
              </Grid>
            </Grid>
          </MoleskineCard>
        </Grid>

        {/* Schedule & Actions */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <MoleskineCard>
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}
              >
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Results
                </Typography>
              </Box>
              {recentResults.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center" }}
                >
                  No games completed yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {recentResults.map((game) => (
                    <Box
                      key={game.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View stats for game vs ${game.opponent}`}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.04)",
                          transform: "translateY(-4px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                          mb: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
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
                            fontSize: "0.6rem",
                            fontWeight: 900,
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
                          sx={{ fontWeight: 700 }}
                        >
                          vs {game.opponent}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {game.teamScore} - {game.oppScore}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </MoleskineCard>

            <MoleskineCard>
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}
              >
                <Event color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Upcoming Games
                </Typography>
              </Box>
              {upcomingGames.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center" }}
                >
                  No upcoming games scheduled.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {upcomingGames.map((game) => (
                    <Box
                      key={game.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.04)",
                          transform: "translateY(-4px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        {dayjs(game.date).format("MMM D, YYYY")} {game.time}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        vs {game.opponent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {game.location}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                aria-label={`View full schedule for ${favoriteTeam.name}`}
              >
                View Full Schedule
              </Button>
            </MoleskineCard>

            <MoleskineCard
              sx={{
                bgcolor: favoriteTeam.primaryColor || "primary.main",
                color: "white",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
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
                    bgcolor: "rgba(255,255,255,0.2)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  }}
                  startIcon={<Assessment />}
                  onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                >
                  Manage Roster
                </Button>
              </Stack>
            </MoleskineCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
