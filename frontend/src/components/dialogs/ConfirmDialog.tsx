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

export interface ConfirmDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Dialog heading */
  title: string;
  /** Body text — describe what will happen */
  description: React.ReactNode;
  /** Label for the destructive/confirm button */
  confirmLabel: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or closes */
  onClose: () => void;
  /** When true, the confirm button is shown as error/destructive */
  destructive?: boolean;
  /** Disable both buttons (e.g. while async action in flight) */
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  destructive = false,
  loading = false,
}) => {
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          fontWeight: tokens.semantic.typography.h6.fontWeight,
          fontSize: tokens.semantic.typography.h6.fontSize,
          fontFamily: tokens.semantic.typography.h6.fontFamily,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirm-dialog-description"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{ p: tokens.semantic.spacing.md / 8, gap: tokens.spacing[1] / 8 }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            borderRadius: tokens.semantic.component.radius.button,
            fontWeight: tokens.semantic.typography.button.fontWeight,
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          color={destructive ? "error" : "primary"}
          sx={{
            textTransform: "none",
            borderRadius: tokens.semantic.component.radius.button,
            fontWeight: tokens.semantic.typography.button.fontWeight,
            boxShadow: "none",
          }}
        >
          {loading ? "Deleting..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
