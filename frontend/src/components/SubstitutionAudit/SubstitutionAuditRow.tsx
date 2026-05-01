import React from "react";
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { type StatEvent, type Player } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";
import { formatClock } from "../../utils/mathUtils";

interface SubstitutionAuditRowProps {
  event: StatEvent;
  isEditing: boolean;
  player: Player | undefined;
  players: Player[];
  jerseyMap: Map<string, string>;
  editPeriod: number;
  editTime: string;
  editPlayerId: string;
  onStartEdit: (_event: StatEvent) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (_id: string) => void;
  onSetEditPeriod: (_period: number) => void;
  onSetEditTime: (_time: string) => void;
  onSetEditPlayerId: (_id: string) => void;
}

const SubstitutionAuditRow: React.FC<SubstitutionAuditRowProps> = ({
  event,
  isEditing,
  player,
  players,
  jerseyMap,
  editPeriod,
  editTime,
  editPlayerId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSetEditPeriod,
  onSetEditTime,
  onSetEditPlayerId,
}) => {
  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              px: 1,
              borderRadius: 0.5,
              bgcolor:
                event.type === ACTION_TYPES.SUB_IN
                  ? "success.light"
                  : "error.light",
              color:
                event.type === ACTION_TYPES.SUB_IN
                  ? "success.contrastText"
                  : "error.contrastText",
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
            onChange={(e) => onSetEditPeriod(parseInt(e.target.value) || 1)}
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
            onChange={(e) => onSetEditTime(e.target.value)}
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
            onChange={(e) => onSetEditPlayerId(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {[...players]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  #{jerseyMap.get(p.id!) ?? "??"} {p.name}
                </MenuItem>
              ))}
          </Select>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <Typography variant="body2">{player?.name || "Unknown"}</Typography>
          </Box>
        )}
      </TableCell>
      <TableCell align="right">
        {isEditing ? (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              size="small"
              color="primary"
              onClick={onSaveEdit}
              aria-label="Save changes"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onCancelEdit}
              aria-label="Cancel editing"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              size="small"
              onClick={() => onStartEdit(event)}
              aria-label={`Edit ${event.type === ACTION_TYPES.SUB_IN ? "sub in" : "sub out"} for ${player?.name}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(event.id!)}
              aria-label={`Delete ${event.type === ACTION_TYPES.SUB_IN ? "sub in" : "sub out"} for ${player?.name}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(SubstitutionAuditRow);
