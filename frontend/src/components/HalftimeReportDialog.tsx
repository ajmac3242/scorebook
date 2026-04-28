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
  Chip,
} from "@mui/material";
import { LineupAggregates, OpponentThreat } from "../utils/stats";

interface HalftimeReportDialogProps {
  open: boolean;
  onClose: () => void;
  teamPpp: string;
  oppPpp: string;
  seasonPpp: string;
  topLineups: LineupAggregates[];
  bottomLineups: LineupAggregates[];
  opponentThreats: OpponentThreat[];
  jerseyMap: Map<string, string | undefined>;
  coachNotes?: string[];
}

const HalftimeReportDialog: React.FC<HalftimeReportDialogProps> = ({
  open,
  onClose,
  teamPpp,
  oppPpp,
  seasonPpp,
  topLineups,
  bottomLineups,
  opponentThreats,
  jerseyMap,
  coachNotes = [],
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontFamily: "var(--serif)",
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        Halftime Tactical Report
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700 }}
              >
                HALF PPP
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 800 }}
              >
                {teamPpp}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700 }}
              >
                OPP PPP
              </Typography>
              <Typography
                variant="h4"
                color="secondary.main"
                sx={{ fontWeight: 800 }}
              >
                {oppPpp}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700 }}
              >
                SEASON AVG
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "grey.600" }}
              >
                {seasonPpp}
              </Typography>
            </Grid>
          </Grid>
          {parseFloat(teamPpp) < parseFloat(seasonPpp) && (
            <Typography
              variant="caption"
              color="error.main"
              sx={{ mt: 1, display: "block", fontWeight: 700 }}
            >
              Performing{" "}
              {(parseFloat(seasonPpp) - parseFloat(teamPpp)).toFixed(2)} below
              season average
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, color: "primary.dark" }}
          >
            COACH'S TACTICAL NOTES
          </Typography>
          <Box
            component="ul"
            sx={{
              p: 0,
              m: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {coachNotes.length > 0 ? (
              coachNotes.map((note, idx) => (
                <Box
                  component="li"
                  key={idx}
                  sx={{
                    p: 1.2,
                    bgcolor: "rgba(33, 150, 243, 0.05)",
                    borderRadius: 1,
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {note}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                No automated tactical insights for this half.
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, color: "success.main" }}
          >
            TOP PERFORMING LINEUPS (+/-)
          </Typography>
          <Stack spacing={1}>
            {topLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  bgcolor: "rgba(0,0,0,0.02)",
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" spacing={0.5}>
                  {l.lineup.map((pId) => (
                    <Avatar
                      key={pId}
                      sx={{ width: 24, height: 24, fontSize: "0.65rem" }}
                    >
                      {jerseyMap.get(pId) ?? "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  +{l.netRating}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, color: "error.main" }}
          >
            STRUGGLING LINEUPS (+/-)
          </Typography>
          <Stack spacing={1}>
            {bottomLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  bgcolor: "rgba(0,0,0,0.02)",
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" spacing={0.5}>
                  {l.lineup.map((pId) => (
                    <Avatar
                      key={pId}
                      sx={{ width: 24, height: 24, fontSize: "0.65rem" }}
                    >
                      {jerseyMap.get(pId) ?? "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {l.netRating}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, color: "warning.main" }}
          >
            OPPONENT STREAKS & THREATS
          </Typography>
          <Stack spacing={1}>
            {opponentThreats.length > 0 ? (
              opponentThreats
                .sort((a, b) => b.points - a.points)
                .slice(0, 3)
                .map((t, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1,
                      bgcolor: "rgba(255, 152, 0, 0.05)",
                      borderRadius: 1,
                      borderLeft: "3px solid",
                      borderColor: "warning.main",
                    }}
                  >
                    <Typography variant="body2">
                      <strong>#{t.playerId.split(":")[1] || "??"}</strong>:{" "}
                      {t.points} pts
                      {t.straightPoints >= 6 && (
                        <Chip
                          label={`${t.straightPoints} STRAIGHT`}
                          size="small"
                          color="error"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            ml: 1,
                            fontWeight: 800,
                          }}
                        />
                      )}
                    </Typography>
                  </Box>
                ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                No major opponent threats detected this half.
              </Typography>
            )}
          </Stack>
        </Box>
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
