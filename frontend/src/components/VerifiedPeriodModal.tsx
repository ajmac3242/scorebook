import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  Box,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

/**
 * @file VerifiedPeriodModal.tsx
 * @description Mandatory modal for reconciling app stats with official table at period ends.
 */

interface VerifiedPeriodModalProps {
  open: boolean;
  period: number;
  periodLabel: string;
  appScore: { team: number; opp: number };
  appFouls: { team: number; opp: number };
  onVerify: (_adjustments: {
    teamScore: number;
    oppScore: number;
    teamFouls: number;
    oppFouls: number;
  }) => void;
}

export const VerifiedPeriodModal: React.FC<VerifiedPeriodModalProps> = ({
  open,
  period,
  periodLabel,
  appScore,
  appFouls,
  onVerify,
}) => {
  const [officialTeamScore, setOfficialTeamScore] = useState(
    appScore.team.toString(),
  );
  const [officialOppScore, setOfficialOppScore] = useState(
    appScore.opp.toString(),
  );
  const [officialTeamFouls, setOfficialTeamFouls] = useState(
    appFouls.team.toString(),
  );
  const [officialOppFouls, setOfficialOppFouls] = useState(
    appFouls.opp.toString(),
  );

  const handleConfirm = () => {
    onVerify({
      teamScore: parseInt(officialTeamScore) || 0,
      oppScore: parseInt(officialOppScore) || 0,
      teamFouls: parseInt(officialTeamFouls) || 0,
      oppFouls: parseInt(officialOppFouls) || 0,
    });
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      aria-labelledby="verified-period-modal-title"
    >
      <DialogTitle
        id="verified-period-modal-title"
        sx={{
          textAlign: "center",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-primary)",
        }}
      >
        Verify {periodLabel} {period} Totals
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Typography
          variant="body2"
          sx={{
            mb: "var(--cs-semantic-spacing-lg)",
            textAlign: "center",
            color: "var(--cs-semantic-color-text-secondary)",
          }}
        >
          Please reconcile app totals with the official scorekeeper's table.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                mb: "var(--cs-semantic-spacing-sm)",
                display: "block",
                color: "var(--cs-semantic-color-brand-primary-main)",
                textTransform: "uppercase",
              }}
            >
              Our Team
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cs-semantic-spacing-md)",
              }}
            >
              <TextField
                label="Official Score"
                type="number"
                value={officialTeamScore}
                onChange={(e) => setOfficialTeamScore(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appScore.team}`}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialTeamFouls}
                onChange={(e) => setOfficialTeamFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.team}`}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                mb: "var(--cs-semantic-spacing-sm)",
                display: "block",
                color: "var(--cs-semantic-color-brand-secondary-main)",
                textTransform: "uppercase",
              }}
            >
              Opponent
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cs-semantic-spacing-md)",
              }}
            >
              <TextField
                label="Official Score"
                type="number"
                value={officialOppScore}
                onChange={(e) => setOfficialOppScore(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appScore.opp}`}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialOppFouls}
                onChange={(e) => setOfficialOppFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.opp}`}
              />
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: "var(--cs-semantic-spacing-lg)",
            p: "var(--cs-semantic-spacing-md)",
            bgcolor: "var(--cs-semantic-color-surface-subtle)",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            borderRadius: "var(--cs-semantic-shape-radius-md)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontStyle: "italic",
              color: "var(--cs-semantic-color-text-secondary)",
              display: "block",
            }}
          >
            Discrepancies will be corrected via SYSTEM_ADJUSTMENT events.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={handleConfirm}
          sx={{
            py: 1.5,
            fontWeight: "var(--cs-typography-fontWeight-bold)",
          }}
        >
          Verify & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
