import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";

/**
 * 🏀 CoachBoard: EditClockDialog
 * Why: Allows precise manual adjustment of the game clock.
 */
export const EditClockDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (_mins: number, _secs: number) => void;
  initialMinutes: number;
  initialSeconds: number;
}> = ({ open, onClose, onSave, initialMinutes, initialSeconds }) => {
  const [mins, setMins] = useState(initialMinutes);
  const [secs, setSecs] = useState(initialSeconds);

  useEffect(() => {
    if (open) {
      setMins(initialMinutes);
      setSecs(initialSeconds);
    }
  }, [open, initialMinutes, initialSeconds]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Edit Clock</DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 3 }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              MINUTES
            </Typography>
            <Stack direction="column" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setMins(Math.min(99, mins + 1))}
                size="small"
                aria-label="Increase minutes"
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, minWidth: "2ch" }}
              >
                {mins}
              </Typography>
              <IconButton
                onClick={() => setMins(Math.max(0, mins - 1))}
                size="small"
                aria-label="Decrease minutes"
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
          <Typography variant="h4" sx={{ mt: 3, fontWeight: 800 }}>
            :
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              SECONDS
            </Typography>
            <Stack direction="column" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setSecs((secs + 1) % 60)}
                size="small"
                aria-label="Increase seconds"
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, minWidth: "2ch" }}
              >
                {secs.toString().padStart(2, "0")}
              </Typography>
              <IconButton
                onClick={() => setSecs((secs - 1 + 60) % 60)}
                size="small"
                aria-label="Decrease seconds"
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => onSave(mins, secs)} variant="contained">
          Save Clock
        </Button>
      </DialogActions>
    </Dialog>
  );
};
