import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTokens } from "../../../theme/useTokens";

type EndGameDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isEnding: boolean;
};

export const EndGameDialog: React.FC<EndGameDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isEnding,
}) => {
  const tokens = useTokens();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Finalize Game?</DialogTitle>
      <DialogContent sx={{ pb: tokens.semantic.spacing.xs / 8 }}>
        <DialogContentText
          sx={{
            color: tokens.semantic.color.text.secondary,
            fontSize: tokens.typography.fontSize.sm,
          }}
        >
          This will mark the game as complete and lock all stats. You can still
          view them afterward.
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          p: tokens.semantic.spacing.md / 8,
          pt: tokens.semantic.spacing.xs / 8,
        }}
      >
        <Button onClick={onClose} disabled={isEnding} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isEnding}
          aria-busy={isEnding}
          aria-label={
            isEnding
              ? "Finalizing game, please wait"
              : "Finalize game and lock stats"
          }
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            px: tokens.semantic.spacing.md / 8,
          }}
        >
          {isEnding ? "Finalizing..." : "Finalize Game"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
