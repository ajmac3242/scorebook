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
  Avatar,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, BarChart, Palette } from "@mui/icons-material";
import { db, type Player } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, Link } from "react-router-dom";

const AVATAR_COLORS = [
  "#4E7D5B", // Sage Green
  "#A64444", // Muted Red
  "#5A7381", // Blue Ash
  "#154C56", // Deep Ocean
  "#D9B382", // Golden Dune
  "#1F2D33", // Midnight
  "#7B68EE", // Medium Slate Blue
  "#FF8C00", // Dark Orange
];

const Players: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

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
      avatarColor,
      synced: 0,
    };
    try {
      await db.open();
      await db.players.add(newPlayer);
      setOpen(false);
      setName("");
      setAvatarColor(AVATAR_COLORS[0]);
    } catch (err) {
      console.error("Failed to add player:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontFamily: "var(--serif)", mb: 4, textAlign: "center" }}
      >
        Roster Notebook
      </Typography>
      <Paper className="moleskine-card" sx={{ p: 2 }}>
        <List>
          {players.length === 0 && (
            <Typography>No players created yet.</Typography>
          )}
          {players.map((player) => (
            <ListItem
              key={player.id}
              divider
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BarChart />}
                  component={Link}
                  to={`/players/${player.id}`}
                >
                  Stats
                </Button>
              }
            >
              <Avatar
                sx={{
                  bgcolor: player.avatarColor || "grey.500",
                  mr: 2,
                  fontFamily: "var(--serif)",
                }}
              >
                {getInitials(player.name)}
              </Avatar>
              <ListItemText primary={player.name} />
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
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Avatar Color
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {AVATAR_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setAvatarColor(color)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: color,
                  cursor: "pointer",
                  border: avatarColor === color ? "3px solid #000" : "none",
                  boxSizing: "border-box",
                }}
              />
            ))}
          </Box>
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
