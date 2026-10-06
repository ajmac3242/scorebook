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
  Tooltip,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { type GameActions } from "../hooks/useGameActions";
import { useTokens } from "../../../theme/useTokens";

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
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="edit-game-dialog-title"
    >
      <DialogTitle
        id="edit-game-dialog-title"
        sx={{
          fontFamily: tokens.typography.fontFamily.display,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.bold,
        }}
      >
        Edit Game Details
        <Tooltip title="Delete game">
          <IconButton
            color="error"
            onClick={() => {
              onClose();
              actions.setIsDeleteDialogOpen(true);
            }}
            aria-label="Delete game"
            sx={{
              minWidth: `${tokens.touch.targetComfortable}px`,
              minHeight: `${tokens.touch.targetComfortable}px`,
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={tokens.semantic.spacing.md / 8} sx={{ mt: tokens.semantic.spacing.xs / 8 }}>
          <TextField
            fullWidth
            id="edit-game-opponent"
            label="Opponent"
            value={actions.editOpponent}
            onChange={(e) => actions.setEditOpponent(e.target.value)}
          />
          <TextField
            fullWidth
            id="edit-game-opponent-logo"
            label="Opponent Logo URL"
            value={actions.editOpponentLogoUrl}
            onChange={(e) => actions.setEditOpponentLogoUrl(e.target.value)}
          />
          <TextField
            fullWidth
            id="edit-game-date"
            label="Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={actions.editDate}
            onChange={(e) => actions.setEditDate(e.target.value)}
          />
          <TextField
            fullWidth
            id="edit-game-time"
            label="Time"
            type="time"
            slotProps={{ inputLabel: { shrink: true } }}
            value={actions.editTime}
            onChange={(e) => actions.setEditTime(e.target.value)}
          />
          <TextField
            fullWidth
            id="edit-game-location"
            label="Location"
            value={actions.editLocation}
            onChange={(e) => actions.setEditLocation(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          p: `${tokens.semantic.spacing.md}px`,
          gap: `${tokens.semantic.spacing.xs}px`,
        }}
      >
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={actions.handleUpdateGame} variant="contained">
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
