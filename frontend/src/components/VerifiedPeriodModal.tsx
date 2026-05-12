import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, TextField, Box } from "@mui/material";

interface VerifiedPeriodModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (data: { teamScore: number; oppScore: number; teamFouls: number; oppFouls: number }) => void;
  appData: { teamScore: number; oppScore: number; teamFouls: number; oppFouls: number; };
  period: number;
  periodLabel: string;
}

export const VerifiedPeriodModal: React.FC<VerifiedPeriodModalProps> = ({
  open,
  onClose,
  onVerify: _onVerify,
  appData,
  period,
  periodLabel,
}) => {
  const [teamScore, setTeamScore] = React.useState(appData.teamScore);
  const [oppScore, setOppScore] = React.useState(appData.oppScore);
  const [teamFouls, setTeamFouls] = React.useState(appData.teamFouls);
  const [oppFouls, setOppFouls] = React.useState(appData.oppFouls);
  React.useEffect(() => {
    setTeamScore(appData.teamScore);
    setOppScore(appData.oppScore);
    setTeamFouls(appData.teamFouls);
    setOppFouls(appData.oppFouls);
  }, [appData, open]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ textAlign: "center", fontWeight: 800 }}>Verify {periodLabel} {period} Totals</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, textAlign: "center", opacity: 0.8 }}>Match the app totals with the official scorekeeper's table before proceeding.</Typography>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "primary.main" }}>OUR TEAM</Typography>
            <TextField label="Official Score" type="number" value={teamScore} onChange={(e) => setTeamScore(parseInt(e.target.value) || 0)} fullWidth sx={{ mb: 2 }} helperText={`App shows: ${appData.teamScore}`} />
            <TextField label="Official Fouls" type="number" value={teamFouls} onChange={(e) => setTeamFouls(parseInt(e.target.value) || 0)} fullWidth helperText={`App shows: ${appData.teamFouls}`} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "secondary.main" }}>OPPONENT</Typography>
            <TextField label="Official Score" type="number" value={oppScore} onChange={(e) => setOppScore(parseInt(e.target.value) || 0)} fullWidth sx={{ mb: 2 }} helperText={`App shows: ${appData.oppScore}`} />
            <TextField label="Official Fouls" type="number" value={oppFouls} onChange={(e) => setOppFouls(parseInt(e.target.value) || 0)} fullWidth helperText={`App shows: ${appData.oppFouls}`} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, p: 2, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>SYSTEM ADJUSTMENTS</Typography>
          <Typography variant="caption" color="text.secondary">If official totals differ, the system will insert a <code>SYSTEM_ADJUSTMENT</code> event to reconcile the analytics engine.</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => _onVerify({ teamScore, oppScore, teamFouls, oppFouls })}
          sx={{ px: 4, fontWeight: 800 }}
        >
          Verify & Lock Period
        </Button>
      </DialogActions>
    </Dialog>
  );
};
