import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTokens } from "../../../theme/useTokens";

export interface ScoreAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    _targetTeam: "TEAM" | "OPPONENT",
    _pointsDelta: number,
  ) => void | Promise<void>;
  targetTeam: "TEAM" | "OPPONENT" | null;
  teamName: string;
  currentScore: number;
}

export const ScoreAdjustmentDialog: React.FC<ScoreAdjustmentDialogProps> = ({
  open,
  onClose,
  onSave,
  targetTeam,
  teamName,
  currentScore,
}) => {
  const tokens = useTokens();
  const [overrideScore, setOverrideScore] = useState<number>(currentScore);

  useEffect(() => {
    if (open) {
      setOverrideScore(currentScore);
    }
  }, [open, currentScore, targetTeam]);

  if (!targetTeam) return null;

  const pointsDelta = overrideScore - currentScore;

  const handleQuickAdjust = (delta: number) => {
    setOverrideScore((prev) => Math.max(0, prev + delta));
  };

  const handleScoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setOverrideScore(0);
    } else {
      setOverrideScore(Math.max(0, val));
    }
  };

  const handleSave = () => {
    if (pointsDelta !== 0 && targetTeam) {
      onSave(targetTeam, pointsDelta);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="score-override-dialog-title"
    >
      <DialogTitle
        id="score-override-dialog-title"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Score Override - {teamName}
      </DialogTitle>
      <DialogContent sx={{ p: tokens.semantic.spacing.dialogPadding / 8 }}>
        <Typography
          variant="body2"
          sx={{
            color: tokens.semantic.color.text.secondary,
            mb: tokens.semantic.spacing.md / 8,
          }}
        >
          Directly adjust score for referee corrections or official table
          updates.
        </Typography>

        {/* Current vs New Score Summary */}
        <Box
          sx={{
            bgcolor: tokens.semantic.color.background.elevated,
            p: tokens.semantic.spacing.md / 8,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
            textAlign: "center",
            mb: tokens.semantic.spacing.md / 8,
          }}
        >
          <Stack
            direction="row"
            sx={{ justifyContent: "space-around", alignItems: "center" }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                CURRENT
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.primary,
                }}
              >
                {currentScore}
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              →
            </Typography>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                NEW SCORE
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color:
                    pointsDelta > 0
                      ? tokens.semantic.color.feedback.success.main
                      : pointsDelta < 0
                        ? tokens.semantic.color.feedback.error.main
                        : tokens.semantic.color.text.primary,
                }}
              >
                {overrideScore}
              </Typography>
            </Box>
          </Stack>

          {pointsDelta !== 0 && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color:
                  pointsDelta > 0
                    ? tokens.semantic.color.feedback.success.main
                    : tokens.semantic.color.feedback.error.main,
                display: "block",
                mt: 1,
              }}
            >
              Adjustment: {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta}{" "}
              pts (SYSTEM_ADJUSTMENT)
            </Typography>
          )}
        </Box>

        {/* Quick Delta Adjustment Buttons */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.semantic.color.text.secondary,
            mb: tokens.semantic.spacing.xs / 8,
            display: "block",
            textTransform: "uppercase",
          }}
        >
          Quick Adjustments
        </Typography>

        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{
            justifyContent: "center",
            mb: tokens.semantic.spacing.md / 8,
          }}
        >
          {[-3, -2, -1, 1, 2, 3].map((delta) => (
            <Tooltip
              key={delta}
              title={`${delta > 0 ? "Add" : "Subtract"} ${Math.abs(delta)} point${Math.abs(delta) > 1 ? "s" : ""}`}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleQuickAdjust(delta)}
                aria-label={`Adjust score by ${delta > 0 ? "+" : ""}${delta}`}
                color={delta > 0 ? "success" : "error"}
                sx={{
                  minWidth: 44,
                  fontWeight: tokens.typography.fontWeight.bold,
                }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </Button>
            </Tooltip>
          ))}
        </Stack>

        {/* Direct Score Numeric Input */}
        <TextField
          fullWidth
          id="direct-new-score-input"
          label="Direct New Score"
          type="number"
          value={overrideScore}
          onChange={handleScoreInputChange}
          slotProps={{ htmlInput: { min: 0, "aria-label": "Direct new score" } }}
          variant="outlined"
          size="small"
        />
      </DialogContent>

      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={pointsDelta === 0}
        >
          Save Adjustment
        </Button>
      </DialogActions>
    </Dialog>
  );
};
