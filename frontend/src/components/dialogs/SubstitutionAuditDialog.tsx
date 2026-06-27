/**
 * @file SubstitutionAuditDialog.tsx
 * @description Dialog for auditing and editing substitution events to ensure data integrity.
 */

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Typography,
  Box,
  Stack,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { db, type StatEvent, type Player } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";
import { formatClock } from "../../utils/mathUtils";
import { useLiveQuery } from "dexie-react-hooks";
import { logger } from "../../utils/logger";
import { syncService } from "../../utils/syncService";
import { useTokens } from "../../theme/useTokens";
import ConfirmDialog from "./ConfirmDialog";

interface SubstitutionAuditDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  players: Player[];
  jerseyMap: Map<string, string>;
}

const SubstitutionAuditDialog: React.FC<SubstitutionAuditDialogProps> = ({
  open,
  onClose,
  gameId,
  players,
  jerseyMap,
}) => {
  const tokens = useTokens();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlayerId, setEditPlayerId] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editPeriod, setEditPeriod] = useState<number>(1);
  const [playerFilter, setPlayerFilter] = useState<string>("ALL");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const subEvents = useLiveQuery(() => {
    if (!gameId) return [];
    return db.stats
      .where("gameId")
      .equals(gameId)
      .filter(
        (s) =>
          !s.deletedAt &&
          (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT),
      )
      .toArray()
      .then((events) => {
        return [...events].sort((a, b) => {
          if (a.timestamp < b.timestamp) return -1;
          if (a.timestamp > b.timestamp) return 1;
          return 0;
        });
      });
  }, [gameId]);

  const handleStartEdit = (event: StatEvent) => {
    setEditingId(event.id || null);
    setEditPlayerId(event.playerId);
    setEditTime(formatClock(event.clockTime || 0));
    setEditPeriod(event.period);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    // Parse mm:ss back to seconds
    const [mins, secs] = editTime.split(":").map((v) => parseInt(v) || 0);
    const totalSeconds = mins * 60 + secs;

    try {
      await db.stats.update(editingId, {
        playerId: editPlayerId,
        clockTime: totalSeconds,
        period: editPeriod,
        synced: 0,
      });
      await syncService.pushUpdates();
      setEditingId(null);
    } catch (err) {
      logger.error("Failed to update substitution event:", err);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await db.stats.update(eventToDelete, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    } catch (err) {
      logger.error("Failed to delete substitution event:", err);
    }
  };

  const playerOptions = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );

  const filteredEvents = useMemo(() => {
    if (!subEvents) return [];
    if (playerFilter === "ALL") return subEvents;
    return subEvents.filter((e) => e.playerId === playerFilter);
  }, [subEvents, playerFilter]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="sub-audit-title"
    >
      <DialogTitle
        id="sub-audit-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        <HistoryIcon /> Substitution Timeline Audit
      </DialogTitle>
      <DialogContent sx={{ p: tokens.semantic.spacing.dialogPadding / 8 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: tokens.semantic.spacing.md / 8,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: tokens.semantic.color.text.secondary }}
          >
            Review and correct the substitution timeline. Inaccurate data here
            affects plus/minus and lineup efficiency metrics.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Filter by player">
              <FilterIcon
                fontSize="small"
                sx={{ color: tokens.semantic.color.text.tertiary }}
              />
            </Tooltip>
            <Select
              size="small"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              sx={{
                minWidth: 150,
                fontSize: tokens.typography.fontSize.xs,
              }}
              aria-label="Filter events by player"
            >
              <MenuItem value="ALL">All Players</MenuItem>
              {playerOptions.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: "0.75rem" }}>
                  #{jerseyMap.get(p.id!) ?? "??"} {p.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small" aria-label="Substitution timeline">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Clock</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.map((event) => {
                const isEditing = editingId === event.id;
                const player = players.find((p) => p.id === event.playerId);

                return (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            px: tokens.semantic.spacing.xs / 8,
                            borderRadius: tokens.semantic.shape.radius.xs / 8,
                            bgcolor:
                              event.type === ACTION_TYPES.SUB_IN
                                ? tokens.semantic.color.feedback.success.main
                                : tokens.semantic.color.feedback.error.main,
                            color: tokens.semantic.color.text.inverse,
                          }}
                        >
                          {event.type.replace("SUB_", "")}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editPeriod}
                          onChange={(e) =>
                            setEditPeriod(parseInt(e.target.value) || 1)
                          }
                          sx={{ width: 60 }}
                        />
                      ) : (
                        event.period
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          placeholder="mm:ss"
                          sx={{ width: 80 }}
                        />
                      ) : (
                        formatClock(event.clockTime || 0)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          size="small"
                          value={editPlayerId}
                          onChange={(e) => setEditPlayerId(e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {playerOptions.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              #{jerseyMap.get(p.id!) ?? "??"} {p.name}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.75rem",
                              bgcolor: player?.avatarColor,
                            }}
                          >
                            {jerseyMap.get(event.playerId) ?? "??"}
                          </Avatar>
                          <Typography variant="body2">
                            {player?.name || "Unknown"}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          <Tooltip title="Save Changes">
                            <IconButton
                              size="small"
                              sx={{
                                color: tokens.semantic.color.brand.primary.main,
                              }}
                              onClick={handleSaveEdit}
                              aria-label="Save changes"
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Editing">
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel editing"
                              sx={{
                                color: tokens.semantic.color.text.secondary,
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          <Tooltip
                            title={`Edit ${event.type === ACTION_TYPES.SUB_IN ? "Sub In" : "Sub Out"}`}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleStartEdit(event)}
                              aria-label={`Edit ${event.type === ACTION_TYPES.SUB_IN ? "sub in" : "sub out"} for ${player?.name}`}
                              sx={{
                                color: tokens.semantic.color.text.secondary,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={`Delete ${event.type === ACTION_TYPES.SUB_IN ? "Sub In" : "Sub Out"}`}
                          >
                            <IconButton
                              size="small"
                              sx={{
                                color: tokens.semantic.color.feedback.error.main,
                              }}
                              onClick={() => {
                                setEventToDelete(event.id!);
                                setDeleteConfirmOpen(true);
                              }}
                              aria-label={`Delete ${event.type === ACTION_TYPES.SUB_IN ? "sub in" : "sub out"} for ${player?.name}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!subEvents || subEvents.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: tokens.semantic.spacing.xl / 8 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      No substitution events recorded for this game.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Substitution Event?"
        description="Are you sure you want to delete this substitution event? This will immediately affect live lineups, plus/minus calculations, and stint durations."
        confirmLabel="Delete Event"
        destructive
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Dialog>
  );
};

export default SubstitutionAuditDialog;
