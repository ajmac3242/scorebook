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
import { useTokens } from "../../../theme/useTokens";

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
  const tokens = useTokens();

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
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Halftime Tactical Report
      </DialogTitle>
      <DialogContent sx={{ p: `${tokens.semantic.spacing.dialogPadding}px` }}>
        <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: tokens.semantic.spacing.sm / 8,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.brand.primary.main,
                display: "flex",
                alignItems: "center",
                gap: tokens.semantic.spacing.xs / 8,
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
              aria-label="Copy halftime talking points"
              sx={{ fontSize: tokens.typography.fontSize.xs }}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Box>
          <Stack
            spacing={tokens.semantic.spacing.xs / 8}
            sx={{ mb: tokens.semantic.spacing.lg / 8 }}
          >
            {talkingPoints.map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  p: tokens.semantic.spacing.md / 8,
                  borderRadius: `${tokens.semantic.shape.radius.md}px`,
                  bgcolor:
                    p.type === "OFFENSE"
                      ? tokens.semantic.color.brand.primary.light
                      : p.type === "DEFENSE"
                        ? tokens.semantic.color.feedback.error.light
                        : tokens.semantic.color.feedback.success.light,
                  opacity: 0.9,
                  borderLeft: "4px solid",
                  borderColor:
                    p.type === "OFFENSE"
                      ? tokens.semantic.color.brand.primary.main
                      : p.type === "DEFENSE"
                        ? tokens.semantic.color.feedback.error.main
                        : tokens.semantic.color.feedback.success.main,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    mb: tokens.semantic.spacing.xs / 16,
                    color: tokens.semantic.color.text.primary,
                  }}
                >
                  {p.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: tokens.semantic.color.text.secondary }}
                >
                  {p.insight}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: tokens.semantic.spacing.md / 8 }} />

        <Box
          sx={{ mb: tokens.semantic.spacing.lg / 8, textAlign: "center" }}
        >
          <Grid container spacing={tokens.semantic.spacing.sm / 8}>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.secondary,
                }}
              >
                HALF PPP
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.brand.primary.main,
                }}
              >
                {teamPpp}
              </Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.secondary,
                }}
              >
                OPP PPP
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.brand.secondary.main,
                }}
              >
                {oppPpp}
              </Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.secondary,
                }}
              >
                SEASON AVG
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.semantic.color.text.disabled,
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
                mt: tokens.semantic.spacing.xs / 8,
                display: "block",
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.feedback.error.main,
              }}
            >
              Performing{" "}
              {(parseFloat(seasonPpp) - parseFloat(teamPpp)).toFixed(2)} below
              season average
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: tokens.semantic.spacing.md / 8 }} />

        <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              mb: tokens.semantic.spacing.xs / 8,
              color: tokens.semantic.color.brand.secondary.main,
              textTransform: "uppercase",
            }}
          >
            Defensive Scheme Efficiency
          </Typography>
          <TableContainer>
            <Table size="small" aria-label="Defensive scheme efficiency">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                    }}
                  >
                    SCHEME
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
                    }}
                  >
                    POSS
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: tokens.typography.fontSize.xs,
                      fontWeight: tokens.typography.fontWeight.bold,
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
                          fontSize: tokens.typography.fontSize.sm,
                          fontWeight: tokens.typography.fontWeight.bold,
                        }}
                      >
                        {s.name}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: tokens.typography.fontSize.sm }}
                      >
                        {Math.round(s.possessions)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: tokens.typography.fontSize.sm,
                          fontWeight: tokens.typography.fontWeight.black,
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

        <Divider sx={{ mb: tokens.semantic.spacing.md / 8 }} />

        <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              mb: tokens.semantic.spacing.xs / 8,
              color: tokens.semantic.color.feedback.success.main,
              textTransform: "uppercase",
            }}
          >
            Top Performing Lineups (+/-)
          </Typography>
          <Stack spacing={tokens.semantic.spacing.xs / 8}>
            {topLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: tokens.semantic.spacing.sm / 8,
                  bgcolor: tokens.semantic.color.surface.subtle,
                  border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  borderRadius: `${tokens.semantic.shape.radius.md}px`,
                }}
              >
                <Stack direction="row" spacing={tokens.semantic.spacing.xs / 16}>
                  {l.lineup.map((pId) => (
                    <Avatar
                      key={pId}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: tokens.typography.fontSize.xs,
                      }}
                    >
                      {jerseyMap.get(pId) ?? "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                >
                  +{l.netRating}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              mb: tokens.semantic.spacing.xs / 8,
              color: tokens.semantic.color.feedback.error.main,
              textTransform: "uppercase",
            }}
          >
            Struggling Lineups (+/-)
          </Typography>
          <Stack spacing={tokens.semantic.spacing.xs / 8}>
            {bottomLineups.slice(0, 3).map((l, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: tokens.semantic.spacing.sm / 8,
                  bgcolor: tokens.semantic.color.surface.subtle,
                  border: `1px solid ${tokens.semantic.color.border.subtle}`,
                  borderRadius: `${tokens.semantic.shape.radius.md}px`,
                }}
              >
                <Stack direction="row" spacing={tokens.semantic.spacing.xs / 16}>
                  {l.lineup.map((pId) => (
                    <Avatar
                      key={pId}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: tokens.typography.fontSize.xs,
                      }}
                    >
                      {jerseyMap.get(pId) ?? "??"}
                    </Avatar>
                  ))}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                >
                  {l.netRating}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              mb: tokens.semantic.spacing.xs / 8,
              color: tokens.semantic.color.feedback.warning.main,
              textTransform: "uppercase",
            }}
          >
            Opponent Streaks & Threats
          </Typography>
          <Stack spacing={tokens.semantic.spacing.xs / 8}>
            {opponentThreats.length > 0 ? (
              opponentThreats
                .sort((a, b) => b.points - a.points)
                .slice(0, 3)
                .map((t, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: tokens.semantic.spacing.sm / 8,
                      bgcolor:
                        tokens.semantic.color.feedback.warning.light,
                      borderRadius: `${tokens.semantic.shape.radius.md}px`,
                      borderLeft: "4px solid",
                      borderColor:
                        tokens.semantic.color.feedback.warning.main,
                    }}
                  >
                    <Typography variant="body2" component="div">
                      <strong>#{t.playerId.split(":")[1] ?? "??"}</strong>:{" "}
                      {t.points} pts
                      {t.straightPoints >= 6 && (
                        <Chip
                          label={`${t.straightPoints} STRAIGHT`}
                          size="small"
                          color="error"
                          sx={{
                            height: 16,
                            fontSize: tokens.typography.fontSize.xs,
                            ml: tokens.semantic.spacing.xs / 8,
                            fontWeight: tokens.typography.fontWeight.black,
                          }}
                        />
                      )}
                    </Typography>
                  </Box>
                ))
            ) : (
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                No major opponent threats detected this half.
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Back to Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HalftimeReportDialog;
