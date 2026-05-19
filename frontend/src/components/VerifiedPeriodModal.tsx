import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid2 as Grid,
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
        sx={{ textAlign: "center", fontWeight: 800 }}
      >
        VERIFY {periodLabel.toUpperCase()} {period} TOTALS
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Please reconcile app totals with the official scorekeeper's table.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, mb: 1, display: "block" }}
            >
              OUR TEAM
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Official Score"
                type="number"
                value={officialTeamScore}
                onChange={(e) => setOfficialTeamScore(e.target.value)}
                size="small"
                helperText={`App: ${appScore.team}`}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialTeamFouls}
                onChange={(e) => setOfficialTeamFouls(e.target.value)}
                size="small"
                helperText={`App: ${appFouls.team}`}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, mb: 1, display: "block" }}
            >
              OPPONENT
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Official Score"
                type="number"
                value={officialOppScore}
                onChange={(e) => setOfficialOppScore(e.target.value)}
                size="small"
                helperText={`App: ${appScore.opp}`}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialOppFouls}
                onChange={(e) => setOfficialOppFouls(e.target.value)}
                size="small"
                helperText={`App: ${appFouls.opp}`}
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            Discrepancies will be corrected via SYSTEM_ADJUSTMENT events.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={handleConfirm}
          sx={{ py: 1.5, fontWeight: 800 }}
        >
          VERIFY & CONTINUE
        </Button>
      </DialogActions>
    </Dialog>
  );
};
