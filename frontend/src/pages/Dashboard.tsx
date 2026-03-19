import React from "react";
import { Typography, Box, Grid, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

const Dashboard: React.FC = () => {
  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const teams = useLiveQuery(() => db.teams.toArray()) || [];
  const players = useLiveQuery(() => db.players.toArray()) || [];

  return (
    <Box>
      <PageHeader title="Notebook Overview" />
      <Grid container spacing={3}>
        {[
          { label: "Seasons", count: seasons.length, to: "/seasons", icon: "📅" },
          { label: "Teams", count: teams.length, to: "/teams", icon: "🏀" },
          { label: "Players", count: players.length, to: "/players", icon: "👤" },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.label}>
            <MoleskineCard sx={{ position: "relative", p: 3 }}>
              <Typography variant="h2" sx={{ position: "absolute", top: 16, right: 16, opacity: 0.1 }}>{item.icon}</Typography>
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)", fontWeight: 600 }}>{item.label}</Typography>
              <Typography variant="h3" sx={{ my: 2, fontFamily: "var(--serif)" }}>{item.count}</Typography>
              <Button component={Link} to={item.to} fullWidth variant="outlined" sx={{ mt: 1 }}>Open Notebook</Button>
            </MoleskineCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
