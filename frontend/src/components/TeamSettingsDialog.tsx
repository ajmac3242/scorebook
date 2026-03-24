import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { Team } from "../db";

interface TeamSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  team: Team;
  onSave: (updatedTeam: Partial<Team>) => void;
  onDelete: (teamId: string) => void;
}

/**
 * Dialog for editing team settings and deletion.
 *
 * @param {TeamSettingsDialogProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const TeamSettingsDialog: React.FC<TeamSettingsDialogProps> = ({
  open,
  onClose,
  team,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [color, setColor] = useState(team.color || "#287094");

  // Keep track of the team ID to reset state when the active team changes
  const [prevTeamId, setPrevTeamId] = useState(team.id);

  if (team.id !== prevTeamId) {
    setPrevTeamId(team.id);
    setName(team.name);
    setDescription(team.description || "");
    setColor(team.color || "#287094");
  }

  const handleSave = () => {
    onSave({ name, description, color });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          Team Settings
          <IconButton
            edge="end"
            color="error"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this team?")) {
                onDelete(team.id);
                onClose();
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Team Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Box>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Primary Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                padding: "2px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fff",
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
