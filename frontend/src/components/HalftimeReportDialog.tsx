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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  LineupAggregates,
  OpponentThreat,
  generateHalftimeTalkingPoints,
} from "../utils/stats";
import {
  Assignment as AssignmentIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";

interface HalftimeReportDialogProps {
  open: boolean;
  onClose: () => void;
  teamPpp: string;
  oppPpp: string;
  seasonPpp: string;
  topLineups: LineupAggregates[];
  bottomLineups: LineupAggregates[];
  opponentThreats: OpponentThreat[];
  schemeEfficiency: { name: string; ppp: string; possessions: number }[];
  jerseyMap: Map<string, string | undefined>;
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
  schemeEfficiency,
  jerseyMap,
}) => {
  const talkingPoints = React.useMemo(
    () =>
      generateHalftimeTalkingPoints({
        teamPpp,
        seasonPpp,
        opponentThreats,
        topLineups,
        jerseyMap,
      }),
    [teamPpp, seasonPpp, opponentThreats, topLineups, jerseyMap],
  );

  const handleCopyTalkingPoints = () => {
    const text = talkingPoints
      .map((p) => `[${p.type}] ${p.text}\n${p.insight}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  };

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
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AssignmentIcon fontSize="small" /> HALFTIME TALKING POINTS
            </Typography>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyTalkingPoints}
              sx={{ fontSize: "0.65rem" }}
            >
              Copy
            </Button>
          </Box>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {talkingPoints.map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor:
                    p.type === "OFFENSE"
                      ? "rgba(33, 150, 243, 0.05)"
                      : p.type === "DEFENSE"
                        ? "rgba(244, 67, 54, 0.05)"
                        : "rgba(76, 175, 80, 0.05)",
                  borderLeft: "4px solid",
                  borderColor:
                    p.type === "OFFENSE"
                      ? "primary.main"
                      : p.type === "DEFENSE"
                        ? "error.main"
                        : "success.main",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, mb: 0.5 }}
                >
                  {p.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.insight}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

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
            sx={{ fontWeight: 700, mb: 1, color: "secondary.main" }}
          >
            DEFENSIVE SCHEME EFFICIENCY
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.65rem", fontWeight: 800 }}>
                    SCHEME
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                  >
                    POSS
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: "0.65rem", fontWeight: 800 }}
                  >
                    PPP
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schemeEfficiency
                  .filter((s) => s.possessions > 0)
                  .map((s) => (
                    <TableRow key={s.name}>
                      <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        {s.name}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                        {Math.round(s.possessions)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                      >
                        {s.ppp}
                      </TableCell>
                    </TableRow>
                  ))}
                {schemeEfficiency.filter((s) => s.possessions > 0).length ===
                  0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No defensive data for this half.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider sx={{ mb: 2 }} />

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
                      {jerseyMap.get(pId) || "??"}
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
                      {jerseyMap.get(pId) || "??"}
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
