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
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  BarChart,
  Delete,
  Archive,
  Restore,
  History,
  Edit as EditIcon,
} from "@mui/icons-material";
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
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showValidation, setShowValidation] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hasAssociations, setHasAssociations] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use live query directly to handle archived/deleted filtering
  const players =
    useLiveQuery(async () => {
      let query = db.players.toCollection();
      const all = await query.toArray();
      return all.filter((p) => {
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

  const handleOpenEdit = async (player: any) => {
    setSelectedPlayer(player);
    setName(player.name);
    setAvatarColor(player.avatarColor || AVATAR_COLORS[0]);

    // Check for associations
    const statsCount = await db.stats
      .where("playerId")
      .equals(player.id)
      .count();
    const teamCount = await db.teamPlayers
      .where("playerId")
      .equals(player.id)
      .count();
    setHasAssociations(statsCount > 0 || teamCount > 0);

    setEditOpen(true);
  };

  const handleUpdatePlayer = async () => {
    if (!name.trim() || !selectedPlayer) {
      setShowValidation(true);
      return;
    }
    try {
      await db.players.update(selectedPlayer.id, {
        name: name.trim(),
        avatarColor,
        synced: 0,
      });
      syncService.pushUpdates();
      setEditOpen(false);
      setSelectedPlayer(null);
      setName("");
      setShowValidation(false);
    } catch (err) {
      logger.error("Failed to update player", err);
    }
  };

  const handleArchivePlayer = async () => {
    if (!selectedPlayer) return;
    try {
      await db.players.update(selectedPlayer.id, { isArchived: 1, synced: 0 });
      syncService.pushUpdates();
      setEditOpen(false);
    } catch (err) {
      logger.error("Failed to archive player", err, { id: selectedPlayer.id });
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

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;
    try {
      await db.players.delete(selectedPlayer.id);
      syncService.pushUpdates();
      setDeleteDialogOpen(false);
      setEditOpen(false);
    } catch (err) {
      logger.error("Failed to delete player", err, { id: selectedPlayer.id });
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
              sx={{
                "&:hover": { bgcolor: "rgba(0,0,0,0.01)" },
                opacity: player.isArchived ? 0.6 : 1,
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
                  mb: { xs: 1, sm: 0 },
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {player.name}
                      {Boolean(player.isArchived) && (
                        <Chip
                          label="Archived"
                          size="small"
                          icon={
                            <History sx={{ fontSize: "12px !important" }} />
                          }
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: { xs: "flex-end", sm: "initial" },
                }}
              >
                <Tooltip title="Stats">
                  <IconButton
                    size="small"
                    component={Link}
                    to={`/players/${player.id}`}
                    sx={{
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  >
                    <BarChart />
                  </IconButton>
                </Tooltip>
                {player.isArchived ? (
                  <Tooltip title="Restore">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleRestorePlayer(player.id!)}
                    >
                      <Restore />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEdit(player)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!name}
          >
            Add Player
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setShowValidation(false);
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Edit Player Details
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
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Box>
            {hasAssociations ? (
              <Button
                color="warning"
                variant="outlined"
                startIcon={<Archive />}
                onClick={handleArchivePlayer}
              >
                Archive
              </Button>
            ) : (
              <Button
                color="error"
                variant="outlined"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdatePlayer}
              variant="contained"
              sx={{ ml: 1 }}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Delete Player?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete{" "}
            <strong>{selectedPlayer?.name}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeletePlayer}
            color="error"
            variant="contained"
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
