import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Alert,
} from "@mui/material";
import { FitnessCenter as PracticeIcon } from "@mui/icons-material";

interface PracticeFocusArea {
  metric: string;
  value: string;
  average: string;
  drill: string;
  description: string;
}

interface PracticePlannerDialogProps {
  open: boolean;
  onClose: () => void;
  practiceFocusAreas: PracticeFocusArea[];
}

export const PracticePlannerDialog = ({
  open,
  onClose,
  practiceFocusAreas,
}: PracticePlannerDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle
      sx={{
        fontFamily: "var(--cs-typography-fontFamily-display)",
        fontWeight: "var(--cs-typography-fontWeight-bold)",
      }}
    >
      <Stack direction="row" spacing={"var(--cs-semantic-spacing-sm)"} sx={{ alignItems: "center" }}>
        <PracticeIcon color="success" />
        <span>Practice Prescription Engine</span>
      </Stack>
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: "var(--cs-semantic-spacing-md)" }}>
        Based on this game&apos;s statistical failures compared to your season averages, the following
        focus areas and drills are recommended for your next practice.
      </Typography>
      <Stack spacing={"var(--cs-semantic-spacing-md)"}>
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
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: "var(--cs-semantic-spacing-xs)" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)", color: "var(--cs-semantic-color-feedback-error-main)" }}
                >
                  {area.metric}: {area.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Season Avg: {area.average}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)", mb: "var(--cs-semantic-spacing-xs)" }}>
                DRILL: {area.drill}
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                {area.description}
              </Typography>
            </Box>
          ))
        ) : (
          <Alert severity="success">
            Great performance! No major statistical deviations detected requiring specialized drills.
          </Alert>
        )}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
      <Button onClick={onClose}>Close</Button>
      <Button variant="contained" color="success">Export to Practice PDF</Button>
    </DialogActions>
  </Dialog>
);
