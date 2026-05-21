import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
} from "@mui/material";
import { BREAKDOWN_REASONS } from "../constants/stats";

interface DefensiveBreakdownDialogProps {
  open: boolean;
  onClose: (_reason?: string) => void;
}

const DefensiveBreakdownDialog: React.FC<DefensiveBreakdownDialogProps> = ({
  open,
  onClose,
}) => {
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
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-primary)",
        }}
      >
        Defensive Breakdown
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Typography
          variant="body2"
          sx={{
            color: "var(--cs-semantic-color-text-secondary)",
            mb: "var(--cs-semantic-spacing-md)",
          }}
        >
          Why was this bucket allowed? Attribution helps identify tactical
          weaknesses.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Object.values(BREAKDOWN_REASONS).map((reason) => (
            <Button
              key={reason}
              variant="outlined"
              fullWidth
              onClick={() => onClose(reason)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                py: 1.5,
              }}
            >
              {reason}
            </Button>
          ))}
          <Button
            onClick={() => onClose()}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Skip / No Reason
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DefensiveBreakdownDialog;
