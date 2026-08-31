import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Stack,
} from "@mui/material";
import { AccessTime as ClockIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";

/**
 * @file OvertimeTransitionDialog.tsx
 * @description Guided modal when regulation ends in a tie game, allowing customized overtime duration configuration.
 */

export interface OvertimeTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (_overtimeLengthMinutes: number) => void;
  period: number;
  periodLabel: string;
  currentScore: { team: number; opp: number };
  teamName: string;
  opponentName: string;
  defaultOvertimeLength?: number;
}

export const OvertimeTransitionDialog: React.FC<
  OvertimeTransitionDialogProps
> = ({
  open,
  onClose,
  onConfirm,
  period,
  periodLabel,
  currentScore,
  teamName,
  opponentName,
  defaultOvertimeLength = 5,
}) => {
  const tokens = useTokens();
  const [otLength, setOtLength] = useState<number>(defaultOvertimeLength);

  useEffect(() => {
    if (open) {
      setOtLength(defaultOvertimeLength || 5);
    }
  }, [open, defaultOvertimeLength]);

  const handleConfirm = () => {
    const validLength = Math.max(1, Math.min(20, otLength || 5));
    onConfirm(validLength);
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      aria-labelledby="overtime-transition-dialog-title"
      onClose={(_, reason) => {
        if (reason !== "escapeKeyDown") onClose();
      }}
    >
      <DialogTitle
        id="overtime-transition-dialog-title"
        sx={{
          textAlign: "center",
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Regulation Tied — Overtime
      </DialogTitle>
      <DialogContent
        role="region"
        aria-label="Overtime period setup"
        sx={{ p: tokens.semantic.spacing.dialogPadding / 8 }}
      >
        <Typography
          variant="body2"
          sx={{
            mb: tokens.semantic.spacing.md / 8,
            textAlign: "center",
            color: tokens.semantic.color.text.secondary,
          }}
        >
          {periodLabel} {period} ended in a tie. Configure the duration for the
          upcoming Overtime period.
        </Typography>

        {/* Tie Score Display */}
        <Box
          sx={{
            p: tokens.semantic.spacing.md / 8,
            bgcolor: tokens.semantic.color.surface.subtle,
            border: `1px solid ${tokens.semantic.color.border.subtle}`,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
            textAlign: "center",
            mb: tokens.semantic.spacing.lg / 8,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.feedback.warning.main,
              textTransform: "uppercase",
              display: "block",
              mb: 0.5,
            }}
          >
            TIED GAME
          </Typography>
          <Stack
            direction="row"
            sx={{ justifyContent: "center", alignItems: "center", gap: 2 }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.semantic.color.brand.primary.main,
                }}
              >
                {teamName}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: tokens.typography.fontWeight.bold }}
              >
                {currentScore.team}
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              -
            </Typography>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.semantic.color.brand.secondary.main,
                }}
              >
                {opponentName}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: tokens.typography.fontWeight.bold }}
              >
                {currentScore.opp}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Overtime Duration Configurator */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.primary,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ClockIcon
              fontSize="small"
              sx={{ color: tokens.semantic.color.text.secondary }}
            />
            Overtime Period Length
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
            {[3, 5, 10].map((preset) => (
              <Button
                key={preset}
                size="small"
                variant={otLength === preset ? "contained" : "outlined"}
                onClick={() => setOtLength(preset)}
                aria-label={`Set overtime duration to ${preset} minutes`}
                sx={{
                  flex: 1,
                  fontWeight: tokens.typography.fontWeight.bold,
                  minHeight: tokens.touch.targetComfortable,
                }}
              >
                {preset} Min
              </Button>
            ))}
          </Stack>

          <TextField
            label="Custom Duration (Minutes)"
            type="number"
            value={otLength}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setOtLength(isNaN(val) ? 0 : val);
            }}
            slotProps={{
              htmlInput: {
                min: 1,
                max: 20,
                "aria-label": "Overtime duration in minutes",
              },
            }}
            size="small"
            fullWidth
            helperText="Default length configured per team settings or standard ruleset (1-20 minutes)."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          sx={{ fontWeight: tokens.typography.fontWeight.bold }}
        >
          Start Overtime
        </Button>
      </DialogActions>
    </Dialog>
  );
};
