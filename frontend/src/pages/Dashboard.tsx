/**
 * @file Dashboard.tsx
 * @description The main overview page of the application.
 * Displays high-level counts for teams and players stored in the local database.
 */

import React from "react";
import { Typography, Box, Grid, Button } from "@mui/material";
import { Link } from "react-router-dom";
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
                <AnimatedNumber value={item.count} />
              </Typography>

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
