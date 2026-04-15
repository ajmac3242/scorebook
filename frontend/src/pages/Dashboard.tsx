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
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Star as StarIcon,
  TrendingUp,
  Event,
  Assessment,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { MoleskineCard, PageHeader, StatItem } from "../components/SharedUI";
import { calculateTeamAggregates, getInitials } from "../utils/stats";
import BasketballCourt from "../components/BasketballCourt";
import { getShotZone } from "../utils/shotZones";
import { ACTION_TYPES } from "../constants/stats";
import dayjs from "dayjs";

/**
 * Dashboard component providing a "My Team" overview or a welcome message.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Find the starred team
  const favoriteTeam = useLiveQuery(
    () => db.teams.where("isFavorite").equals(1).first(),
    [],
  );

  const teamId = favoriteTeam?.id;

  // Fetch games for the favorite team
  const teamGamesRaw = useLiveQuery(
    async () =>
      teamId ? await db.games.where("teamId").equals(teamId).toArray() : [],
    [teamId],
  );
  const teamGames = useMemo(() => teamGamesRaw || [], [teamGamesRaw]);

  // Fetch stats for all those games
  const gameIds = useMemo(
    () => teamGames.map((g) => g.id).filter(Boolean) as string[],
    [teamGames],
  );
  const allStatsRaw = useLiveQuery(
    async () =>
      gameIds.length > 0
        ? await db.stats.where("gameId").anyOf(gameIds).toArray()
        : [],
    [gameIds],
  );
  const allStats = useMemo(() => allStatsRaw || [], [allStatsRaw]);

  const aggregates = useMemo(
    () => calculateTeamAggregates(teamGames, allStats),
    [teamGames, allStats],
  );

  /**
   * ⚡ Bolt: Efficiently aggregate team-wide heatmap data.
   * Uses direct property access to minimize overhead in large historical datasets.
   */
  const heatmapData = useMemo(() => {
    const heatmap: Record<string, { makes: number; attempts: number }> = {};
    for (let i = 0, len = allStats.length; i < len; i++) {
      const s = allStats[i];
      const type = s.type;
      if (type !== ACTION_TYPES.MAKE && type !== ACTION_TYPES.MISS) continue;

      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      let entry = heatmap[zone];
      if (!entry) {
        entry = { makes: 0, attempts: 0 };
        heatmap[zone] = entry;
      }
      entry.attempts++;
      if (type === ACTION_TYPES.MAKE) entry.makes++;
    }
    return heatmap;
  }, [allStats]);

  const upcomingGames = useMemo(() => {
    const now = dayjs();
    return teamGames
      .filter(
        (g) => !g.completed && dayjs(g.date).isAfter(now.subtract(1, "day")),
      )
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
      .slice(0, 3);
  }, [teamGames]);

  if (!favoriteTeam) {
    return (
      <Box>
        <PageHeader title="Notebook Overview" />
        <MoleskineCard sx={{ p: { xs: 4, sm: 8 }, mb: 4, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{ fontFamily: "var(--serif)", mb: 2, fontWeight: 700 }}
          >
            Welcome to Scorebook!
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
        </MoleskineCard>
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
        <Grid item xs={12} md={8}>
          <MoleskineCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Season Aggregates
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <StatItem label="Record" value={aggregates.record} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatItem label="PPG" value={aggregates.ppg} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatItem label="OPPG" value={aggregates.oppg} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatItem label="RPG" value={aggregates.rpg} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Shot Efficiency (Heatmap)
              </Typography>
            </Box>
            <Box sx={{ maxWidth: 600, mx: "auto", p: 1 }}>
              <BasketballCourt heatmapData={heatmapData} />
            </Box>
          </MoleskineCard>
        </Grid>

        {/* Schedule & Actions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
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
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
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
