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
      <DialogTitle id="jump-ball-dialog-title" sx={{ textAlign: "center" }}>
        Jump Ball Winner
        <Typography
          id="jump-ball-dialog-desc"
          variant="body2"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          Select who won the opening tip to initialize possession and the arrow.
        </Typography>
      </DialogTitle>
      <DialogContent role="region" aria-label="Opening tip winner selection">
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
              fontWeight: tokens.typography.fontWeight.bold,
              minHeight: `${tokens.touch.targetComfortable}px`,
              bgcolor: tokens.semantic.color.brand.primary.main,
              "&:hover": {
                bgcolor: tokens.semantic.color.brand.primary.dark,
              },
              "&:focus-visible": {
                outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
                outlineOffset: `${tokens.semantic.focus.offset}px`,
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
              "&:focus-visible": {
                outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
                outlineOffset: `${tokens.semantic.focus.offset}px`,
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
          pb: tokens.semantic.spacing.sm / 8,
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
