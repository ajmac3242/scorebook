import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Box,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { SportsBasketball } from "@mui/icons-material";
import { Player } from "../../../db";
import { useTokens } from "../../../theme/useTokens";

interface StartingLineupDialogProps {
  open: boolean;
  players: Player[];
  jerseyMap: Map<string, string | undefined>;
  onConfirm: (_selectedIds: Set<string>) => void;
}

export const StartingLineupDialog: React.FC<StartingLineupDialogProps> = ({
  open,
  players,
  jerseyMap,
  onConfirm,
}) => {
  const tokens = useTokens();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleTogglePlayer = (playerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        if (next.size < 5) {
          next.add(playerId);
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedIds.size === 5) {
      onConfirm(selectedIds);
    }
  };

  const isConfirmedDisabled = selectedIds.size !== 5;

  const focusRingSx = {
    "&:focus-visible": {
      outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
      outlineOffset: `${tokens.semantic.focus.offset}px`,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Block close by setting empty handler
      fullWidth
      maxWidth="sm"
      aria-labelledby="starting-lineup-title"
      aria-describedby="starting-lineup-instructions"
    >
      <DialogTitle
        id="starting-lineup-title"
        sx={{
          textAlign: "center",
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
          pt: tokens.semantic.spacing.lg / 8,
        }}
      >
        Verify Starting Lineup
        <Typography
          id="starting-lineup-instructions"
          variant="body2"
          sx={{
            color: tokens.semantic.color.text.secondary,
            mt: tokens.semantic.spacing.xs / 8,
          }}
        >
          Select exactly 5 players to represent the starting lineup on the
          court.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: tokens.semantic.spacing.sm / 8,
            px: tokens.semantic.spacing.xs / 8,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.primary,
            }}
          >
            ROSTER SELECTION
          </Typography>
          <Typography
            variant="body2"
            role="status"
            aria-live="polite"
            sx={{
              fontWeight: tokens.typography.fontWeight.black,
              color:
                selectedIds.size === 5
                  ? tokens.semantic.color.feedback.success.main
                  : tokens.semantic.color.feedback.warning.main,
            }}
          >
            {selectedIds.size} of 5 Selected
          </Typography>
        </Box>

        <List
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            border: `1px solid ${tokens.semantic.color.border.subtle}`,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
            bgcolor: tokens.semantic.color.background.inset,
            p: 0,
          }}
        >
          {players.map((player) => {
            if (!player.id) return null;
            const isSelected = selectedIds.has(player.id);
            const jersey = jerseyMap.get(player.id) ?? "";
            const isSelectable = isSelected || selectedIds.size < 5;

            return (
              <ListItemButton
                key={player.id}
                onClick={() => handleTogglePlayer(player.id!)}
                disabled={!isSelectable}
                sx={{
                  py: tokens.semantic.spacing.xs / 8,
                  px: tokens.semantic.spacing.md / 8,
                  borderBottom: `1px solid ${tokens.semantic.color.border.subtle}`,
                  "&:last-child": { borderBottom: "none" },
                  bgcolor: isSelected
                    ? tokens.semantic.color.action.selected
                    : "transparent",
                  "&:hover": {
                    bgcolor: tokens.semantic.color.action.hover,
                  },
                  ...focusRingSx,
                }}
              >
                <Checkbox
                  edge="start"
                  checked={isSelected}
                  disabled={!isSelectable}
                  tabIndex={-1}
                  disableRipple
                  sx={{ mr: tokens.semantic.spacing.sm / 8 }}
                />
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.bold,
                    mr: tokens.semantic.spacing.md / 8,
                    bgcolor:
                      player.avatarColor ||
                      tokens.semantic.color.entity.defaultAccent,
                    color: tokens.semantic.color.text.inverse,
                  }}
                >
                  {jersey}
                </Avatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: isSelected
                          ? tokens.typography.fontWeight.bold
                          : tokens.typography.fontWeight.regular,
                        color: isSelected
                          ? tokens.semantic.color.text.primary
                          : isSelectable
                            ? tokens.semantic.color.text.secondary
                            : tokens.semantic.color.text.disabled,
                      }}
                    >
                      {`#${jersey} ${player.name}`}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions
        sx={{
          px: `${tokens.semantic.spacing.dialogPadding}px`,
          pb: `${tokens.semantic.spacing.dialogPadding}px`,
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: tokens.semantic.color.text.muted }}
        >
          Starting lineup must be confirmed to begin tracking.
        </Typography>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isConfirmedDisabled}
          startIcon={<SportsBasketball />}
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            px: tokens.semantic.spacing.lg / 8,
            ...focusRingSx,
          }}
        >
          Confirm Starting Lineup
        </Button>
      </DialogActions>
    </Dialog>
  );
};
