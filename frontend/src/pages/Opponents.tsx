import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Avatar,
  IconButton,
  Button,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
} from "@mui/material";
import {
  Assessment as ScoutingIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { MoleskineCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { getInitials } from "../utils/stats";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";

const Opponents: React.FC = () => {
  const navigate = useNavigate();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opponentToDelete, setOpponentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const opponentsQueryResult = useLiveQuery(() => db.opponents.toArray(), []);
  const opponents = opponentsQueryResult || [];

  const handleAddOpponent = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await db.opponents.add({
        id: crypto.randomUUID(),
        name: newName,
        logoUrl: newLogoUrl,
        roster: [],
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpenAddDialog(false);
      setNewName("");
      setNewLogoUrl("");
    } catch (err) {
      logger.error("Failed to add opponent", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOpponent = async () => {
    if (!opponentToDelete) return;
    try {
      await db.opponents.delete(opponentToDelete.id);
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
      setOpponentToDelete(null);
    } catch (err) {
      logger.error("Failed to delete opponent", err);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <EntityBanner
        title="Opponent Library"
        subtitle="Historical scouting and personnel tracking"
        avatarColor="var(--palette-midnight)"
        backTo="/"
        stats={[{ label: "TOTAL", value: opponents.length.toString() }]}
        actions={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            Add Opponent
          </Button>
        }
      />

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {opponents.length === 0 ? (
            <Grid item xs={12}>
              <Box
                sx={{
                  py: 8,
                  textAlign: "center",
                  border: "2px dashed #ddd",
                  borderRadius: 2,
                  bgcolor: "rgba(0,0,0,0.02)",
                }}
              >
                <ScoutingIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No opponents tracked yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.disabled"
                  sx={{ mb: 3 }}
                >
                  Opponents are automatically added when you schedule a game.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Your First Opponent
                </Button>
              </Box>
            </Grid>
          ) : (
            opponents.map((opponent) => (
              <Grid item xs={12} sm={6} md={4} key={opponent.id}>
                <MoleskineCard
                  sx={{
                    p: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    },
                  }}
                  onClick={() => navigate(`/opponents/${opponent.id}/scouting`)}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      bgcolor: "rgba(0,0,0,0.02)",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Avatar
                      src={opponent.logoUrl}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "var(--palette-midnight)",
                      }}
                    >
                      {getInitials(opponent.name)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {opponent.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {opponent.roster?.length || 0} players identified
                      </Typography>
                    </Box>
                    <ChevronRightIcon color="action" />
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Delete Opponent">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete Opponent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpponentToDelete({
                            id: opponent.id,
                            name: opponent.name,
                          });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Scouting Report">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="View Scouting Report"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/opponents/${opponent.id}/scouting`);
                        }}
                      >
                        <ScoutingIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MoleskineCard>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Add New Opponent
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Opponent Name"
              fullWidth
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim() && !isSubmitting) {
                  handleAddOpponent();
                }
              }}
              autoFocus
              disabled={isSubmitting}
            />
            <TextField
              label="Logo URL"
              fullWidth
              value={newLogoUrl}
              onChange={(e) => setNewLogoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim() && !isSubmitting) {
                  handleAddOpponent();
                }
              }}
              disabled={isSubmitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenAddDialog(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddOpponent}
            disabled={!newName.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <WarningIcon color="error" /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{opponentToDelete?.name}</strong>? This will permanently
            remove all scouting data and player records for this opponent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteOpponent}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete Opponent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Opponents;
