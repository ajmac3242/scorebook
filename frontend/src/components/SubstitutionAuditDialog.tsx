/**
 * @file SubstitutionAuditDialog.tsx
 * @description Dialog for auditing and editing substitution events to ensure data integrity.
 */

import React, { useState } from "react";
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
  Typography,
} from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { db, type StatEvent, type Player } from "../db";
import { ACTION_TYPES } from "../constants/stats";
import { formatClock } from "../utils/mathUtils";
import { useLiveQuery } from "dexie-react-hooks";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import SubstitutionAuditRow from "./SubstitutionAudit/SubstitutionAuditRow";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlayerId, setEditPlayerId] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editPeriod, setEditPeriod] = useState<number>(1);

  const subEvents = useLiveQuery(async () => {
    if (!gameId) return [];
    const events = await db.stats
      .where("gameId")
      .equals(gameId)
      .filter(
        (s) =>
          !s.deletedAt &&
          (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT),
      )
      .toArray();
    return events.sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
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

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this substitution event? This will affect lineup and plus/minus calculations.",
      )
    ) {
      return;
    }
    try {
      await db.stats.update(id, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to delete substitution event:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontFamily: "var(--serif)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <HistoryIcon /> Substitution Timeline Audit
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Review and correct the substitution timeline. Inaccurate data here
          affects plus/minus and lineup efficiency metrics.
        </Typography>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
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
              {subEvents?.map((event) => (
                <SubstitutionAuditRow
                  key={event.id}
                  event={event}
                  isEditing={editingId === event.id}
                  player={players.find((p) => p.id === event.playerId)}
                  players={players}
                  jerseyMap={jerseyMap}
                  editPeriod={editPeriod}
                  editTime={editTime}
                  editPlayerId={editPlayerId}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={handleDelete}
                  onSetEditPeriod={setEditPeriod}
                  onSetEditTime={setEditTime}
                  onSetEditPlayerId={setEditPlayerId}
                />
              ))}
              {(!subEvents || subEvents.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubstitutionAuditDialog;
