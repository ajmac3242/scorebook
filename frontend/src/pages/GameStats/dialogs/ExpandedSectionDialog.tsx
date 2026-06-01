import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";

interface ExpandedSectionDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ExpandedSectionDialog: React.FC<ExpandedSectionDialogProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          fontFamily: "var(--cs-typography-fontFamily-display)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--cs-typography-fontSize-lg)",
        }}
      >
        {title}
        <IconButton onClick={onClose} aria-label="Collapse section">
          <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
