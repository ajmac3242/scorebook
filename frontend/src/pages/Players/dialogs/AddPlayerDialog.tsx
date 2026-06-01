import React, { useState } from "react";
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
import { db } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { AVATAR_COLORS } from "../../../constants/colors";
import AvatarColorPicker from "../../../components/AvatarColorPicker";
import { useTokens } from "../../theme/useTokens";

type AddPlayerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (_message: string) => void;
  onError: (_message: string) => void;
};

const AddPlayerDialog: React.FC<AddPlayerDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const tokens = useTokens();
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setAvatarColor(AVATAR_COLORS[0]);
    setShowValidation(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setShowValidation(false);
  };

  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await db.players.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        avatarColor,
        isArchived: 0,
        synced: 0,
      });

      await syncService.pushUpdates();

      onSuccess("Player added successfully!");
      resetForm();
      onClose();
    } catch (err) {
      logger.error("Failed to add player", err, { name });
      onError("Failed to add player");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: tokens.semantic.component.pageShell.radius,
        },
      }}
    >
      <DialogTitle>Add Player</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Player Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={showValidation && !name.trim()}
            helperText={
              showValidation && !name.trim() ? "Player name is required" : " "
            }
            fullWidth
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPlayer();
              }
            }}
          />

          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "text.primary", mb: 1.25 }}
            >
              Avatar color
            </Typography>

            <AvatarColorPicker
              colors={AVATAR_COLORS}
              selectedColor={avatarColor}
              onChange={setAvatarColor}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleAddPlayer}
          variant="contained"
          disabled={isSubmitting}
          sx={{ boxShadow: "none" }}
        >
          {isSubmitting ? "Adding..." : "Add player"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPlayerDialog;
