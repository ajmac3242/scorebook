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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        Free Throw Sequence
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: player?.avatarColor }}>
            {jerseyNumber ?? "??"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {player?.name || "Select Player"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recording free throws for the current player.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            gutterBottom
            sx={{ display: "block", mb: 1, fontWeight: 600 }}
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
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
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
      <DialogActions sx={{ p: 2 }}>
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
