import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${tokens.semantic.shape.radius.lg}px`,
          },
        },
      }}
    >
      <DialogTitle
        id="add-opponent-title"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          textAlign: "center",
        }}
      >
        Add New Opponent
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={tokens.semantic.spacing.md / 4}
          sx={{
            mt: tokens.spacing[2] / 4, // 4px
            minWidth: {
              xs: "auto",
              sm: `${tokens.spacing[32] * 2 + tokens.spacing[10] + tokens.spacing[1]}px`, // ~300px
            },
          }}
        >
          <TextField
            label="Opponent Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isSubmitting}
            slotProps={{ htmlInput: { "aria-label": "Opponent Name" } }}
          />
          <TextField
            label="Logo URL"
            fullWidth
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="https://..."
            slotProps={{ htmlInput: { "aria-label": "Logo URL" } }}
            helperText="Optional. URL to team logo image."
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: tokens.semantic.spacing.md / 4,
          gap: tokens.semantic.spacing.xs / 4,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          color="inherit"
          sx={{
            textTransform: "none",
            borderRadius: `${tokens.semantic.component.radius.button}px`,
          }}
        >
          Cancel
        </Button>
        <Tooltip title={!name.trim() ? "Name is required" : "Create opponent profile"}>
          <span>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              sx={{
                textTransform: "none",
                borderRadius: `${tokens.semantic.component.radius.button}px`,
                boxShadow: "none",
              }}
            >
              {isSubmitting ? "Adding..." : "Add Opponent"}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default AddOpponentDialog;
