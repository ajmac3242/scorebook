import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useTokens } from "../../theme/useTokens";

type DeleteTeamDialogProps = {
  open: boolean;
  teamName: string | undefined;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tokens: ReturnType<typeof useTokens>;
};

const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  open,
  teamName,
  onClose,
  onConfirm,
  tokens,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete team?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{teamName}</strong>? This will
          mark the team and all associated games as pending deletion. You will
          have 24 hours to restore it.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={{ borderRadius: `${tokens.semantic.component.radius.button}px` }}
        >
          Yes, delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTeamDialog;
