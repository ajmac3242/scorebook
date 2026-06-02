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
} from "../../../utils/stats";
import {
  Assignment as AssignmentIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
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

  const [copied, setCopied] = React.useState(false);

  const handleCopyTalkingPoints = () => {
    const text = talkingPoints
      .map((p) => `[${p.type}] ${p.text}\n${p.insight}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="halftime-report-title"
    >
      <DialogTitle
        id="halftime-report-title"
        sx={{
          textAlign: "center",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-primary)",
        }}
      >
        Halftime Tactical Report
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: "var(--cs-semantic-spacing-sm)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-brand-primary-main)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                textTransform: "uppercase",
              }}
            >
              <AssignmentIcon fontSize="small" /> Halftime Talking Points
            </Typography>
            <Button
              size="small"
              startIcon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopyTalkingPoints}
              color={copied ? "success" : "primary"}
              sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Box>
          <Stack spacing={1.5} sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
            {talkingPoints.map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  p: "var(--cs-semantic-spacing-md)",
                  borderRadius: "var(--cs-semantic-shape-radius-md)",
                  bgcolor:
                    p.type === "OFFENSE"
                      ? "var(--cs-semantic-color-brand-primary-light)"
                      : p.type === "DEFENSE"
                        ? "var(--cs-semantic-color-feedback-error-light)"
                        : "var(--cs-semantic-color-feedback-success-light)",
                  opacity: 0.9,
                  borderLeft: "4px solid",
                  borderColor:
                    p.type === "OFFENSE"
                      ? "var(--cs-semantic-color-brand-primary-main)"
                      : p.type === "DEFENSE"
                        ? "var(--cs-semantic-color-feedback-error-main)"
                        : "var(--cs-semantic-color-feedback-success-main)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    mb: 0.5,
                    color: "var(--cs-semantic-color-text-primary)",
                  }}
                >
                  {p.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--cs-semantic-color-text-secondary)" }}
                >
                  {p.insight}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: "var(--cs-semantic-spacing-md)" }} />

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)", textAlign: "center" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-secondary)",
                }}
              >
                HALF PPP
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-brand-primary-main)",
                }}
              >
                {teamPpp}
              </Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-secondary)",
                }}
              >
                OPP PPP
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-brand-secondary-main)",
                }}
              >
                {oppPpp}
              </Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-secondary)",
                }}
              >
                SEASON AVG
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color: "var(--cs-semantic-color-text-disabled)",
                }}
              >
                {seasonPpp}
              </Typography>
            </Grid>
          </Grid>
          {parseFloat(teamPpp) < parseFloat(seasonPpp) && (
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: "block",
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-feedback-error-main)",
              }}
            >
              Performing{" "}
              {(parseFloat(seasonPpp) - parseFloat(teamPpp)).toFixed(2)} below
              season average
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Divider sx={{ mb: "var(--cs-semantic-spacing-md)" }} />

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              mb: 1,
              color: "var(--cs-semantic-color-brand-secondary-main)",
              textTransform: "uppercase",
            }}
          >
            Defensive Scheme Efficiency
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                    }}
                  >
                    SCHEME
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                    }}
                  >
                    POSS
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                    }}
                  >
                    PPP
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schemeEfficiency
                  .filter((s) => s.possessions > 0)
                  .map((s) => (
                    <TableRow key={s.name} hover>
                      <TableCell
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: 600,
                        }}
                      >
                        {s.name}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: "var(--cs-typography-fontSize-sm)" }}
                      >
                        {Math.round(s.possessions)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: 700,
                        }}
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

        <Divider sx={{ mb: "var(--cs-semantic-spacing-md)" }} />

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              mb: 1,
              color: "var(--cs-semantic-color-feedback-success-main)",
              textTransform: "uppercase",
            }}
          >
            Top Performing Lineups (+/-)
          </Typography>
          <Stack spacing={1}>
            {topLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: "var(--cs-semantic-spacing-sm)",
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  border: "1px solid var(--cs-semantic-color-border-subtle)",
                  borderRadius: "var(--cs-semantic-shape-radius-md)",
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

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              mb: 1,
              color: "var(--cs-semantic-color-feedback-error-main)",
              textTransform: "uppercase",
            }}
          >
            Struggling Lineups (+/-)
          </Typography>
          <Stack spacing={1}>
            {bottomLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: "var(--cs-semantic-spacing-sm)",
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  border: "1px solid var(--cs-semantic-color-border-subtle)",
                  borderRadius: "var(--cs-semantic-shape-radius-md)",
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

        <Box sx={{ mb: "var(--cs-semantic-spacing-lg)" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "var(--cs-typography-fontWeight-bold)",
              mb: 1,
              color: "var(--cs-semantic-color-feedback-warning-main)",
              textTransform: "uppercase",
            }}
          >
            Opponent Streaks & Threats
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
                      p: "var(--cs-semantic-spacing-sm)",
                      bgcolor:
                        "var(--cs-semantic-color-feedback-warning-light)",
                      borderRadius: "var(--cs-semantic-shape-radius-md)",
                      borderLeft: "4px solid",
                      borderColor:
                        "var(--cs-semantic-color-feedback-warning-main)",
                    }}
                  >
                    <Typography variant="body2" component="div">
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
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Back to Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HalftimeReportDialog;
