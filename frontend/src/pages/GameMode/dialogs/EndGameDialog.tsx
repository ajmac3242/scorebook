import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Finalize Game?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will mark the game as complete and lock all stats. You can still
          view them afterward.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isEnding}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isEnding}
        >
          {isEnding ? "Finalizing..." : "Finalize Game"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
