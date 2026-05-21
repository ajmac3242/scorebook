/**
 * @file FreeThrowWorkflowDialog.tsx
 * @description Dialog for rapid recording of free throw sequences.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Avatar,
} from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import { db, type Player } from "../db";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";

interface FreeThrowWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  playerId: string;
  player?: Player;
  jerseyNumber?: string;
  period: number;
  clockTime: number;
}

const FreeThrowWorkflowDialog: React.FC<FreeThrowWorkflowDialogProps> = ({
  open,
  onClose,
  gameId,
  playerId,
  player,
  jerseyNumber,
  period,
  clockTime,
}) => {
  const [attempts, setAttempts] = useState<number>(2);
  const [results, setResults] = useState<("MAKE" | "MISS" | null)[]>([
    null,
    null,
  ]);

  useEffect(() => {
    if (open) {
      setResults(new Array(attempts).fill(null));
    }
  }, [open, attempts]);

  const handleRecordResult = (index: number, type: "MAKE" | "MISS") => {
    const newResults = [...results];
    newResults[index] = type;
    setResults(newResults);
  };

  const handleSave = async () => {
    if (!gameId || !playerId) return;

    try {
      await db.open();
      const timestamp = new Date().toISOString();

      for (let i = 0; i < results.length; i++) {
        const type = results[i];
        if (!type) continue;

        await db.stats.add({
          id: crypto.randomUUID(),
          gameId,
          playerId,
          type,
          points: type === "MAKE" ? 1 : 0,
          period,
          clockTime,
          timestamp,
          synced: 0,
        });
      }

      await syncService.pushUpdates();
      onClose();
    } catch (err) {
      logger.error("Failed to record free throw sequence:", err);
    }
  };

  const isComplete = results.every((r) => r !== null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="ft-sequence-title"
    >
      <DialogTitle id="ft-sequence-title">Free Throw Sequence</DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Box
          sx={{
            mb: "var(--cs-semantic-spacing-lg)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor:
                player?.avatarColor || "var(--cs-semantic-color-surface-strong)",
              color: "var(--cs-semantic-color-text-inverse)",
              fontWeight: 700,
            }}
          >
            {jerseyNumber ?? "??"}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-text-primary)",
              }}
            >
              {player?.name || "Select Player"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "var(--cs-semantic-color-text-secondary)" }}
            >
              Recording free throws for the current player.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mb: 1,
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              color: "var(--cs-semantic-color-text-secondary)",
              textTransform: "uppercase",
            }}
          >
            Number of Attempts
          </Typography>
          <Stack direction="row" spacing={1}>
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                fullWidth
                variant={attempts === n ? "contained" : "outlined"}
                onClick={() => setAttempts(n)}
              >
                {n} Shot{n > 1 ? "s" : ""}
              </Button>
            ))}
          </Stack>
        </Box>

        <Stack spacing={2}>
          {results.map((res, idx) => (
            <Box
              key={idx}
              sx={{
                p: "var(--cs-semantic-spacing-md)",
                border: "1px solid var(--cs-semantic-color-border-subtle)",
                borderRadius: "var(--cs-semantic-shape-radius-md)",
                bgcolor: "var(--cs-semantic-color-surface-subtle)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-primary)",
                }}
              >
                Attempt #{idx + 1}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant={res === "MAKE" ? "contained" : "outlined"}
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => handleRecordResult(idx, "MAKE")}
                >
                  Make
                </Button>
                <Button
                  fullWidth
                  variant={res === "MISS" ? "contained" : "outlined"}
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => handleRecordResult(idx, "MISS")}
                >
                  Miss
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isComplete || !playerId}
        >
          Save Sequence
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FreeThrowWorkflowDialog;
