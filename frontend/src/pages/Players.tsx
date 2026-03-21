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
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { Link } from "react-router-dom";
import { getInitials } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import { usePlayers } from "../hooks/usePlayers";
import { logger } from "../utils/logger";
import { AVATAR_COLORS } from "../constants/colors";

/**
 * Players page component.
 * Displays a list of all players and allows adding new player records.
 */
const Players: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showValidation, setShowValidation] = useState(false);

  // Use shared hook for data fetching
  const players = usePlayers();

  /**
   * Handles adding a new player record.
   */
  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setShowValidation(true);
      return;
    }
    try {
      await db.open();
      await db.players.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        avatarColor,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpen(false);
      setName("");
      setAvatarColor(AVATAR_COLORS[0]);
      setShowValidation(false);
    } catch (err) {
      logger.error("Failed to add player", err, { name });
    }
  };

  return (
    <Box>
      <PageHeader title="Roster Notebook" />
      <MoleskineCard sx={{ p: 2 }}>
        <List>
          {players.length === 0 && (
            <Typography sx={{ textAlign: "center", py: 2 }}>
              No players created yet.
            </Typography>
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
                  sx={{
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  Stats
                </Button>
              }
              sx={{
                "&:hover": { bgcolor: "rgba(0,0,0,0.01)" },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: player.avatarColor || "grey.500",
                  mr: 2,
                  transition: "transform 0.3s",
                  "&:hover": { transform: "rotate(10deg) scale(1.1)" },
                }}
              >
                {getInitials(player.name)}
              </Avatar>
              <ListItemText
                primary={player.name}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      </MoleskineCard>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.1) rotate(90deg)" },
        }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setShowValidation(false);
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Add New Player
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            error={showValidation && !name.trim()}
            helperText={
              showValidation && !name.trim() ? "Player name is required" : ""
            }
            required
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
                  transition: "transform 0.1s",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!name}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
