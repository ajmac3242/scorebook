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
  Fab,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { db, type Player } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const Players: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [defaultNumber, setDefaultNumber] = useState("");

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

  const handleAddPlayer = async () => {
    const newPlayer: Player = {
      name,
      defaultNumber,
      synced: 0,
    };
    try {
      await db.open();
      await db.players.add(newPlayer);
      setOpen(false);
      setName("");
      setDefaultNumber("");
    } catch (err) {
      console.error("Failed to add player:", err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Players
      </Typography>
      <Paper className="moleskine-card">
        <List>
          {players.length === 0 && (
            <Typography>No players created yet.</Typography>
          )}
          {players.map((player) => (
            <ListItem key={player.id} divider>
              <ListItemText
                primary={player.name}
                secondary={`Default Number: ${player.defaultNumber}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 32, right: 32 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Player</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Default Number"
            type="text"
            fullWidth
            variant="outlined"
            value={defaultNumber}
            onChange={(e) => setDefaultNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPlayer} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
