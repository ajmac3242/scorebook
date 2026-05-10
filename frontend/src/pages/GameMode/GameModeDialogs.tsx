import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from "@mui/material";
import { formatClock } from "../../utils/mathUtils";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

interface EndGameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isEnding: boolean;
}

export const EndGameDialog: React.FC<EndGameDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isEnding,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ fontFamily: "var(--serif)" }}>End Game?</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Is the game finished? Once ended, the results will be finalized for
        team averages.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} color="inherit" disabled={isEnding}>
        No, Continue
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        disabled={isEnding}
      >
        {isEnding ? "Ending..." : "Yes, Finish Game"}
      </Button>
    </DialogActions>
  </Dialog>
);

interface DeleteStatDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  statToDelete: string | null;
  gameStats: Array<{
    id?: string;
    playerId: string;
    type: string;
    clockTime?: number;
  }>;
  playerNamesMap: Map<string, string>;
  gameOpponent?: string;
}

export const DeleteStatDialog: React.FC<DeleteStatDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isDeleting,
  statToDelete,
  gameStats,
  playerNamesMap,
  gameOpponent,
}) => {
  const s = gameStats.find((st) => st.id === statToDelete);
  const getOppName = (pId: string) => {
    if (pId === SPECIAL_PLAYER_IDS.OPPONENT) return gameOpponent || "Opponent";
    if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
      const jersey = pId.split(":")[1];
      return `${gameOpponent || "Opponent"} #${jersey}`;
    }
    return "Opponent";
  };

  const playerName = s
    ? s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
      ? getOppName(s.playerId)
      : playerNamesMap.get(s.playerId) || "Player"
    : "Action";

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {s
            ? `Delete ${s.type} by ${playerName} at ${formatClock(s.clockTime)}?`
            : "Are you sure you want to delete this action?"}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete Action"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
