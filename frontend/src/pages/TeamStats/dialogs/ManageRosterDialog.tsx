import React, { useMemo } from "react";
import {
  Alert,
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
import { Tooltip } from "@mui/material";
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

  const currentRoster = useMemo(() => {
    return allPlayers
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

        return { pId, isIn, jersey };
      })
      .filter((p) => p.isIn);
  }, [allPlayers, teamPlayers, pendingRosterChanges, localJerseyNumbers]);

  const duplicateJerseys = useMemo(() => {
    const counts: Record<string, number> = {};
    currentRoster.forEach((p) => {
      if (p.jersey) {
        counts[p.jersey] = (counts[p.jersey] || 0) + 1;
      }
    });
    return Object.keys(counts).filter((j) => counts[j] > 1);
  }, [currentRoster]);

  const missingJerseys = useMemo(() => {
    return currentRoster.filter((p) => !p.jersey).map((p) => p.pId);
  }, [currentRoster]);

  const hasValidationErrors =
    duplicateJerseys.length > 0 || missingJerseys.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Manage team roster
      </DialogTitle>

      <DialogContent>
        {hasValidationErrors && (
          <Alert
            severity="error"
            role="alert"
            aria-live="assertive"
            sx={{ mb: `${tokens.semantic.spacing.md}px` }}
          >
            Jersey numbers must be unique and cannot be empty.
          </Alert>
        )}

        <TextField
          fullWidth
          size="small"
          placeholder="Search players"
          value={rosterSearchTerm}
          onChange={(e) => setRosterSearchTerm(e.target.value)}
          sx={{
            mb: `${tokens.semantic.spacing.md}px`,
            mt: `${tokens.semantic.spacing.xs}px`,
          }}
          slotProps={{
            htmlInput: {
              "aria-label": "Search players",
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: tokens.semantic.color.text.secondary }}
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

              const isDuplicate =
                jersey !== "" && duplicateJerseys.includes(jersey);
              const isMissing = isIn && !jersey;

              return (
                <ListItem
                  key={player.id}
                  divider
                  sx={{
                    px: {
                      xs: tokens.semantic.spacing.xs / 8,
                      sm: tokens.semantic.spacing.sm / 8,
                    },
                    alignItems: "center",
                  }}
                  secondaryAction={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: {
                          xs: tokens.semantic.spacing.xs / 16,
                          sm: tokens.semantic.spacing.xs / 8,
                        },
                      }}
                    >
                      {isIn ? (
                        <TextField
                          size="small"
                          label="#"
                          slotProps={{
                            htmlInput: {
                              maxLength: 2,
                              "aria-label": `Jersey number for ${player.name}`,
                            },
                          }}
                          sx={{ width: { xs: 60, sm: 80 } }}
                          value={jersey}
                          error={isDuplicate || isMissing}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d{1,2}$/.test(val)) {
                              onStageJerseyUpdate(pId, val);
                            }
                          }}
                        />
                      ) : null}

                      {isIn ? (
                        <Tooltip title={`Remove ${player.name} from roster`}>
                          <IconButton
                            edge="end"
                            aria-label={`Remove ${player.name} from roster`}
                            onClick={() => onStageChange(pId, true)}
                            color="error"
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onStageChange(pId, false)}
                          sx={{
                            minWidth: { xs: 52, sm: 70 },
                            textTransform: "none",
                            fontWeight: tokens.typography.fontWeight.semibold,
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
                  <Avatar
                    sx={{
                      bgcolor: player.avatarColor,
                      mr: `${tokens.semantic.spacing.md}px`,
                    }}
                  >
                    {getInitials(player.name)}
                  </Avatar>
                  <ListItemText primary={player.name} />
                </ListItem>
              );
            })}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: `${tokens.semantic.spacing.md}px` }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={hasValidationErrors}
          sx={{ borderRadius: `${tokens.semantic.component.radius.button}px` }}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageRosterDialog;
