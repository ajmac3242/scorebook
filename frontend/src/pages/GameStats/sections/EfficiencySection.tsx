import React from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";
import { MoleskineCard } from "../../components/SharedUI";

interface EfficiencySectionProps {
  paintTouchStats: { total: number; pppt: string };
  shotROI: { totalPoints: number; totalXPts: string; roi: string };
  assistNetwork: {
    edges: {
      passerId: string;
      finisherId: string;
      count: number;
      points: number;
      efg: string;
    }[];
    primaryPlaymakerId?: string;
    primaryFinisherId?: string;
  };
  opponentPlayTypeEfficiency: {
    type: string;
    ppp: string;
    efg: string;
    attempts: number;
  }[];
  shotClockEfficiency: {
    phase: string;
    attempts: number;
    points: number;
    efg: string;
  }[];
  processEfficiency: {
    quality: string;
    attempts: number;
    points: number;
    efg: string;
  }[];
  playEfficiency: {
    name: string;
    attempts: number;
    points: number;
    efg: string;
  }[];
  defensiveIntegrity: { reason: string; points: number; percentage: string }[];
  specialtyExecution: {
    situation: string;
    ppp: string;
    delta: string;
    successRate: string;
    efg: string;
  }[];
  lineupTable: React.ReactNode;
  jerseyMap: Map<string, string>;
  teamPpp: string;
  onOpenDefensiveIntegrity: () => void;
  onExpandLineups: () => void;
  onOpenAuditSubs: () => void;
}

export const EfficiencySection = ({
  paintTouchStats,
  shotROI,
  assistNetwork,
  opponentPlayTypeEfficiency,
  shotClockEfficiency,
  processEfficiency,
  playEfficiency,
  defensiveIntegrity,
  specialtyExecution,
  lineupTable,
  jerseyMap,
  teamPpp,
  onOpenDefensiveIntegrity,
  onExpandLineups,
  onOpenAuditSubs,
}: EfficiencySectionProps) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Grid container spacing={"var(--cs-semantic-spacing-md)"}>
        {/* Rim Pressure */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Rim Pressure (Paint Touches)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: "var(--cs-semantic-spacing-md)" }}
            >
              Paint touches correlate rim pressure with offensive efficiency.
              PPPT measures points generated within 15s of a paint touch.
            </Typography>
            <Grid
              container
              spacing={"var(--cs-semantic-spacing-md)"}
              sx={{ mb: "var(--cs-semantic-spacing-lg)" }}
            >
              <Grid size={{ xs: 6 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                >
                  {paintTouchStats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TOTAL TOUCHES
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    color: "var(--cs-semantic-color-feedback-success-main)",
                  }}
                >
                  {paintTouchStats.pppt}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PPPT
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: "var(--cs-semantic-spacing-md)" }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                display: "block",
                textAlign: "center",
              }}
            >
              EFFICIENCY MULTIPLIER:{" "}
              {(
                parseFloat(paintTouchStats.pppt) / (parseFloat(teamPpp) || 1)
              ).toFixed(2)}
              x
            </Typography>
          </MoleskineCard>
        </Grid>

        {/* Shot ROI */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Process Report (ROI)
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: "var(--cs-semantic-spacing-md)" }}
            >
              Compares actual scoring against Expected Points (xPTS) based on
              shot location and quality.
            </Typography>
            <Grid
              container
              spacing={"var(--cs-semantic-spacing-md)"}
              sx={{ mb: "var(--cs-semantic-spacing-lg)" }}
            >
              <Grid size={{ xs: 6 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                >
                  {shotROI.totalPoints}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ACTUAL PTS
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                    color: "var(--cs-semantic-color-brand-primary-main)",
                  }}
                >
                  {shotROI.totalXPts}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  EXPECTED PTS
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: "var(--cs-semantic-spacing-md)" }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "var(--cs-typography-fontWeight-bold)",
                  color:
                    parseFloat(shotROI.roi) >= 0
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : "var(--cs-semantic-color-feedback-error-main)",
                }}
              >
                {parseFloat(shotROI.roi) > 0 ? "+" : ""}
                {Math.round(parseFloat(shotROI.roi) * 100)}%
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
              >
                SHOT ROI
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {parseFloat(shotROI.roi) >= 0
                  ? "Over-performing relative to shot quality."
                  : "Under-performing relative to shot quality."}
              </Typography>
            </Box>
          </MoleskineCard>
        </Grid>

        {/* Assist Network */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Assist Network (Chemistry)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["CONNECTION", "FREQ", "PTS", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "CONNECTION" ? "left" : "right"}
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-xs)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assistNetwork.edges
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((edge, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={"var(--cs-semantic-spacing-xs)"}
                            sx={{ alignItems: "center" }}
                          >
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: "var(--cs-typography-fontSize-xs)",
                              }}
                            >
                              {jerseyMap.get(edge.passerId) || "??"}
                            </Avatar>
                            <Typography variant="caption">→</Typography>
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: "var(--cs-typography-fontSize-xs)",
                              }}
                            >
                              {jerseyMap.get(edge.finisherId) || "??"}
                            </Avatar>
                          </Stack>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "var(--cs-typography-fontSize-sm)" }}
                        >
                          {edge.count}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: "var(--cs-typography-fontSize-sm)" }}
                        >
                          {edge.points}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontSize: "var(--cs-typography-fontSize-sm)",
                            fontWeight: "var(--cs-typography-fontWeight-bold)",
                          }}
                        >
                          {edge.efg}%
                        </TableCell>
                      </TableRow>
                    ))}
                  {assistNetwork.edges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No assists recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {assistNetwork.primaryPlaymakerId && (
              <Box
                sx={{
                  mt: "var(--cs-semantic-spacing-md)",
                  p: "var(--cs-semantic-spacing-xs)",
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  borderRadius: "var(--cs-semantic-shape-radius-sm)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                  }}
                >
                  PRIMARY PLAYMAKER: #
                  {jerseyMap.get(assistNetwork.primaryPlaymakerId)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: "var(--cs-typography-fontWeight-bold)",
                  }}
                >
                  PRIMARY FINISHER: #
                  {jerseyMap.get(assistNetwork.primaryFinisherId ?? "")}
                </Typography>
              </Box>
            )}
          </MoleskineCard>
        </Grid>

        {/* Opponent Play Types */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Opponent Play Types
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["TYPE", "PPP", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "TYPE" ? "left" : "right"}
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-xs)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opponentPlayTypeEfficiency.map((row) => (
                    <TableRow key={row.type}>
                      <TableCell
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {row.type}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.ppp}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.efg}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {opponentPlayTypeEfficiency.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No play types recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>

        {/* Shot Rhythm */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Shot Rhythm (Clock)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                  >
                    {["Phase", "Freq", "PTS", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Phase" ? "left" : "right"}
                        sx={{
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shotClockEfficiency.map((p) => (
                    <TableRow key={p.phase}>
                      <TableCell
                        sx={{
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {p.phase}
                      </TableCell>
                      <TableCell align="right">{p.attempts}</TableCell>
                      <TableCell align="right">{p.points}</TableCell>
                      <TableCell align="right">{p.efg}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>

        {/* Process Efficiency */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Process Efficiency
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                  >
                    {["Quality", "Freq", "PTS", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Quality" ? "left" : "right"}
                        sx={{
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processEfficiency.map((p) => (
                    <TableRow key={p.quality}>
                      <TableCell
                        sx={{
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {p.quality}
                      </TableCell>
                      <TableCell align="right">{p.attempts}</TableCell>
                      <TableCell align="right">{p.points}</TableCell>
                      <TableCell align="right">{p.efg}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>

        {/* Play Efficiency */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Play Efficiency
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                  >
                    {["Play", "Freq", "PTS", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Play" ? "left" : "right"}
                        sx={{
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playEfficiency.map((play) => (
                    <TableRow key={play.name}>
                      <TableCell
                        sx={{
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {play.name}
                      </TableCell>
                      <TableCell align="right">{play.attempts}</TableCell>
                      <TableCell align="right">{play.points}</TableCell>
                      <TableCell align="right">{play.efg}%</TableCell>
                    </TableRow>
                  ))}
                  {playEfficiency.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No play-tagged shots recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>

        {/* Defensive Integrity */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}
              >
                Defensive Integrity
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={onOpenDefensiveIntegrity}
              >
                View Report
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["REASON", "PTS", "%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "REASON" ? "left" : "right"}
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-xs)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {defensiveIntegrity.slice(0, 5).map((row) => (
                    <TableRow key={row.reason}>
                      <TableCell
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {row.reason}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.points}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.percentage}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {defensiveIntegrity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No breakdown data recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>

        {/* Lineup Efficiency */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--cs-typography-fontFamily-display)" }}
              >
                Lineup Efficiency
              </Typography>
              <Stack
                direction="row"
                spacing={"var(--cs-semantic-spacing-xs)"}
                sx={{ alignItems: "center" }}
              >
                <Button size="small" onClick={onOpenAuditSubs}>
                  Audit Subs
                </Button>
                <IconButton
                  onClick={onExpandLineups}
                  aria-label="Expand Lineup Efficiency section"
                  title="Expand section"
                >
                  <ExpandIcon />
                </IconButton>
              </Stack>
            </Box>
            {lineupTable}
          </MoleskineCard>
        </Grid>

        {/* Specialty Execution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MoleskineCard>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--cs-typography-fontFamily-display)",
                mb: "var(--cs-semantic-spacing-md)",
              }}
            >
              Specialty Execution
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["SITUATION", "PPP", "Δ", "SUCCESS %", "eFG%"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "SITUATION" ? "left" : "right"}
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-xs)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {specialtyExecution.map((row) => (
                    <TableRow key={row.situation}>
                      <TableCell
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight:
                            "var(--cs-typography-fontWeight-semibold)",
                        }}
                      >
                        {row.situation}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.ppp}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                          color:
                            parseFloat(row.delta) > 0
                              ? "var(--cs-semantic-color-feedback-success-main)"
                              : parseFloat(row.delta) < 0
                                ? "var(--cs-semantic-color-feedback-error-main)"
                                : "inherit",
                        }}
                      >
                        {parseFloat(row.delta) > 0 ? "+" : ""}
                        {row.delta}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.successRate}%
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: "var(--cs-typography-fontWeight-bold)",
                        }}
                      >
                        {row.efg}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {specialtyExecution.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No situational plays recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MoleskineCard>
        </Grid>
      </Grid>
    </Grid>
  );
};
