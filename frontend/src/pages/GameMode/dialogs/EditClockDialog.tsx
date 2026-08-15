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
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";

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
  const tokens = useTokens();
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
      <DialogTitle
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Edit Clock
      </DialogTitle>
      <DialogContent sx={{ p: tokens.semantic.spacing.dialogPadding / 8 }}>
        <Box
          sx={{
            mb: tokens.semantic.spacing.md / 8,
            display: "flex",
            gap: tokens.semantic.spacing.xs / 8,
            justifyContent: "center",
          }}
        >
          {[8, 10, 12, 20].map((m) => (
            <Tooltip key={m} title={`Set clock to ${m} minutes`}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setMins(m);
                  setSecs(0);
                }}
                aria-label={`Set clock to ${m} minutes`}
                sx={{
                  fontSize: tokens.typography.fontSize.xs,
                  minWidth: 0,
                  px: tokens.semantic.spacing.sm / 8,
                }}
              >
                {m}:00
              </Button>
            </Tooltip>
          ))}
        </Box>

        <Box
          className="sr-only"
          aria-live="polite"
          sx={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            border: 0,
          }}
        >
          {`Clock set to ${mins} minutes and ${secs} seconds`}
        </Box>

        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.md / 8}
          sx={{
            py: tokens.semantic.spacing.xs / 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.secondary,
                mb: tokens.semantic.spacing.xs / 8,
                display: "block",
                textTransform: "uppercase",
              }}
            >
              Minutes
            </Typography>
            <Stack
              direction="column"
              spacing={tokens.semantic.spacing.xs / 8}
              sx={{ alignItems: "center" }}
            >
              <Tooltip title="Increase minutes">
                <IconButton
                  onClick={() => setMins(Math.min(99, mins + 1))}
                  size="small"
                  aria-label="Increase minutes"
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.primary,
                  minWidth: "2ch",
                }}
              >
                {mins}
              </Typography>
              <Tooltip title="Decrease minutes">
                <IconButton
                  onClick={() => setMins(Math.max(0, mins - 1))}
                  size="small"
                  aria-label="Decrease minutes"
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                >
                  <RemoveIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Typography
            variant="h4"
            aria-hidden="true"
            sx={{
              mt: tokens.semantic.spacing.lg / 8,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.secondary,
            }}
          >
            :
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.secondary,
                mb: tokens.semantic.spacing.xs / 8,
                display: "block",
                textTransform: "uppercase",
              }}
            >
              Seconds
            </Typography>
            <Stack
              direction="column"
              spacing={tokens.semantic.spacing.xs / 8}
              sx={{ alignItems: "center" }}
            >
              <Tooltip title="Increase seconds">
                <IconButton
                  onClick={() => setSecs((secs + 1) % 60)}
                  size="small"
                  aria-label="Increase seconds"
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.primary,
                  minWidth: "2ch",
                }}
              >
                {secs.toString().padStart(2, "0")}
              </Typography>
              <Tooltip title="Decrease seconds">
                <IconButton
                  onClick={() => setSecs((secs - 1 + 60) % 60)}
                  size="small"
                  aria-label="Decrease seconds"
                  sx={{ color: tokens.semantic.color.brand.primary.main }}
                >
                  <RemoveIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
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
