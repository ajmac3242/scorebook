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
  Chip,
  Tooltip,
} from "@mui/material";
import { SwapHoriz, Warning } from "@mui/icons-material";
import { Player, Team, Game } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats";
import { useTokens } from "../../../theme/useTokens";

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
  isForced?: boolean;
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
  isForced = false,
}) => {
  const tokens = useTokens();

  const handleClose = (
    _event: {},
    _reason?: "backdropClick" | "escapeKeyDown",
  ) => {
    if (isForced && draftOnCourtIds.size !== 5) {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Quick Substitution
        {selectedSwapId && (
          <Button
            size="small"
            variant="text"
            onClick={() => handleSwapClick(selectedSwapId)}
            sx={{ fontSize: tokens.typography.fontSize.xs }}
            aria-label="Clear current selection"
          >
            Clear Selection
          </Button>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}>
        <Typography
          id="quick-sub-instructions"
          variant="caption"
          sx={{
            mb: `${tokens.semantic.spacing.md}px`,
            display: "block",
            color: tokens.semantic.color.text.secondary,
          }}
        >
          To substitute: Tap an on-court player and then a bench player to swap
          their positions.
        </Typography>
        <Grid
          container
          spacing={2}
          sx={{ mt: `${tokens.semantic.spacing.sm}px` }}
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
                      aria-label={`Swap #${jerseyMap.get(p.id!) ?? ""} ${p.name}${isFouledOut ? " (Disqualified)" : isFoulTrouble ? " (Foul Danger)" : ""}`}
                      aria-pressed={selectedSwapId === p.id}
                      onClick={() => handleSwapClick(p.id!)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? tokens.semantic.color.feedback.error.main
                          : isFoulTrouble
                            ? tokens.semantic.color.feedback.warning.main
                            : tokens.semantic.color.border.subtle,
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.action.focusRing}`,
                          outlineOffset: tokens.semantic.focus.offset,
                        },
                        color: isFouledOut
                          ? tokens.semantic.color.feedback.error.main
                          : tokens.semantic.color.text.primary,
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? tokens.semantic.color.feedback.error.light
                              : isFoulTrouble
                                ? tokens.semantic.color.feedback.warning.light
                                : tokens.semantic.color.brand.primary.main
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor:
                            p.avatarColor ||
                            tokens.semantic.color.entity.defaultAccent,
                        }}
                      >
                        {jerseyMap.get(p.id!) ?? ""}
                      </Avatar>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          textDecoration: isFouledOut ? "line-through" : "none",
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                      </Typography>
                      {isFoulTrouble && (
                        <Tooltip
                          title={`Foul Danger (${pf}/${foulLimit} fouls)`}
                        >
                          <Warning
                            data-testid="foul-warning-icon"
                            sx={{
                              fontSize: "1.1rem",
                              color: tokens.semantic.color.feedback.warning.main,
                              ml: 0.5,
                            }}
                          />
                        </Tooltip>
                      )}
                      {isFouledOut && (
                        <Chip
                          label="DISQUALIFIED"
                          size="small"
                          color="error"
                          sx={{
                            height: 18,
                            fontSize: "0.55rem",
                            fontWeight: tokens.typography.fontWeight.bold,
                            ml: 0.5,
                          }}
                        />
                      )}
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
                      color: tokens.semantic.color.text.secondary,
                      borderWidth: selectedSwapId === emptyId ? 2 : 1,
                      bgcolor:
                        selectedSwapId === emptyId
                          ? tokens.semantic.color.action.hover
                          : "transparent",
                      "&:focus-visible": {
                        outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.action.focusRing}`,
                        outlineOffset: tokens.semantic.focus.offset,
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
                        border: `1px dashed ${tokens.semantic.color.border.default}`,
                        color: tokens.semantic.color.text.muted,
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
                      aria-label={`Swap #${jerseyMap.get(p.id!) ?? ""} ${p.name}${isFouledOut ? " (Disqualified)" : isFoulTrouble ? " (Foul Danger)" : ""}`}
                      aria-pressed={selectedSwapId === p.id}
                      onClick={() => !isFouledOut && handleSwapClick(p.id!)}
                      fullWidth
                      disabled={isFouledOut}
                      sx={{
                        justifyContent: "flex-start",
                        borderColor: isFouledOut
                          ? tokens.semantic.color.feedback.error.main
                          : isFoulTrouble
                            ? tokens.semantic.color.feedback.warning.main
                            : tokens.semantic.color.border.subtle,
                        borderWidth: selectedSwapId === p.id ? 2 : 1,
                        "&:focus-visible": {
                          outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.action.focusRing}`,
                          outlineOffset: tokens.semantic.focus.offset,
                        },
                        color: isFouledOut
                          ? tokens.semantic.color.feedback.error.main
                          : tokens.semantic.color.text.primary,
                        opacity: isFouledOut ? 0.6 : 1,
                        bgcolor:
                          selectedSwapId === p.id
                            ? isFouledOut
                              ? tokens.semantic.color.feedback.error.light
                              : isFoulTrouble
                                ? tokens.semantic.color.feedback.warning.light
                                : tokens.semantic.color.brand.primary.main
                            : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          mr: 1,
                          bgcolor:
                            p.avatarColor ||
                            tokens.semantic.color.entity.defaultAccent,
                        }}
                      >
                        {jerseyMap.get(p.id!) ?? ""}
                      </Avatar>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          textDecoration: isFouledOut ? "line-through" : "none",
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        #{jerseyMap.get(p.id!) ?? ""} {p.name}
                      </Typography>
                      {isFoulTrouble && (
                        <Tooltip
                          title={`Foul Danger (${pf}/${foulLimit} fouls)`}
                        >
                          <Warning
                            data-testid="foul-warning-icon"
                            sx={{
                              fontSize: "1.1rem",
                              color: tokens.semantic.color.feedback.warning.main,
                              ml: 0.5,
                            }}
                          />
                        </Tooltip>
                      )}
                      {isFouledOut && (
                        <Chip
                          label="DISQUALIFIED"
                          size="small"
                          color="error"
                          sx={{
                            height: 18,
                            fontSize: "0.55rem",
                            fontWeight: tokens.typography.fontWeight.bold,
                            ml: 0.5,
                          }}
                        />
                      )}
                    </Button>
                  );
                })}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: `${tokens.semantic.spacing.md}px` }}>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isForced && draftOnCourtIds.size !== 5}
        >
          Cancel
        </Button>
        <Button
          onClick={handleQuickSub}
          variant="contained"
          disabled={isSaving || draftOnCourtIds.size !== 5}
          startIcon={isSaving ? <CircularProgress size={20} /> : <SwapHoriz />}
        >
          {isSaving ? "Saving..." : isForced ? "Save Forced Sub" : "Sub In"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSubDialog;
