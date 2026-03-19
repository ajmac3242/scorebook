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
  Fab,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { db, type Game } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

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

  const games =
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!selectedTeamId) return [];
        return await db.games.where("teamId").equals(selectedTeamId).toArray();
      } catch (err) {
        console.error("Failed to fetch games:", err);
        return [];
      }
    }, [selectedTeamId]) || [];

  const handleAddGame = async () => {
    if (!selectedTeamId) return;
    const newGame: Game = {
      teamId: selectedTeamId,
      opponent,
      date,
      location,
      synced: 0,
    };
    try {
      await db.open();
      await db.games.add(newGame);
      setOpen(false);
      setOpponent("");
      setDate("");
      setLocation("");
    } catch (err) {
      console.error("Failed to add game:", err);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontFamily: "var(--serif)", mb: 4, textAlign: "center" }}
      >
        Games Schedule
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Filter by Season</InputLabel>
          <Select
            value={selectedSeasonId}
            onChange={(e) => {
              setSelectedSeasonId(e.target.value as string);
              setSelectedTeamId("");
            }}
            label="Filter by Season"
          >
            <MenuItem value="">
              <em>All Seasons</em>
            </MenuItem>
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id?.toString()}>
                {season.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined">
          <InputLabel>Select Team</InputLabel>
          <Select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value as string)}
            label="Select Team"
          >
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id?.toString()}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {selectedTeamId && (
        <Paper className="moleskine-card" sx={{ p: 2 }}>
          <List>
            {games.length === 0 && (
              <Typography>No games for this team.</Typography>
            )}
            {games.map((game) => (
              <ListItem
                key={game.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                    >
                      Stats
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        navigate(
                          `/game?gameId=${game.id}&teamId=${game.teamId}`,
                        )
                      }
                    >
                      Start Tracking
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={`vs ${game.opponent}`}
                  secondary={`${game.date} @ ${game.location}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {selectedTeamId && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: "fixed", bottom: 32, right: 32 }}
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Game</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Opponent"
            type="text"
            fullWidth
            variant="outlined"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddGame} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Games;
