import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { FitnessCenter as PracticeIcon } from "@mui/icons-material";
import { type GameAggregates } from "../hooks/useGameAggregates";

interface PracticePlannerDialogProps {
  open: boolean;
  onClose: () => void;
  practiceFocusAreas: GameAggregates["practiceFocusAreas"];
}

export const PracticePlannerDialog: React.FC<PracticePlannerDialogProps> = ({
  open,
  onClose,
  practiceFocusAreas,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontFamily: "var(--cs-typography-fontFamily-display)",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          fontSize: "var(--cs-typography-fontSize-lg)",
        }}
      >
        <Stack
          direction="row"
          spacing="var(--cs-semantic-spacing-sm)"
          sx={{ alignItems: "center" }}
        >
          <PracticeIcon color="success" />
          <span>Practice Prescription Engine</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: "var(--cs-semantic-spacing-md)",
            fontSize: "var(--cs-typography-fontSize-sm)",
          }}
        >
          Based on this game's statistical failures compared to your season
          averages, the following focus areas and drills are recommended for
          your next practice.
        </Typography>

        <Stack spacing="var(--cs-semantic-spacing-md)">
          {practiceFocusAreas.length > 0 ? (
            practiceFocusAreas.map((area, idx) => (
              <Box
                key={idx}
                sx={{
                  p: "var(--cs-semantic-spacing-md)",
                  borderRadius: "var(--cs-semantic-shape-radius-md)",
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  border: "1px solid var(--cs-semantic-color-border-subtle)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: "var(--cs-semantic-spacing-xs)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      color: "var(--cs-semantic-color-feedback-error-main)",
                      fontSize: "var(--cs-typography-fontSize-sm)",
                    }}
                  >
                    {area.metric}: {area.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
                  >
                    Season Avg: {area.average}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    mb: "var(--cs-semantic-spacing-xs)",
                    fontSize: "var(--cs-typography-fontSize-sm)",
                  }}
                >
                  DRILL: {area.drill}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "var(--cs-typography-fontSize-xs)",
                  }}
                >
                  {area.description}
                </Typography>
              </Box>
            ))
          ) : (
            <Alert severity="success">
              Great performance! No major statistical deviations detected
              requiring specialized drills.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="success">
          Export to Practice PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
