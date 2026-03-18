import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  db,
  type Team,
  type TeamPlayer,
  type Season,
  type Player,
} from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const Teams: React.FC = () => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

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
        if (!selectedSeasonId) return [];
        return await db.teams
          .where("seasonId")
          .equals(selectedSeasonId)
          .toArray();
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        return [];
      }
    }, [selectedSeasonId]) || [];

  const players =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.players.toArray();
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
    }) || [];

  const teamPlayers =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.teamPlayers.toArray();
      } catch (err) {
        console.error("Failed to fetch teamPlayers:", err);
        return [];
      }
    }) || [];

  const handleAddTeam = async () => {
    if (!selectedSeasonId) return;
    const newTeam: Team = {
      seasonId: selectedSeasonId,
      name: newTeamName,
      synced: 0,
    };
    try {
      await db.open();
      await db.teams.add(newTeam);
      setOpenTeamDialog(false);
      setNewTeamName("");
    } catch (err) {
      console.error("Failed to add team:", err);
    }
  };

  const handleAddPlayerToTeam = async (playerId: string) => {
    if (!activeTeamId) return;
    // Check if already in team
    const exists = teamPlayers.find(
      (tp) => tp.teamId === activeTeamId && tp.playerId === playerId,
    );
    if (exists) return;

    const newTeamPlayer: TeamPlayer = {
      teamId: activeTeamId,
      playerId: playerId,
      synced: 0,
    };
    try {
      await db.open();
      await db.teamPlayers.add(newTeamPlayer);
    } catch (err) {
      console.error("Failed to add player to team:", err);
    }
  };

  const getPlayersForTeam = (teamId: string) => {
    const playerIds = teamPlayers
      .filter((tp) => tp.teamId === teamId.toString())
      .map((tp) => tp.playerId);
    return players.filter((p) => playerIds.includes(p.id?.toString() || ""));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Team Management
      </Typography>

      <Paper className="moleskine-card" sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Select Season</InputLabel>
          <Select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value as string)}
            label="Select Season"
          >
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id?.toString()}>
                {season.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedSeasonId && (
        <Box>
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
              onClick={() => setOpenTeamDialog(true)}
            >
              New Team
            </Button>
          </Box>

          <Stack spacing={2}>
            {teams.length === 0 && (
              <Typography>No teams in this season.</Typography>
            )}
            {teams.map((team) => (
              <Paper key={team.id} className="moleskine-card">
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">{team.name}</Typography>
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                      setActiveTeamId(team.id?.toString() || null);
                      setOpenRosterDialog(true);
                    }}
                  >
                    Manage Roster
                  </Button>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {getPlayersForTeam(team.id?.toString() || "").map((p) => (
                    <Chip
                      key={p.id}
                      label={`${p.name} (#${p.defaultNumber})`}
                      variant="outlined"
                    />
                  ))}
                  {getPlayersForTeam(team.id?.toString() || "").length ===
                    0 && (
                    <Typography variant="body2" color="text.secondary">
                      No players assigned.
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* New Team Dialog */}
      <Dialog open={openTeamDialog} onClose={() => setOpenTeamDialog(false)}>
        <DialogTitle>Add New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTeamDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTeam} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog
        open={openRosterDialog}
        onClose={() => setOpenRosterDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Players to Roster</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select players from the master list to add to this team.
          </Typography>
          <List>
            {players.map((player) => {
              const isInTeam = teamPlayers.some(
                (tp) =>
                  tp.teamId === activeTeamId &&
                  tp.playerId === player.id?.toString(),
              );
              return (
                <ListItem
                  key={player.id}
                  secondaryAction={
                    <Button
                      disabled={isInTeam}
                      onClick={() =>
                        handleAddPlayerToTeam(player.id?.toString() || "")
                      }
                    >
                      {isInTeam ? "In Roster" : "Add"}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={player.name}
                    secondary={`#${player.defaultNumber}`}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRosterDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
