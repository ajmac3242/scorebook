/**
 * @file QuickSubDialog.tsx
 * @description Dialog for performing quick player substitutions.
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Stack,
  Button,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { Player, Team, Game } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats";

interface QuickSubDialogProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  team: Team | null;
  game: Game | null;
  draftOnCourtIds: Set<string>;
  selectedSwapId: string | null;
  statsMap: Map<string, PlayerAggregates>;
  jerseyMap: Map<string, string>;
  handleSwapClick: (_id: string) => void;
  handleQuickSub: () => void;
  isSaving?: boolean;
}

const QuickSubDialog: React.FC<QuickSubDialogProps> = ({
  open,
  onClose,
  players,
  team,
  game,
  draftOnCourtIds,
  selectedSwapId,
  statsMap,
  jerseyMap,
  handleSwapClick,
  handleQuickSub,
  isSaving = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="quick-sub-title"
      aria-describedby="quick-sub-instructions"
    >
      <DialogTitle
        id="quick-sub-title"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-primary)",
        }}
      >
        Quick Substitution
        {selectedSwapId && (
          <Button
            size="small"
            variant="text"
            onClick={() => handleSwapClick(selectedSwapId)}
            sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
            aria-label="Clear current selection"
          >
            Clear Selection
          </Button>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Typography
          id="quick-sub-instructions"
          variant="caption"
          sx={{
            mb: "var(--cs-semantic-spacing-md)",
            display: "block",
            color: "var(--cs-semantic-color-text-secondary)",
          }}
        >
          To substitute: Tap an on-court player and then a bench player to swap
          their positions.
        </Typography>
        <Grid
          container
          spacing={2}
          sx={{ mt: "var(--cs-semantic-spacing-sm)" }}
        >
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" gutterBottom align="center">
              ON COURT
            </Typography>
            <Stack spacing={1}>
              {players
                .filter((p) => draftOnCourtIds.has(p.id!))
                .map((p) => {
                  const s = statsMap.get(p.id!);
                  const pf = s?.fouls || 0;
                  const foulLimit =
                    game?.foulLimit || team?.defaultFoulLimit || 5;
                  const isFoulTrouble = pf === foulLimit - 1;
                  const isFouledOut = pf >= foulLimit;

                  return (
                    <Button
                      key={p.id}
                      variant={
                        selectedSwapId === p.id ? "contained" : "outlined"
                      }
                      aria-label={`Swap #${jerseyMap.get(p.id!) ?? ""} ${p.name}${isFouledOut ? " (Fouled Out)" : ""}`}
                      aria-pressed={selectedSwapId === p.id}
                      onClick={() => handleSwapClick(p.id!)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : isFoulTrouble
                            ? "var(--cs-semantic-color-feedback-warning-main)"
                            : "var(--cs-semantic-color-border-subtle)",
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline:
                            "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                          outlineOffset: "var(--cs-semantic-focus-offset)",
                        },
                        color: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "var(--cs-semantic-color-text-primary)",
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "var(--cs-semantic-color-feedback-error-light)"
                              : isFoulTrouble
                                ? "var(--cs-semantic-color-feedback-warning-light)"
                                : "var(--cs-semantic-color-brand-primary-main)"
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: p.avatarColor || "grey.500",
                        }}
                      >
                        {jerseyMap.get(p.id!) ?? ""}
                      </Avatar>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          textDecoration: isFouledOut ? "line-through" : "none",
                        }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                        {isFouledOut && " - OUT"}
                      </Typography>
                    </Button>
                  );
                })}
              {Array.from({
                length: Math.max(0, 5 - draftOnCourtIds.size),
              }).map((_, i) => {
                const emptyId = `EMPTY-${i}`;
                return (
                  <Button
                    key={emptyId}
                    variant={
                      selectedSwapId === emptyId ? "contained" : "outlined"
                    }
                    aria-label="Empty lineup slot, click to swap with bench player"
                    onClick={() => handleSwapClick(emptyId)}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      borderStyle: "dashed",
                      color: "var(--cs-semantic-color-text-secondary)",
                      borderWidth: selectedSwapId === emptyId ? 2 : 1,
                      bgcolor:
                        selectedSwapId === emptyId
                          ? "var(--cs-semantic-color-action-hover)"
                          : "transparent",
                      "&:focus-visible": {
                        outline:
                          "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                        outlineOffset: "var(--cs-semantic-focus-offset)",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: "0.75rem",
                        mr: 1,
                        bgcolor: "transparent",
                        border: "1px dashed #bdbdbd",
                        color: "#bdbdbd",
                      }}
                    >
                      ?
                    </Avatar>
                    <Typography variant="body2">Empty</Typography>
                  </Button>
                );
              })}
            </Stack>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" gutterBottom align="center">
              BENCH
            </Typography>
            <Stack spacing={1}>
              {players
                .filter((p) => !draftOnCourtIds.has(p.id!))
                .map((p) => {
                  const s = statsMap.get(p.id!);
                  const pf = s?.fouls || 0;
                  const foulLimit =
                    game?.foulLimit || team?.defaultFoulLimit || 5;
                  const isFoulTrouble = pf === foulLimit - 1;
                  const isFouledOut = pf >= foulLimit;

                  return (
                    <Button
                      key={p.id}
                      variant={
                        selectedSwapId === p.id ? "contained" : "outlined"
                      }
                      aria-label={`Swap #${jerseyMap.get(p.id!) ?? ""} ${p.name}${isFouledOut ? " (Fouled Out)" : ""}`}
                      aria-pressed={selectedSwapId === p.id}
                      onClick={() => !isFouledOut && handleSwapClick(p.id!)}
                      fullWidth
                      disabled={isFouledOut}
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : isFoulTrouble
                            ? "var(--cs-semantic-color-feedback-warning-main)"
                            : "var(--cs-semantic-color-border-subtle)",
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline:
                            "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                          outlineOffset: "var(--cs-semantic-focus-offset)",
                        },
                        color: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "var(--cs-semantic-color-text-primary)",
                        opacity: isFouledOut ? 0.6 : 1,
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "var(--cs-semantic-color-feedback-error-light)"
                              : isFoulTrouble
                                ? "var(--cs-semantic-color-feedback-warning-light)"
                                : "var(--cs-semantic-color-brand-primary-main)"
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor: p.avatarColor || "grey.500",
                        }}
                      >
                        {jerseyMap.get(p.id!) ?? ""}
                      </Avatar>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          textDecoration: isFouledOut ? "line-through" : "none",
                        }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                        {isFouledOut && " - OUT"}
                      </Typography>
                    </Button>
                  );
                })}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleQuickSub}
          variant="contained"
          disabled={isSaving || draftOnCourtIds.size !== 5}
          startIcon={isSaving ? <CircularProgress size={20} /> : <SwapHoriz />}
        >
          {isSaving ? "Saving..." : "Sub In"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSubDialog;
