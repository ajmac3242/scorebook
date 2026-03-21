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
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, BarChart, Delete, Archive, Restore, History } from "@mui/icons-material";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { Link } from "react-router-dom";
import { getInitials } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import { useLiveQuery } from "dexie-react-hooks";
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
  const [showArchived, setShowArchived] = useState(false);

  // Use live query directly to handle archived/deleted filtering
  const players = useLiveQuery(async () => {
    let query = db.players.toCollection();
    const all = await query.toArray();
    return all.filter(p => {
      if (p.deletedAt) return false;
      if (!showArchived && p.isArchived) return false;
      return true;
    });
  }, [showArchived]) || [];

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
        isArchived: 0,
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

  const handleArchivePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 1, synced: 0 });
      syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to archive player", err, { id });
    }
  };

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this player? They will be moved to pending deletion for 24 hours.")) return;
    try {
      await db.players.update(id, { deletedAt: new Date().toISOString(), synced: 0 });
      syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to delete player", err, { id });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Roster Notebook"
        actions={
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                color="primary"
              />
            }
            label="Show Archived"
          />
        }
      />
      <MoleskineCard sx={{ p: 2 }}>
        <List>
          {players.length === 0 && (
            <Typography sx={{ textAlign: "center", py: 2 }}>
              No {showArchived ? "" : "active"} players found.
            </Typography>
          )}
          {players.map((player) => (
            <ListItem
              key={player.id}
              divider
              secondaryAction={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Stats">
                    <IconButton
                      size="small"
                      component={Link}
                      to={`/players/${player.id}`}
                      sx={{ transition: "transform 0.2s", "&:hover": { transform: "scale(1.1)" } }}
                    >
                      <BarChart />
                    </IconButton>
                  </Tooltip>
                  {player.isArchived ? (
                    <Tooltip title="Restore">
                      <IconButton size="small" color="success" onClick={() => handleRestorePlayer(player.id!)}>
                        <Restore />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Archive">
                      <IconButton size="small" color="warning" onClick={() => handleArchivePlayer(player.id!)}>
                        <Archive />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDeletePlayer(player.id!)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{
                "&:hover": { bgcolor: "rgba(0,0,0,0.01)" },
                opacity: player.isArchived ? 0.6 : 1,
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {player.name}
                    {player.isArchived && <Chip label="Archived" size="small" icon={<History sx={{ fontSize: '12px !important' }} />} />}
                  </Box>
                }
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
            sx={{ mb: 2, mt: 1 }}
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
