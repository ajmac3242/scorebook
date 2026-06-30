import React from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { type Player, type TeamPlayer } from "../../../db";
import { getInitials } from "../../../utils/stats";
import { useTokens } from "../../../theme/useTokens";

type ManageRosterDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  allPlayers: Player[];
  teamPlayers: TeamPlayer[];
  pendingRosterChanges: Record<
    string,
    { action: "add" | "remove"; jersey?: string }
  >;
  localJerseyNumbers: Record<string, string>;
  rosterSearchTerm: string;
  setRosterSearchTerm: (_v: string) => void;
  onStageChange: (_playerId: string, _currentlyIn: boolean) => void;
  onStageJerseyUpdate: (_playerId: string, _jersey: string) => void;
};

const ManageRosterDialog: React.FC<ManageRosterDialogProps> = ({
  open,
  onClose,
  onSave,
  allPlayers,
  teamPlayers,
  pendingRosterChanges,
  localJerseyNumbers,
  rosterSearchTerm,
  setRosterSearchTerm,
  onStageChange,
  onStageJerseyUpdate,
}) => {
  const tokens = useTokens();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Manage team roster</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Search players"
          value={rosterSearchTerm}
          onChange={(e) => setRosterSearchTerm(e.target.value)}
          sx={{
            mb: tokens.semantic.spacing.md / 4,
            mt: tokens.spacing[1] / 4,
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        <List sx={{ pt: 0 }}>
          {allPlayers
            .filter((player) =>
              player.name
                .toLowerCase()
                .includes(rosterSearchTerm.toLowerCase()),
            )
            .map((player) => {
              const pId = player.id!.toString();
              const dbRecord = teamPlayers.find(
                (tp) => tp.playerId.toString() === pId,
              );
              const stagedChange = pendingRosterChanges[pId];

              let isIn = !!dbRecord;
              if (stagedChange?.action === "add") isIn = true;
              if (stagedChange?.action === "remove") isIn = false;

              const jersey =
                localJerseyNumbers[pId] !== undefined
                  ? localJerseyNumbers[pId]
                  : (dbRecord?.jerseyNumber ?? "");

              return (
                <ListItem
                  key={player.id}
                  divider
                  sx={{
                    px: {
                      xs: tokens.spacing[1] / 4,
                      sm: tokens.spacing[2] / 4,
                    },
                    alignItems: "center",
                  }}
                  secondaryAction={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: {
                          xs: tokens.spacing[0.5] / 4,
                          sm: tokens.spacing[1] / 4,
                        },
                      }}
                    >
                      {isIn ? (
                        <TextField
                          size="small"
                          label="#"
                          slotProps={{ htmlInput: { maxLength: 2 } }}
                          sx={{
                            width: {
                              xs: `${tokens.spacing[14] + tokens.spacing[1]}px`,
                              sm: `${tokens.spacing[20]}px`,
                            },
                          }}
                          value={jersey}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d{1,2}$/.test(val)) {
                              onStageJerseyUpdate(pId, val);
                            }
                          }}
                        />
                      ) : null}

                      {isIn ? (
                        <IconButton
                          edge="end"
                          aria-label={`remove ${player.name}`}
                          onClick={() => onStageChange(pId, true)}
                          color="error"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onStageChange(pId, false)}
                          sx={{
                            minWidth: {
                              xs: `${tokens.spacing[10] + tokens.spacing[3]}px`,
                              sm: `${tokens.spacing[14] + tokens.spacing[3.5]}px`,
                            },
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: "none",
                            borderRadius: `${tokens.semantic.component.radius.button}px`,
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                  }
                >
                  <Avatar sx={{ bgcolor: player.avatarColor, mr: 2 }}>
                    {getInitials(player.name)}
                  </Avatar>
                  <ListItemText primary={player.name} />
                </ListItem>
              );
            })}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: tokens.semantic.spacing.md / 4 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{ borderRadius: `${tokens.semantic.component.radius.button}px` }}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageRosterDialog;
