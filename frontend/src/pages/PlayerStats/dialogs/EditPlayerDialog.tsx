import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type Player, db } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { AVATAR_COLORS } from "../../../constants/colors";
import AvatarColorPicker from "../../../components/AvatarColorPicker";
import { useTokens } from "../../theme/useTokens";

type EditPlayerDialogProps = {
  open: boolean;
  onClose: () => void;
  player: Player | undefined;
  playerId: string | undefined;
  accentFocus: string;
};

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({
  open,
  onClose,
  player,
  playerId,
}) => {
  const tokens = useTokens();
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && player) {
      setEditName(player.name || "");
      setEditColor(player.avatarColor || AVATAR_COLORS[0]);
    }
  }, [open, player]);

  const handleUpdatePlayer = async () => {
    if (!playerId) return;

    setIsSaving(true);

    try {
      await db.players.update(playerId, {
        name: editName,
        avatarColor: editColor,
        synced: 0,
      });
      await syncService.pushUpdates();
      onClose();
    } catch (err) {
      logger.error("Failed to update player", err, { playerId, editName });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: tokens.semantic.component.pageShell.radius,
        },
      }}
    >
      <DialogTitle>Edit Player Details</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Player Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Avatar Color
            </Typography>

            <AvatarColorPicker
              colors={AVATAR_COLORS}
              selectedColor={editColor}
              onChange={setEditColor}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdatePlayer}
          variant="contained"
          disabled={isSaving}
          sx={{ boxShadow: "none" }}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPlayerDialog;
