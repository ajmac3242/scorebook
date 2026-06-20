import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { db } from "../../db";
import { logger } from "../../utils/logger";
import { syncService } from "../../utils/syncService";
import { useTokens } from "../../theme/useTokens";

interface AddOpponentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful add with the new opponent's name */
  onAdded: (_name: string) => void;
  /** Optional callback for handling errors */
  onError?: (_message: string) => void;
}

const AddOpponentDialog: React.FC<AddOpponentDialogProps> = ({
  open,
  onClose,
  onAdded,
  onError,
}) => {
  const tokens = useTokens();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setName("");
    setLogoUrl("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await db.opponents.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        roster: [],
        synced: 0,
      });
      await syncService.pushUpdates();
      const addedName = name.trim();
      setName("");
      setLogoUrl("");
      onAdded(addedName);
    } catch (err) {
      logger.error("Failed to add opponent", err);
      onError?.("Failed to add opponent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim() && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="add-opponent-title"
    >
      <DialogTitle
        id="add-opponent-title"
        sx={{
          fontWeight: tokens.semantic.typography.h6.fontWeight,
          fontSize: tokens.semantic.typography.h6.fontSize,
          fontFamily: tokens.semantic.typography.h6.fontFamily,
        }}
      >
        Add New Opponent
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
          <TextField
            label="Opponent Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isSubmitting}
            slotProps={{ input: { "aria-label": "Opponent Name" } }}
          />
          <TextField
            label="Logo URL"
            fullWidth
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            slotProps={{ input: { "aria-label": "Logo URL" } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            textTransform: "none",
            borderRadius: tokens.semantic.component.radius.button,
            fontWeight: tokens.semantic.typography.button.fontWeight,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          sx={{
            textTransform: "none",
            borderRadius: tokens.semantic.component.radius.button,
            fontWeight: tokens.semantic.typography.button.fontWeight,
            boxShadow: "none",
          }}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOpponentDialog;
