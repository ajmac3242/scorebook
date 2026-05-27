import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface DeleteGameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteGameDialog = ({
  open,
  onClose,
  onConfirm,
}: DeleteGameDialogProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}>
      Delete Game?
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this game? You will have 24 hours to
        restore it.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Yes, Delete
      </Button>
    </DialogActions>
  </Dialog>
);
