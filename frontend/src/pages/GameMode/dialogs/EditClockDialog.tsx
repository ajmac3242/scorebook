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
      <DialogTitle>Edit Clock</DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Box
          sx={{
            mb: "var(--cs-semantic-spacing-md)",
            display: "flex",
            gap: 1,
            justifyContent: "center",
          }}
        >
          {[8, 10, 12, 20].map((m) => (
            <Button
              key={m}
              variant="outlined"
              size="small"
              onClick={() => {
                setMins(m);
                setSecs(0);
              }}
              sx={{ fontSize: "0.7rem", minWidth: 0, px: 1.5 }}
            >
              {m}:00
            </Button>
          ))}
        </Box>

        <Stack
          direction="row"
          spacing={3}
          sx={{ py: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-text-secondary)",
                mb: 1,
                display: "block",
                textTransform: "uppercase",
              }}
            >
              Minutes
            </Typography>
            <Stack direction="column" spacing={1} sx={{ alignItems: "center" }}>
              <IconButton
                onClick={() => setMins(Math.min(99, mins + 1))}
                size="small"
                aria-label="Increase minutes"
                sx={{ color: "var(--cs-semantic-color-brand-primary-main)" }}
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-primary)",
                  minWidth: "2ch",
                }}
              >
                {mins}
              </Typography>
              <IconButton
                onClick={() => setMins(Math.max(0, mins - 1))}
                size="small"
                aria-label="Decrease minutes"
                sx={{ color: "var(--cs-semantic-color-brand-primary-main)" }}
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
          <Typography
            variant="h4"
            sx={{
              mt: 3,
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              color: "var(--cs-semantic-color-text-secondary)",
            }}
          >
            :
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-text-secondary)",
                mb: 1,
                display: "block",
                textTransform: "uppercase",
              }}
            >
              Seconds
            </Typography>
            <Stack direction="column" spacing={1} sx={{ alignItems: "center" }}>
              <IconButton
                onClick={() => setSecs((secs + 1) % 60)}
                size="small"
                aria-label="Increase seconds"
                sx={{ color: "var(--cs-semantic-color-brand-primary-main)" }}
              >
                <AddIcon />
              </IconButton>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-primary)",
                  minWidth: "2ch",
                }}
              >
                {secs.toString().padStart(2, "0")}
              </Typography>
              <IconButton
                onClick={() => setSecs((secs - 1 + 60) % 60)}
                size="small"
                aria-label="Decrease seconds"
                sx={{ color: "var(--cs-semantic-color-brand-primary-main)" }}
              >
                <RemoveIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
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
