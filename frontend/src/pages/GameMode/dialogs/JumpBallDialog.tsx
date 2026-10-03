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
      aria-describedby="jump-ball-dialog-desc"
    >
      <DialogTitle
        id="jump-ball-dialog-title"
        sx={{
          textAlign: "center",
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Jump Ball Winner
        <Typography
          id="jump-ball-dialog-desc"
          variant="body2"
          sx={{
            color: tokens.semantic.color.text.secondary,
            mt: tokens.semantic.spacing.xs / 8,
          }}
        >
          Select who won the opening tip to initialize possession and the arrow.
        </Typography>
      </DialogTitle>
      <DialogContent
        role="region"
        aria-label="Opening tip winner selection"
        sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}
      >
        <Stack spacing={tokens.semantic.spacing.sm / 8}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSelectWinner(SPECIAL_PLAYER_IDS.OUR_TEAM)}
            sx={{
              py: tokens.semantic.spacing.md / 8,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              minHeight: `${tokens.touch.targetComfortable}px`,
              bgcolor: tokens.semantic.color.brand.primary.main,
              "&:hover": {
                bgcolor: tokens.semantic.color.brand.primary.dark,
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
              fontWeight: tokens.typography.fontWeight.bold,
              minHeight: `${tokens.touch.targetComfortable}px`,
              bgcolor: tokens.semantic.color.brand.secondary.main,
              "&:hover": {
                bgcolor: tokens.semantic.color.brand.secondary.dark,
              },
            }}
          >
            {opponentName}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "center",
          px: `${tokens.semantic.spacing.dialogPadding}px`,
          pb: `${tokens.semantic.spacing.dialogPadding}px`,
        }}
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
