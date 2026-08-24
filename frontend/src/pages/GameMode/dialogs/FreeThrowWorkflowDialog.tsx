/**
 * @file FreeThrowWorkflowDialog.tsx
 * @description Dialog for rapid recording of free throw sequences.
 */

import React, { useState, useEffect, useRef } from "react";
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
import { db, type Player } from "../../../db";
import { logger } from "../../../utils/logger";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { syncService } from "../../../utils/syncService";
import { useTokens } from "../../../theme/useTokens";

interface FreeThrowWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  playerId: string;
  player?: Player;
  jerseyNumber?: string;
  period: number;
  clockTime: number;
  onCourtPlayers?: Player[];
  jerseyMap?: Map<string, string | undefined>;
  onPlayerSelect?: (_playerId: string) => void;
  initialAttempts?: number | "1-and-1";
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
  onCourtPlayers,
  jerseyMap,
  onPlayerSelect,
  initialAttempts,
}) => {
  const tokens = useTokens();
  const [attempts, setAttempts] = useState<number | "1-and-1">(
    initialAttempts ?? 2,
  );
  const [results, setResults] = useState<("MAKE" | "MISS" | null)[]>(() => {
    const count =
      initialAttempts === "1-and-1"
        ? 2
        : typeof initialAttempts === "number"
          ? initialAttempts
          : 2;
    return new Array<"MAKE" | "MISS" | null>(count).fill(null);
  });

  const prevOpenRef = useRef(false);
  const prevInitialAttemptsRef = useRef(initialAttempts);

  useEffect(() => {
    if (
      open &&
      (!prevOpenRef.current ||
        prevInitialAttemptsRef.current !== initialAttempts)
    ) {
      const targetAttempts = initialAttempts ?? 2;
      setAttempts(targetAttempts);
      const count = targetAttempts === "1-and-1" ? 2 : targetAttempts;
      setResults(new Array(count).fill(null));
    }
    prevOpenRef.current = open;
    prevInitialAttemptsRef.current = initialAttempts;
  }, [open, initialAttempts]);

  const handleRecordResult = (index: number, type: "MAKE" | "MISS") => {
    const newResults = [...results];
    newResults[index] = type;
    if (attempts === "1-and-1" && index === 0 && type === "MISS") {
      newResults[1] = null;
    }
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

  const isComplete =
    attempts === "1-and-1"
      ? results[0] === "MISS" || (results[0] === "MAKE" && results[1] !== null)
      : results.every((r) => r !== null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="ft-sequence-title"
    >
      <DialogTitle id="ft-sequence-title">Free Throw Sequence</DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}>
        {(!playerId || playerId === "") && (
          <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                mb: tokens.semantic.spacing.xs / 8,
                display: "block",
              }}
            >
              SELECT SHOOTER
            </Typography>
            <Stack
              direction="row"
              spacing={tokens.semantic.spacing.xs / 8}
              sx={{ flexWrap: "wrap", gap: tokens.semantic.spacing.xs / 8 }}
            >
              {onCourtPlayers?.map((p) => {
                const num = jerseyMap?.get(p.id!) ?? "??";
                return (
                  <Button
                    key={p.id}
                    variant="outlined"
                    onClick={() => onPlayerSelect?.(p.id!)}
                    sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    aria-label={`Select shooter #${num} ${p.name}`}
                  >
                    #{num}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        )}

        {playerId && (
          <Box
            sx={{
              mb: `${tokens.semantic.spacing.lg}px`,
              display: "flex",
              alignItems: "center",
              gap: tokens.semantic.spacing.md / 8,
            }}
          >
            <Avatar
              sx={{
                bgcolor: playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
                  ? tokens.semantic.color.brand.secondary.main
                  : player?.avatarColor || tokens.semantic.color.surface.strong,
                color: tokens.semantic.color.text.inverse,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              {playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
                ? "OP"
                : (jerseyMap?.get(playerId) ?? jerseyNumber ?? "?")}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.primary,
                }}
              >
                {playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
                  ? "Opponent Player"
                  : onCourtPlayers?.find((p) => p.id === playerId)?.name ||
                    player?.name ||
                    "Shooter Selected"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                Recording free throws for the current player.
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ mb: `${tokens.semantic.spacing.lg}px` }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mb: tokens.semantic.spacing.xs / 8,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.secondary,
              textTransform: "uppercase",
            }}
          >
            Number of Attempts
          </Typography>
          <Stack direction="row" spacing={tokens.semantic.spacing.xs / 8}>
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                fullWidth
                variant={attempts === n ? "contained" : "outlined"}
                onClick={() => {
                  setAttempts(n);
                  setResults(new Array(n).fill(null));
                }}
              >
                {n} Shot{n > 1 ? "s" : ""}
              </Button>
            ))}
            <Button
              fullWidth
              variant={attempts === "1-and-1" ? "contained" : "outlined"}
              onClick={() => {
                setAttempts("1-and-1");
                setResults(new Array(2).fill(null));
              }}
            >
              1-and-1
            </Button>
          </Stack>
        </Box>

        <Stack spacing={tokens.semantic.spacing.md / 8}>
          {results.map((res, idx) => {
            if (attempts === "1-and-1" && idx === 1 && results[0] !== "MAKE") {
              return null;
            }
            return (
              <Box
                key={idx}
                sx={{
                  p: `${tokens.semantic.spacing.md}px`,
                  border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  borderRadius: `${tokens.semantic.shape.radius.md}px`,
                  bgcolor: tokens.semantic.color.surface.subtle,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: tokens.semantic.spacing.xs / 8,
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.semantic.color.text.primary,
                  }}
                >
                  Attempt #{idx + 1}
                </Typography>
                <Stack direction="row" spacing={tokens.semantic.spacing.md / 8}>
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
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: `${tokens.semantic.spacing.md}px` }}>
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
