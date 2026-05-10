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
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { Player, Team, Game } from "../db";
import { PlayerAggregates } from "../utils/stats";

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
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontFamily: "var(--serif)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Quick Substitution
        {selectedSwapId && (
          <Button
            size="small"
            variant="text"
            onClick={() => handleSwapClick(selectedSwapId)}
            sx={{ fontSize: "0.65rem" }}
            aria-label="Clear current selection"
          >
            Clear Selection
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          To substitute: Tap an on-court player and then a bench player to swap
          their positions.
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
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
                          ? "error.main"
                          : isFoulTrouble
                            ? "warning.main"
                            : "divider",
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline: "2px solid",
                          outlineColor: "primary.main",
                          outlineOffset: "2px",
                        },
                        color: isFouledOut ? "error.main" : "text.primary",
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "error.light"
                              : isFoulTrouble
                                ? "warning.light"
                                : "primary.main"
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
                      <Typography variant="body2" noWrap>
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
                      color: "text.secondary",
                      borderWidth: selectedSwapId === emptyId ? 2 : 1,
                      bgcolor:
                        selectedSwapId === emptyId
                          ? "rgba(0,0,0,0.05)"
                          : "transparent",
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: "2px",
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
          <Grid item xs={6}>
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
                      onClick={() => handleSwapClick(p.id!)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? "error.main"
                          : isFoulTrouble
                            ? "warning.main"
                            : "divider",
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline: "2px solid",
                          outlineColor: "primary.main",
                          outlineOffset: "2px",
                        },
                        color: isFouledOut ? "error.main" : "text.primary",
                        opacity: isFouledOut ? 0.6 : 1,
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "error.light"
                              : isFoulTrouble
                                ? "warning.light"
                                : "primary.main"
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
                      <Typography variant="body2" noWrap>
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
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleQuickSub}
          variant="contained"
          startIcon={<SwapHoriz />}
        >
          Sub In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSubDialog;
