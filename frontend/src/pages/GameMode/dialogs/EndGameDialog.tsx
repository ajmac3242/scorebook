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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="finalize-game-dialog-title"
      aria-describedby="finalize-game-dialog-desc"
    >
      <DialogTitle id="finalize-game-dialog-title">Finalize Game?</DialogTitle>
      <DialogContent
        role="region"
        aria-label="Finalize game confirmation"
        sx={{ pb: tokens.semantic.spacing.xs / 8 }}
      >
        <DialogContentText
          id="finalize-game-dialog-desc"
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
        <Button
          onClick={onClose}
          disabled={isEnding}
          color="inherit"
          sx={{
            minHeight: `${tokens.touch.targetComfortable}px`,
            "&:focus-visible": {
              outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
              outlineOffset: `${tokens.semantic.focus.offset}px`,
            },
          }}
        >
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
            minHeight: `${tokens.touch.targetComfortable}px`,
            "&:focus-visible": {
              outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
              outlineOffset: `${tokens.semantic.focus.offset}px`,
            },
          }}
        >
          {isEnding ? "Finalizing..." : "Finalize Game"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
