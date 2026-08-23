/**
 * @file QuickEditRosterDialog.tsx
 * @description Dialog for quick-editing player names, jersey numbers, and adding late players during live play.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Alert,
  Box,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Delete, PersonAdd } from "@mui/icons-material";
import { db, Player, TeamPlayer } from "../../../db";
import { useTokens } from "../../../theme/useTokens";

interface EditablePlayer {
  id: string; // playerId or temp id for newly added
  isNew?: boolean;
  name: string;
  jerseyNumber: string;
  originalName: string;
  originalJerseyNumber: string;
  teamPlayerRecordId?: string; // id in db.teamPlayers
}

interface QuickEditRosterDialogProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  players: Player[];
  teamPlayers: TeamPlayer[];
  onSaveSuccess?: () => void;
}

export const isValidJerseyNumber = (jersey: string): boolean => {
  const trimmed = jersey.trim();
  if (trimmed === "00") return true;
  if (/^\d{1,2}$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    return num >= 0 && num <= 99;
  }
  return false;
};

export const QuickEditRosterDialog: React.FC<QuickEditRosterDialogProps> = ({
  open,
  onClose,
  teamId,
  players,
  teamPlayers,
  onSaveSuccess,
}) => {
  const tokens = useTokens();
  const [editablePlayers, setEditablePlayers] = useState<EditablePlayer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      const playerMap = new Map<string, Player>();
      players.forEach((p) => {
        if (p.id) playerMap.set(p.id.toString(), p);
      });

      const initial: EditablePlayer[] = teamPlayers.map((tp) => {
        const p = playerMap.get(tp.playerId.toString());
        return {
          id: tp.playerId.toString(),
          teamPlayerRecordId: tp.id,
          name: p?.name || tp.name || "",
          jerseyNumber: tp.jerseyNumber || "",
          originalName: p?.name || tp.name || "",
          originalJerseyNumber: tp.jerseyNumber || "",
        };
      });

      setEditablePlayers(initial);
    }
  }, [open, players, teamPlayers]);

  const handlePlayerChange = (
    id: string,
    field: "name" | "jerseyNumber",
    value: string,
  ) => {
    setErrorMessage(null);
    setEditablePlayers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddPlayerRow = () => {
    setErrorMessage(null);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setEditablePlayers((prev) => [
      ...prev,
      {
        id: tempId,
        isNew: true,
        name: "",
        jerseyNumber: "",
        originalName: "",
        originalJerseyNumber: "",
      },
    ]);
  };

  const handleRemoveNewPlayerRow = (id: string) => {
    setErrorMessage(null);
    setEditablePlayers((prev) => prev.filter((item) => item.id !== id));
  };

  const validateRoster = (): string | null => {
    const namesSeen = new Set<string>();
    const jerseysSeen = new Set<string>();

    for (let i = 0; i < editablePlayers.length; i++) {
      const p = editablePlayers[i];
      const trimmedName = p.name.trim();
      const trimmedJersey = p.jerseyNumber.trim();

      if (!trimmedName) {
        return `Player #${i + 1} is missing a name.`;
      }
      if (!trimmedJersey) {
        return `Player "${trimmedName}" is missing a jersey number.`;
      }

      if (!isValidJerseyNumber(trimmedJersey)) {
        return `Jersey number "${trimmedJersey}" for "${trimmedName}" is invalid. Jersey must be 00 or between 0 and 99.`;
      }

      const lowerName = trimmedName.toLowerCase();
      if (namesSeen.has(lowerName)) {
        return `Duplicate player name "${trimmedName}" detected on the roster.`;
      }
      namesSeen.add(lowerName);

      if (jerseysSeen.has(trimmedJersey)) {
        return `Duplicate jersey number "${trimmedJersey}" detected on the roster.`;
      }
      jerseysSeen.add(trimmedJersey);
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateRoster();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      for (const item of editablePlayers) {
        const trimmedName = item.name.trim();
        const trimmedJersey = item.jerseyNumber.trim();

        if (item.isNew) {
          // 1. Create new Player in IndexedDB
          const newPlayerId = await db.players.add({
            name: trimmedName,
            synced: 0,
          });

          // 2. Link player to team in db.teamPlayers
          await db.teamPlayers.add({
            teamId: teamId.toString(),
            playerId: newPlayerId.toString(),
            name: trimmedName,
            jerseyNumber: trimmedJersey,
            synced: 0,
          });
        } else {
          // Update existing player if modified
          if (
            trimmedName !== item.originalName ||
            trimmedJersey !== item.originalJerseyNumber
          ) {
            // Update player name in db.players
            await db.players.update(item.id, {
              name: trimmedName,
              synced: 0,
            });

            // Update db.teamPlayers
            if (item.teamPlayerRecordId) {
              await db.teamPlayers.update(item.teamPlayerRecordId, {
                name: trimmedName,
                jerseyNumber: trimmedJersey,
                synced: 0,
              });
            } else {
              // Fallback query matching teamId + playerId
              const existingTp = await db.teamPlayers
                .where({ teamId: teamId.toString(), playerId: item.id })
                .first();

              if (existingTp?.id) {
                await db.teamPlayers.update(existingTp.id, {
                  name: trimmedName,
                  jerseyNumber: trimmedJersey,
                  synced: 0,
                });
              }
            }
          }
        }
      }

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch {
      setErrorMessage(
        "An error occurred while saving roster updates. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="quick-edit-roster-title"
      aria-describedby="quick-edit-roster-desc"
    >
      <DialogTitle
        id="quick-edit-roster-title"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Quick Edit Roster
      </DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.lg}px` }}>
        <Typography
          id="quick-edit-roster-desc"
          variant="body2"
          sx={{
            color: tokens.semantic.color.text.secondary,
            mb: `${tokens.semantic.spacing.md}px`,
          }}
        >
          Update player names and jersey numbers during play, or add
          late-arriving players to the active roster.
        </Typography>

        {errorMessage && (
          <Alert
            severity="error"
            sx={{ mb: `${tokens.semantic.spacing.md}px` }}
            onClose={() => setErrorMessage(null)}
            aria-live="assertive"
          >
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2}>
          {editablePlayers.map((player, index) => (
            <Box
              key={player.id}
              sx={{
                display: "flex",
                gap: `${tokens.semantic.spacing.sm / 8}rem`,
                alignItems: "center",
              }}
            >
              <TextField
                label="Jersey #"
                size="small"
                value={player.jerseyNumber}
                onChange={(e) =>
                  handlePlayerChange(player.id, "jerseyNumber", e.target.value)
                }
                slotProps={{
                  htmlInput: {
                    "aria-label": `Jersey number for player ${index + 1}`,
                    maxLength: 3,
                  },
                }}
                sx={{ width: "90px" }}
              />
              <TextField
                label="Player Name"
                size="small"
                fullWidth
                value={player.name}
                onChange={(e) =>
                  handlePlayerChange(player.id, "name", e.target.value)
                }
                slotProps={{
                  htmlInput: {
                    "aria-label": `Player name for player ${index + 1}`,
                  },
                }}
              />
              {player.isNew ? (
                <Tooltip title="Remove row">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveNewPlayerRow(player.id)}
                    aria-label={`Remove new player ${index + 1}`}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              ) : (
                <Box sx={{ width: 34 }} />
              )}
            </Box>
          ))}

          <Button
            startIcon={<PersonAdd />}
            onClick={handleAddPlayerRow}
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start", mt: 1 }}
          >
            Add Late Player
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: `${tokens.semantic.spacing.md}px` }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={18} /> : null}
        >
          {isSaving ? "Saving..." : "Save Roster"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
