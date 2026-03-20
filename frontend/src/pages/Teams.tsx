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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { db, type Team } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#154C56");

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

  const handleAddTeam = async () => {
    if (!selectedSeasonId) {
      alert("Please select a season first");
      return;
    }
    try {
      await db.open();
      const newTeam: Team = {
        name: teamName,
        seasonId: selectedSeasonId,
        logoUrl,
        primaryColor,
        synced: 0,
      };
      await db.teams.add(newTeam);
      setOpen(false);
      setTeamName("");
      setLogoUrl("");
      setPrimaryColor("#154C56");
    } catch (err) {
      console.error("Failed to add team:", err);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
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
        {teams.length === 0 && (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No teams found.
          </Typography>
        )}
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

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 32, right: 32 }}
        onClick={() => setOpen(true)}
        disabled={!selectedSeasonId}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Logo URL (optional)"
            fullWidth
            variant="outlined"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Primary Color
          </Typography>
          <input
            type="color"
            style={{
              display: "block",
              width: "100%",
              height: 40,
              border: "1px solid #D1D1D1",
              borderRadius: 4,
            }}
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTeam}
            variant="contained"
            disabled={!teamName}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
