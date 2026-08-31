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
import { useTokens } from "../../../theme/useTokens";

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
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="practice-planner-title"
    >
      <DialogTitle
        id="practice-planner-title"
        sx={{
          fontFamily: tokens.typography.fontFamily.display,
          fontWeight: tokens.typography.fontWeight.bold,
          fontSize: tokens.typography.fontSize.lg,
        }}
      >
        <Stack
          direction="row"
          spacing={`${tokens.semantic.spacing.sm}px`}
          sx={{ alignItems: "center" }}
        >
          <PracticeIcon
            sx={{ color: tokens.semantic.color.feedback.success.main }}
          />
          <span>Practice Prescription Engine</span>
        </Stack>
      </DialogTitle>
      <DialogContent role="region" aria-label="Practice recommendations list">
        <Typography
          variant="body2"
          sx={{
            mb: `${tokens.semantic.spacing.md}px`,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.semantic.color.text.secondary,
          }}
        >
          Based on this game's statistical failures compared to your season
          averages, the following focus areas and drills are recommended for
          your next practice.
        </Typography>

        <Stack spacing={`${tokens.semantic.spacing.md}px`}>
          {practiceFocusAreas.length > 0 ? (
            practiceFocusAreas.map((area, idx) => (
              <Box
                key={idx}
                sx={{
                  p: `${tokens.semantic.spacing.md}px`,
                  borderRadius: `${tokens.semantic.shape.radius.md}px`,
                  bgcolor: tokens.semantic.color.surface.subtle,
                  border: `1px solid ${tokens.semantic.color.border.subtle}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: `${tokens.semantic.spacing.xs}px`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      color: tokens.semantic.color.feedback.error.main,
                      fontSize: tokens.typography.fontSize.sm,
                    }}
                  >
                    {area.metric}: {area.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    Season Avg: {area.average}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    mb: `${tokens.semantic.spacing.xs}px`,
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  DRILL: {area.drill}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: tokens.typography.fontSize.xs,
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
      <DialogActions sx={{ p: `${tokens.semantic.spacing.md}px` }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="success">
          Export Practice PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
