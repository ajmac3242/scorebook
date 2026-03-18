import React from "react";
import { Typography, Box, Grid, Paper, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

const Dashboard: React.FC = () => {
  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const teams = useLiveQuery(() => db.teams.toArray()) || [];
  const players = useLiveQuery(() => db.players.toArray()) || [];

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontFamily: "var(--serif)", mb: 4, textAlign: "center" }}
      >
        Notebook Overview
      </Typography>
      <Grid container spacing={3}>
        {[
          {
            label: "Seasons",
            count: seasons.length,
            to: "/seasons",
            icon: "📅",
          },
          { label: "Teams", count: teams.length, to: "/teams", icon: "🏀" },
          {
            label: "Players",
            count: players.length,
            to: "/players",
            icon: "👤",
          },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.label}>
            <Paper className="moleskine-card" sx={{ p: 3, position: "relative" }}>
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
                {item.count}
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
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
