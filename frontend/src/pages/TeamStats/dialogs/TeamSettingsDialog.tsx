import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";

type TeamSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onDeleteRequest: () => void;
  editName: string;
  setEditName: (_v: string) => void;
  editLogoUrl: string;
  setEditLogoUrl: (_v: string) => void;
  editColor: string;
  setEditColor: (_v: string) => void;
  editPeriodType: "QUARTERS" | "HALVES";
  setEditPeriodType: (_v: "QUARTERS" | "HALVES") => void;
  editPeriodLength: number;
  setEditPeriodLength: (_v: number) => void;
  editOvertimeLength: number;
  setEditOvertimeLength: (_v: number) => void;
  editMaxStintDuration: number;
  setEditMaxStintDuration: (_v: number) => void;
  editTimeoutLimit: number;
  setEditTimeoutLimit: (_v: number) => void;
  editFoulLimit: number;
  setEditFoulLimit: (_v: number) => void;
  editFoulWarningThresholds: Record<string, number>;
  setEditFoulWarningThresholds: (_v: Record<string, number>) => void;
  editPlaybook: string[];
  setEditPlaybook: (_v: string[]) => void;
  newPlayName: string;
  setNewPlayName: (_v: string) => void;
};

const TeamSettingsDialog: React.FC<TeamSettingsDialogProps> = ({
  open,
  onClose,
  onSave,
  onDeleteRequest,
  editName,
  setEditName,
  editLogoUrl,
  setEditLogoUrl,
  editColor,
  setEditColor,
  editPeriodType,
  setEditPeriodType,
  editPeriodLength,
  setEditPeriodLength,
  editOvertimeLength,
  setEditOvertimeLength,
  editMaxStintDuration,
  setEditMaxStintDuration,
  editTimeoutLimit,
  setEditTimeoutLimit,
  editFoulLimit,
  setEditFoulLimit,
  editFoulWarningThresholds,
  setEditFoulWarningThresholds,
  editPlaybook,
  setEditPlaybook,
  newPlayName,
  setNewPlayName,
}) => {
  const tokens = useTokens();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: tokens.typography.fontWeight.bold,
        }}
      >
        Edit team details
        <Tooltip title="Delete team">
          <IconButton
            aria-label="delete team"
            color="error"
            onClick={onDeleteRequest}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: tokens.semantic.spacing.xs / 8 }}>
          <TextField
            fullWidth
            label="Team name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <TextField
            fullWidth
            label="Logo URL"
            value={editLogoUrl}
            onChange={(e) => setEditLogoUrl(e.target.value)}
          />

          <Box>
            <Typography
              id="primary-color-label"
              variant="caption"
              sx={{
                color: tokens.semantic.color.text.secondary,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              Primary color
            </Typography>
            <Box
              component="input"
              aria-labelledby="primary-color-label"
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              sx={{
                display: "block",
                width: "100%",
                height: 48,
                mt: tokens.semantic.spacing.xs / 8,
                p: 0.5,
                border: "1px solid",
                borderColor: tokens.semantic.color.border.subtle,
                borderRadius: `${Math.max(tokens.semantic.shape.radius.md, 10)}px`,
                cursor: "pointer",
                bgcolor: tokens.semantic.color.background.paper,
              }}
            />
          </Box>

          <Divider>
            <Chip label="Game defaults" size="small" />
          </Divider>

          <FormControl fullWidth>
            <InputLabel id="period-type-label">Period type</InputLabel>
            <Select
              labelId="period-type-label"
              value={editPeriodType}
              label="Period type"
              onChange={(e) =>
                setEditPeriodType(e.target.value as "QUARTERS" | "HALVES")
              }
            >
              <MenuItem value="QUARTERS">Quarters</MenuItem>
              <MenuItem value="HALVES">Halves</MenuItem>
            </Select>
          </FormControl>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Period length (mins)"
              type="number"
              value={editPeriodLength}
              onChange={(e) =>
                setEditPeriodLength(parseInt(e.target.value, 10) || 0)
              }
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              fullWidth
              label="OT length (mins)"
              type="number"
              value={editOvertimeLength}
              onChange={(e) =>
                setEditOvertimeLength(parseInt(e.target.value, 10) || 0)
              }
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Stack>

          <TextField
            fullWidth
            label="Max stint duration (mins)"
            type="number"
            value={editMaxStintDuration}
            onChange={(e) =>
              setEditMaxStintDuration(parseInt(e.target.value, 10) || 0)
            }
            slotProps={{ htmlInput: { min: 1 } }}
            helperText="Alert scorekeeper when a player exceeds this time."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Timeouts"
              type="number"
              value={editTimeoutLimit}
              onChange={(e) =>
                setEditTimeoutLimit(parseInt(e.target.value, 10) || 0)
              }
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              fullWidth
              label="Foul limit"
              type="number"
              value={editFoulLimit}
              onChange={(e) =>
                setEditFoulLimit(parseInt(e.target.value, 10) || 0)
              }
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Stack>

          <Divider>
            <Chip label="Foul warnings by period" size="small" />
          </Divider>

          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: tokens.semantic.spacing.xs / 8,
                display: "block",
                color: tokens.semantic.color.text.secondary,
              }}
            >
              Alert when a player reaches this many fouls in a period.
            </Typography>
            <Grid container spacing={1}>
              {[1, 2, 3, 4].map((p) => (
                <Grid size={{ xs: 6, sm: 3 }} key={p}>
                  <TextField
                    size="small"
                    label={`P${p}`}
                    type="number"
                    value={editFoulWarningThresholds[`P${p}`] || ""}
                    onChange={(e) =>
                      setEditFoulWarningThresholds({
                        ...editFoulWarningThresholds,
                        [`P${p}`]: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    slotProps={{ htmlInput: { min: 0, max: editFoulLimit } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider>
            <Chip label="Playbook" size="small" />
          </Divider>

          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 1 }}
            >
              <TextField
                fullWidth
                size="small"
                label="New play name"
                value={newPlayName}
                onChange={(e) => setNewPlayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPlayName.trim()) {
                    e.preventDefault();
                    setEditPlaybook([...editPlaybook, newPlayName.trim()]);
                    setNewPlayName("");
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (newPlayName.trim()) {
                    setEditPlaybook([...editPlaybook, newPlayName.trim()]);
                    setNewPlayName("");
                  }
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: tokens.typography.fontWeight.bold,
                  minWidth: { xs: "100%", sm: 88 },
                }}
              >
                Add
              </Button>
            </Stack>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {editPlaybook.map((play, idx) => (
                <Chip
                  key={idx}
                  label={play}
                  onDelete={() => {
                    const next = [...editPlaybook];
                    next.splice(idx, 1);
                    setEditPlaybook(next);
                  }}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamSettingsDialog;
