import React, { useState, useMemo } from "react";
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
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  SportsBasketball as BallIcon,
  SportsBasketball as GamesIcon,
} from "@mui/icons-material";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { calculateGameResult } from "../utils/stats";
import { Avatar } from "@mui/material";

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const teams =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.teams.toArray();
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        return [];
      }
    }) || [];

  const games =
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!selectedTeamId) return [];
        const items = await db.games
          .where("teamId")
          .equals(selectedTeamId)
          .toArray();
        return items.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      } catch (error) {
        console.error("Failed to fetch games:", error);
        return [];
      }
    }, [selectedTeamId]) || [];

  const allRecentLocations =
    useLiveQuery(async () => {
      try {
        await db.open();
        const items = await db.games.toArray();
        const locations = items
          .map((g) => g.location)
          .filter(Boolean) as string[];
        return Array.from(new Set(locations)).sort();
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        return [];
      }
    }) || [];

  const gameIds = games.map((g) => g.id).filter(Boolean);
  const allStatsResult = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats
            .where("gameId")
            .anyOf(gameIds as string[])
            .toArray()
        : Promise.resolve([]),
    [gameIds],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const currentTeam = useLiveQuery(
    () =>
      selectedTeamId
        ? db.teams.get(selectedTeamId)
        : Promise.resolve(undefined),
    [selectedTeamId],
  );

  const handleAddGame = async () => {
    if (!selectedTeamId) return;
    try {
      await db.open();
      await db.games.add({
        id: crypto.randomUUID(),
        teamId: selectedTeamId,
        opponent,
        date,
        location,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpen(false);
      setOpponent("");
      setDate("");
      setLocation("");
    } catch (error) {
      console.error("Failed to add game:", error);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <EntityBanner title="Games Schedule" icon={<GamesIcon />} backTo="/" />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, mt: 4 }}
      >
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
              const { teamScore, oppScore, result } = calculateGameResult(
                game.id!,
                allStats,
              );
              return (
                <ListItem
                  key={game.id}
                  divider
                  sx={{
                    bgcolor: game.completed
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                    transition: "background-color 0.2s",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    py: { xs: 2, sm: 1 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      mb: { xs: 2, sm: 0 },
                    }}
                  >
                    {currentTeam?.logoUrl ? (
                      <Avatar
                        src={currentTeam.logoUrl}
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 2,
                          border: "1px solid #eee",
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 2,
                          bgcolor: "primary.main",
                          fontSize: "0.8rem",
                        }}
                      >
                        <BallIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    )}
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            vs {game.opponent}
                          </Typography>
                          {game.completed && (
                            <Chip
                              label={`${result} ${teamScore}-${oppScore}`}
                              size="small"
                              color={
                                result === "W"
                                  ? "success"
                                  : result === "L"
                                    ? "error"
                                    : "default"
                              }
                              sx={{
                                fontWeight: 700,
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={`${game.date} @ ${game.location}`}
                    />
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      justifyContent: { xs: "flex-end", sm: "initial" },
                    }}
                  >
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
                        onClick={() =>
                          navigate(
                            `/game?gameId=${game.id}&teamId=${game.teamId}`,
                          )
                        }
                      >
                        Edit Game
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                          navigate(
                            `/game?gameId=${game.id}&teamId=${game.teamId}`,
                          )
                        }
                      >
                        Track
                      </Button>
                    )}
                  </Stack>
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
          sx={{
            position: "fixed",
            bottom: "calc(32px + env(safe-area-inset-bottom))",
            right: 32,
          }}
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
          <Autocomplete
            freeSolo
            options={allRecentLocations}
            value={location}
            onInputChange={(_, newValue) => setLocation(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Location"
                fullWidth
                variant="outlined"
              />
            )}
            sx={{ mt: 1 }}
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
