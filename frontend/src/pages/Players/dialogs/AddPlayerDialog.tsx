import React from "react";
import PlayerWorkflowDialog from "../../../components/players/PlayerWorkflowDialog";

type AddPlayerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (_message: string) => void;
  onError: (_message: string) => void;
};

const AddPlayerDialog: React.FC<AddPlayerDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
}) => (
  <PlayerWorkflowDialog
    open={open}
    onClose={onClose}
    mode="create"
    onSuccess={onSuccess}
    onError={onError}
  />
);

export default AddPlayerDialog;