import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  const seasons =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.seasons.toArray();
      } catch (err) {
        console.error("Failed to fetch seasons:", err);
        return [];
      }
    }) || [];

  const teams =
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!selectedSeasonId) return await db.teams.toArray();
        return await db.teams
          .where("seasonId")
          .equals(selectedSeasonId)
          .toArray();
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        return [];
      }
    }, [selectedSeasonId]) || [];

  return (
    <Box>
      <PageHeader title="Teams" />
      <MoleskineCard sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Filter by Season</InputLabel>
          <Select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value as string)}
            label="Filter by Season"
          >
            <MenuItem value="">All Seasons</MenuItem>
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id?.toString()}>
                {season.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </MoleskineCard>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">Teams</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/seasons"
        >
          Manage Seasons
        </Button>
      </Box>

      <Stack spacing={2}>
        {teams.length === 0 && <Typography>No teams found.</Typography>}
        {teams.map((team) => (
          <MoleskineCard
            key={team.id}
            sx={{
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
            }}
            onClick={() => navigate(`/teams/${team.id}`)}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", fontWeight: 600 }}
              >
                {team.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {seasons.find(
                  (s) => s.id?.toString() === team.seasonId?.toString(),
                )?.name || "No Season"}
              </Typography>
            </Box>
          </MoleskineCard>
        ))}
      </Stack>
    </Box>
  );
};

export default Teams;
