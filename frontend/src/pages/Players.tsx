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
  Fab,
  Avatar,
} from "@mui/material";
import { Add as AddIcon, BarChart } from "@mui/icons-material";
import { db, type Player } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, Link } from "react-router-dom";
import { getInitials } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

const AVATAR_COLORS = ["#4E7D5B", "#A64444", "#5A7381", "#154C56", "#D9B382", "#1F2D33", "#7B68EE", "#FF8C00"];

const Players: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const players = useLiveQuery(async () => {
    try {
      await db.open();
      return await db.players.toArray();
    } catch (err) {
      console.error("Failed to fetch players:", err);
      return [];
    }
  }) || [];

  const handleAddPlayer = async () => {
    try {
      await db.open();
      await db.players.add({ name, avatarColor, synced: 0 });
      setOpen(false);
      setName("");
      setAvatarColor(AVATAR_COLORS[0]);
    } catch (err) {
      console.error("Failed to add player:", err);
    }
  };

  return (
    <Box>
      <PageHeader title="Roster Notebook" />
      <MoleskineCard sx={{ p: 2 }}>
        <List>
          {players.length === 0 && <Typography>No players created yet.</Typography>}
          {players.map((player) => (
            <ListItem key={player.id} divider secondaryAction={<Button variant="outlined" size="small" startIcon={<BarChart />} component={Link} to={`/players/${player.id}`}>Stats</Button>}>
              <Avatar sx={{ bgcolor: player.avatarColor || "grey.500", mr: 2 }}>{getInitials(player.name)}</Avatar>
              <ListItemText primary={player.name} />
            </ListItem>
          ))}
        </List>
      </MoleskineCard>

      <Fab color="primary" aria-label="add" sx={{ position: "fixed", bottom: 32, right: 32 }} onClick={() => setOpen(true)}><AddIcon /></Fab>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Player</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Player Name" fullWidth variant="outlined" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Avatar Color</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {AVATAR_COLORS.map((color) => (<Box key={color} onClick={() => setAvatarColor(color)} sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: color, cursor: "pointer", border: avatarColor === color ? "3px solid #000" : "none", boxSizing: "border-box" }} />))}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleAddPlayer} variant="contained">Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
