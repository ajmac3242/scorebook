import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";

interface JumpBallDialogProps {
  open: boolean;
  teamName: string;
  opponentName: string;
  onSelectWinner: (_winnerId: string) => void;
}

export const JumpBallDialog: React.FC<JumpBallDialogProps> = ({
  open,
  teamName,
  opponentName,
  onSelectWinner,
}) => {
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      aria-labelledby="jump-ball-dialog-title"
    >
      <DialogTitle id="jump-ball-dialog-title" sx={{ textAlign: "center" }}>
        Jump Ball Winner
        <Typography
          variant="body2"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          Select who won the opening tip to initialize possession and the arrow.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack
          spacing={tokens.semantic.spacing.sm / 8}
          sx={{ mt: tokens.semantic.spacing.xs / 8 }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSelectWinner(SPECIAL_PLAYER_IDS.OUR_TEAM)}
            sx={{
              py: tokens.semantic.spacing.md / 8,
              fontSize: tokens.typography.fontSize.lg,
              backgroundColor: tokens.semantic.color.brand.primary.main,
              "&:hover": {
                backgroundColor: tokens.semantic.color.brand.primary.dark,
              },
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
              py: tokens.semantic.spacing.md / 8,
              fontSize: tokens.typography.fontSize.lg,
              backgroundColor: tokens.semantic.color.brand.secondary.main,
              "&:hover": {
                backgroundColor: tokens.semantic.color.brand.secondary.dark,
              },
            }}
          >
            {opponentName}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: "center", pb: `${tokens.semantic.spacing.sm}px` }}
      >
        <Typography
          variant="caption"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          This will set initial possession and the possession arrow.
        </Typography>
      </DialogActions>
    </Dialog>
  );
};
