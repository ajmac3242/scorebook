/**
 * @file Dashboard.tsx
 * @description The main overview page of the application.
 * Displays high-level counts for teams and players stored in the local database.
 */

import React from "react";
import { Typography, Box, Grid, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { Add as AddIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  MoleskineCard,
  PageHeader,
  AnimatedNumber,
} from "../components/SharedUI";

/**
 * Dashboard component providing a high-level summary of the stored data.
 *
 * @returns {React.ReactElement}
 */
const Dashboard: React.FC = () => {
  // Real-time queries for total counts using Dexie hooks
  const teamsCount =
    useLiveQuery(() => db.teams.filter((t) => !t.deletedAt).count()) ?? 0;
  const playersCount =
    useLiveQuery(() => db.players.filter((p) => !p.deletedAt).count()) ?? 0;

  // Configuration for summary cards
  const summaryItems = [
    { label: "Teams", count: teamsCount, to: "/teams", icon: "🏀" },
    {
      label: "Players",
      count: playersCount,
      to: "/players",
      icon: "👤",
    },
  ];

  return (
    <Box>
      <PageHeader title="Notebook Overview" />

      {teamsCount === 0 && (
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
            Your digital basketball coaching notebook is empty. Start by
            creating your first team to begin tracking live games and
            statistics.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              to="/teams"
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Create Your First Team
            </Button>
          </Stack>
        </MoleskineCard>
      )}

      <Grid container spacing={3}>
        {summaryItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.label}>
            <MoleskineCard sx={{ position: "relative", p: 3 }}>
              {/* Decorative icon background */}
              <Typography
                variant="h2"
                sx={{ position: "absolute", top: 16, right: 16, opacity: 0.1 }}
              >
                {item.icon}
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", fontWeight: 600 }}
              >
                {item.label}
              </Typography>

              <Typography
                variant="h3"
                sx={{ my: 2, fontFamily: "var(--serif)" }}
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
                component={Link}
                to={item.to}
                fullWidth
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Open Notebook
              </Button>
            </MoleskineCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
