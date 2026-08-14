import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";

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
  const tokens = useTokens();

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          fontFamily: tokens.typography.fontFamily.display,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.bold,
        }}
      >
        {title}
        <Tooltip title="Collapse section">
          <IconButton onClick={onClose} aria-label="Collapse section">
            <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
