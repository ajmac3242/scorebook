import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  useTheme,
} from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";

interface JumpBallDialogProps {
  open: boolean;
  teamName: string;
  opponentName: string;
  onSelectWinner: (winnerId: string) => void;
}

export const JumpBallDialog: React.FC<JumpBallDialogProps> = ({
  open,
  teamName,
  opponentName,
  onSelectWinner,
}) => {
  const theme = useTheme();

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        Jump Ball Winner
        <Typography variant="body2" color="text.secondary">
          Select who won the opening tip to initialize possession and the arrow.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSelectWinner(SPECIAL_PLAYER_IDS.OUR_TEAM)}
            sx={{
              py: 3,
              fontSize: "1.25rem",
              backgroundColor: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            }}
          >
            {teamName}
          </Button>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSelectWinner(SPECIAL_PLAYER_IDS.OPPONENT)}
            sx={{
              py: 3,
              fontSize: "1.25rem",
              backgroundColor: theme.palette.secondary.main,
              "&:hover": { backgroundColor: theme.palette.secondary.dark },
            }}
          >
            {opponentName}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          This will set initial possession and the possession arrow.
        </Typography>
      </DialogActions>
    </Dialog>
  );
};
