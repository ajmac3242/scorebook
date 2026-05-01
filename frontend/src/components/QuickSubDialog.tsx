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
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        Quick Substitution
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

                  const isSelected = selectedSwapId === p.id;
                  const pts = s?.points || 0;
                  const label = `#${jerseyMap.get(p.id!) ?? ""} ${p.name} (On Court), ${pts} pts, ${pf} fouls${isSelected ? " - Selected for swap" : ""}`;

                  return (
                    <Button
                      key={p.id}
                      variant={isSelected ? "contained" : "outlined"}
                      aria-pressed={isSelected}
                      aria-label={label}
                      onClick={() => handleSwapClick(p.id!)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? "error.main"
                          : isFoulTrouble
                            ? "warning.main"
                            : "divider",
                        color:
                          selectedSwapId === p.id
                            ? "white"
                            : isFouledOut
                              ? "error.main"
                              : "text.primary",
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "error.dark"
                              : isFoulTrouble
                                ? "warning.dark"
                                : "primary.main"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedSwapId === p.id
                              ? isFouledOut
                                ? "error.dark"
                                : isFoulTrouble
                                  ? "warning.dark"
                                  : "primary.dark"
                              : "rgba(0, 0, 0, 0.04)",
                        },
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                        {isFouledOut && " - OUT"}
                        {isSelected && (
                          <SwapHoriz fontSize="small" sx={{ ml: 0.5 }} />
                        )}
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
                    aria-pressed={selectedSwapId === emptyId}
                    aria-label="Empty lineup slot, click to swap with bench player"
                    onClick={() => handleSwapClick(emptyId)}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      borderStyle: "dashed",
                      color:
                        selectedSwapId === emptyId ? "white" : "text.secondary",
                      bgcolor:
                        selectedSwapId === emptyId
                          ? "primary.main"
                          : "transparent",
                      "&:hover": {
                        bgcolor:
                          selectedSwapId === emptyId
                            ? "primary.dark"
                            : "rgba(0, 0, 0, 0.04)",
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

                  const isSelected = selectedSwapId === p.id;
                  const pts = s?.points || 0;
                  const label = `#${jerseyMap.get(p.id!) ?? ""} ${p.name} (Bench), ${pts} pts, ${pf} fouls${isSelected ? " - Selected for swap" : ""}`;

                  return (
                    <Button
                      key={p.id}
                      variant={isSelected ? "contained" : "outlined"}
                      aria-pressed={isSelected}
                      aria-label={label}
                      onClick={() => handleSwapClick(p.id!)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? "error.main"
                          : isFoulTrouble
                            ? "warning.main"
                            : "divider",
                        color:
                          selectedSwapId === p.id
                            ? "white"
                            : isFouledOut
                              ? "error.main"
                              : "text.primary",
                        opacity:
                          isFouledOut && selectedSwapId !== p.id ? 0.6 : 1,
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? "error.dark"
                              : isFoulTrouble
                                ? "warning.dark"
                                : "primary.main"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedSwapId === p.id
                              ? isFouledOut
                                ? "error.dark"
                                : isFoulTrouble
                                  ? "warning.dark"
                                  : "primary.dark"
                              : "rgba(0, 0, 0, 0.04)",
                        },
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                        {isFouledOut && " - OUT"}
                        {isSelected && (
                          <SwapHoriz fontSize="small" sx={{ ml: 0.5 }} />
                        )}
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
