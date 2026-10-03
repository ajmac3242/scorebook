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
  const targetComfortable = tokens?.touch?.targetComfortable ?? 44;
  const dialogPadding = tokens?.semantic?.spacing?.dialogPadding ?? 24;

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
          color: tokens.semantic.color.text.primary,
        }}
      >
        {title}
        <Tooltip title="Collapse section">
          <IconButton
            onClick={onClose}
            aria-label="Collapse section"
            sx={{
              minWidth: `${targetComfortable}px`,
              minHeight: `${targetComfortable}px`,
            }}
          >
            <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent
        role="region"
        aria-label={`${title} expanded view`}
        sx={{ p: `${dialogPadding}px` }}
      >
        {children}
      </DialogContent>
      <DialogActions
        sx={{
          px: `${dialogPadding}px`,
          pb: `${dialogPadding}px`,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            minHeight: `${targetComfortable}px`,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
