import React, { useState } from "react";
import {
  Box,
  Typography,
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
  Chip,
} from "@mui/material";
import { Add as AddIcon, SportsBasketball as BallIcon } from "@mui/icons-material";
import { db, type Game } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import { calculateGameResult } from "../utils/stats";
import { Avatar } from "@mui/material";

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
        const items = await db.games.where("teamId").equals(selectedTeamId).toArray();
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.error("Failed to fetch games:", err);
        return [];
      }
    }, [selectedTeamId]) || [];

  const gameIds = games.map((g) => g.id).filter(Boolean);
  const allStats = useLiveQuery(
    () => (gameIds.length > 0 ? db.stats.where("gameId").anyOf(gameIds as any[]).toArray() : Promise.resolve([])),
    [gameIds]
  ) || [];

  const currentTeam = useLiveQuery(
    () => (selectedTeamId ? db.teams.get(isNaN(Number(selectedTeamId)) ? selectedTeamId : Number(selectedTeamId)) : Promise.resolve(undefined)),
    [selectedTeamId]
  );

  const handleAddGame = async () => {
    if (!selectedTeamId) return;
    try {
      await db.open();
      await db.games.add({
        teamId: selectedTeamId,
        opponent,
        date,
        location,
        synced: 0,
      });
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
      <PageHeader title="Games Schedule" />
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
            {seasons.map((s) => (
              <MenuItem key={s.id} value={s.id?.toString()}>
                {s.name}
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
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id?.toString()}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {selectedTeamId && (
        <MoleskineCard sx={{ p: 2 }}>
          <List>
            {games.length === 0 && (
              <Typography>No games for this team.</Typography>
            )}
            {games.map((game) => {
              const { teamScore, oppScore, result } = calculateGameResult(game.id!, allStats);
              return (
                <ListItem
                  key={game.id}
                  divider
                  sx={{
                    bgcolor: game.completed ? "rgba(0,0,0,0.02)" : "transparent",
                    transition: "background-color 0.2s",
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                      >
                        Stats
                      </Button>
                      {game.completed ? (
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          onClick={() => navigate(`/game?gameId=${game.id}&teamId=${game.teamId}`)}
                        >
                          Edit Game
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/game?gameId=${game.id}&teamId=${game.teamId}`)}
                        >
                          Track
                        </Button>
                      )}
                    </Stack>
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", mr: 2 }}>
                    {currentTeam?.logoUrl ? (
                      <Avatar
                        src={currentTeam.logoUrl}
                        sx={{ width: 32, height: 32, mr: 2, border: "1px solid #eee" }}
                      />
                    ) : (
                      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: "primary.main", fontSize: "0.8rem" }}>
                        <BallIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    )}
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            vs {game.opponent}
                          </Typography>
                          {game.completed && (
                            <Chip
                              label={`${result} ${teamScore}-${oppScore}`}
                              size="small"
                              color={result === "W" ? "success" : result === "L" ? "error" : "default"}
                              sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={`${game.date} @ ${game.location}`}
                    />
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </MoleskineCard>
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
