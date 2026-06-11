import React from "react";
import PlayerWorkflowDialog from "../../../components/players/PlayerWorkflowDialog";
import { type Player } from "../../../db";

type EditPlayerDialogProps = {
  open: boolean;
  onClose: () => void;
  player: Player | undefined;
  playerId: string | undefined;
  accentFocus: string;
  onSuccess?: (_message: string) => void;
  onError?: (_message: string) => void;
};

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({
  open,
  onClose,
  player,
  playerId,
  onSuccess,
  onError,
}) => (
  <PlayerWorkflowDialog
    open={open}
    onClose={onClose}
    mode="edit"
    player={player}
    playerId={playerId}
    onSuccess={onSuccess}
    onError={onError}
  />
);

export default EditPlayerDialog;
