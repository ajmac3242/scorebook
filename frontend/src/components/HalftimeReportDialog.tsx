import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Stack,
  Avatar,
  Divider,
} from "@mui/material";
import { LineupAggregates, OpponentThreat } from "../utils/stats";

interface HalftimeReportDialogProps {
  open: boolean;
  onClose: () => void;
  teamPpp: string;
  oppPpp: string;
  topLineups: LineupAggregates[];
  bottomLineups: LineupAggregates[];
  opponentThreats: OpponentThreat[];
  jerseyMap: Map<string, string | undefined>;
}

const HalftimeReportDialog: React.FC<HalftimeReportDialogProps> = ({
  open,
  onClose,
  teamPpp,
  oppPpp,
  topLineups,
  bottomLineups,
  opponentThreats,
  jerseyMap,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: "var(--serif)", textAlign: "center", fontWeight: 700 }}>
        Halftime Tactical Report
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                TEAM PPP
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                {teamPpp}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                OPP PPP
              </Typography>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 800 }}>
                {oppPpp}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "success.main" }}>
            TOP PERFORMING LINEUPS (+/-)
          </Typography>
          <Stack spacing={1}>
            {topLineups.slice(0, 3).map((l, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
                <Stack direction="row" spacing={0.5}>
                  {l.lineup.map(pId => (
                    <Avatar key={pId} sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
                      {jerseyMap.get(pId) || "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>+{l.netRating}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "error.main" }}>
            STRUGGLING LINEUPS (+/-)
          </Typography>
          <Stack spacing={1}>
            {bottomLineups.slice(0, 3).map((l, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
                <Stack direction="row" spacing={0.5}>
                  {l.lineup.map(pId => (
                    <Avatar key={pId} sx={{ width: 24, height: 24, fontSize: "0.65rem" }}>
                      {jerseyMap.get(pId) || "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.netRating}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {opponentThreats.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "warning.main" }}>
              OPPONENT THREATS
            </Typography>
            <Stack spacing={1}>
              {opponentThreats.map((t, idx) => (
                <Typography key={idx} variant="body2">
                  <strong>#{t.playerId.split(":")[1] || "??"}</strong>: {t.points} points ({t.makes} FGM)
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Back to Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HalftimeReportDialog;
