import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { type GameActions } from "../hooks/useGameActions";

interface EditGameDialogProps {
  open: boolean;
  onClose: () => void;
  actions: GameActions;
}

export const EditGameDialog: React.FC<EditGameDialogProps> = ({
  open,
  onClose,
  actions,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          fontFamily: "var(--cs-typography-fontFamily-display)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--cs-typography-fontSize-lg)",
        }}
      >
        Edit Game Details
        <IconButton
          color="error"
          onClick={() => {
            onClose();
            actions.setIsDeleteDialogOpen(true);
          }}
          aria-label="Delete game"
          title="Delete game"
        >
          <Delete />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack
          spacing="var(--cs-semantic-spacing-md)"
          sx={{ mt: "var(--cs-semantic-spacing-xs)" }}
        >
          <TextField
            fullWidth
            label="Opponent"
            value={actions.editOpponent}
            onChange={(e) => actions.setEditOpponent(e.target.value)}
          />
          <TextField
            fullWidth
            label="Opponent Logo URL"
            value={actions.editOpponentLogoUrl}
            onChange={(e) => actions.setEditOpponentLogoUrl(e.target.value)}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={actions.editDate}
            onChange={(e) => actions.setEditDate(e.target.value)}
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            slotProps={{ inputLabel: { shrink: true } }}
            value={actions.editTime}
            onChange={(e) => actions.setEditTime(e.target.value)}
          />
          <TextField
            fullWidth
            label="Location"
            value={actions.editLocation}
            onChange={(e) => actions.setEditLocation(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: "var(--cs-semantic-spacing-lg)",
          pb: "var(--cs-semantic-spacing-lg)",
        }}
      >
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={actions.handleUpdateGame}
          variant="contained"
          sx={{ ml: "var(--cs-semantic-spacing-xs)" }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
