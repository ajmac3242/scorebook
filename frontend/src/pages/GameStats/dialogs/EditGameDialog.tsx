import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

interface EditGameDialogProps {
  open: boolean;
  onClose: () => void;
  editOpponent: string;
  setEditOpponent: (v: string) => void;
  editOpponentLogoUrl: string;
  setEditOpponentLogoUrl: (v: string) => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editTime: string;
  setEditTime: (v: string) => void;
  editLocation: string;
  setEditLocation: (v: string) => void;
  onSave: () => void;
  onDeleteClick: () => void;
}

export const EditGameDialog = ({
  open,
  onClose,
  editOpponent,
  setEditOpponent,
  editOpponentLogoUrl,
  setEditOpponentLogoUrl,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  editLocation,
  setEditLocation,
  onSave,
  onDeleteClick,
}: EditGameDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle
      sx={{
        fontFamily: "var(--cs-typography-fontFamily-display)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      Edit Game Details
      <IconButton color="error" onClick={onDeleteClick} aria-label="Delete game" title="Delete game">
        <Delete />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={"var(--cs-semantic-spacing-md)"} sx={{ mt: "var(--cs-semantic-spacing-xs)" }}>
        <TextField fullWidth label="Opponent" value={editOpponent} onChange={(e) => setEditOpponent(e.target.value)} />
        <TextField fullWidth label="Opponent Logo URL" value={editOpponentLogoUrl} onChange={(e) => setEditOpponentLogoUrl(e.target.value)} />
        <TextField fullWidth label="Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
        <TextField fullWidth label="Time" type="time" slotProps={{ inputLabel: { shrink: true } }} value={editTime} onChange={(e) => setEditTime(e.target.value)} />
        <TextField fullWidth label="Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: "var(--cs-semantic-spacing-lg)", pb: "var(--cs-semantic-spacing-lg)" }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSave} variant="contained" sx={{ ml: "var(--cs-semantic-spacing-xs)" }}>Save</Button>
    </DialogActions>
  </Dialog>
);
