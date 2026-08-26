import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
} from "@mui/material";
import { BREAKDOWN_REASONS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";

interface DefensiveBreakdownDialogProps {
  open: boolean;
  onClose: (_reason?: string) => void;
}

const DefensiveBreakdownDialog: React.FC<DefensiveBreakdownDialogProps> = ({
  open,
  onClose,
}) => {
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      fullWidth
      maxWidth="xs"
      aria-labelledby="defensive-breakdown-title"
    >
      <DialogTitle
        id="defensive-breakdown-title"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Defensive Breakdown
      </DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}>
        <Typography
          variant="body2"
          sx={{
            color: tokens.semantic.color.text.secondary,
            mb: `${tokens.semantic.spacing.md}px`,
          }}
        >
          Why was this bucket allowed? Attribution helps identify tactical
          weaknesses.
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.semantic.spacing.xs / 8,
          }}
        >
          {Object.values(BREAKDOWN_REASONS).map((reason) => (
            <Button
              key={reason}
              variant="outlined"
              fullWidth
              onClick={() => onClose(reason)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: tokens.typography.fontWeight.semibold,
                py: tokens.semantic.spacing.sm / 8,
              }}
            >
              {reason}
            </Button>
          ))}
          <Button
            onClick={() => onClose()}
            sx={{ mt: tokens.semantic.spacing.xs / 8, textTransform: "none" }}
          >
            Skip / No Reason
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DefensiveBreakdownDialog;
